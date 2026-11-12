import { 
  FilesetResolver, 
  FaceDetector, 
  ImageSegmenter, 
  ImageSegmenterResult 
} from '@mediapipe/tasks-vision';
import { 
  DetectedFace, 
  SegmentationBackgroundMode, 
  FaceKeypoint 
} from '../types';

export type VisionServiceStatus = 'unloaded' | 'loading' | 'loaded' | 'error';

class FaceAndSegmentationService {
  private faceDetector: FaceDetector | null = null;
  private imageSegmenter: ImageSegmenter | null = null;
  private faceStatus: VisionServiceStatus = 'unloaded';
  private segmenterStatus: VisionServiceStatus = 'unloaded';
  private initPromise: Promise<void> | null = null;
  private lastFaceTimestamp: number = 0;
  private lastSegmentTimestamp: number = 0;

  // Smoothing state for face orientation to prevent visual camera jitter
  private smoothedYaw: number = 0;
  private smoothedPitch: number = 0;
  private smoothedRoll: number = 0;

  // Offscreen rendering buffers for high-performance segmentation compositing
  private offscreenCanvas: HTMLCanvasElement | null = null;
  private offscreenCtx: CanvasRenderingContext2D | null = null;
  private blurCanvas: HTMLCanvasElement | null = null;
  private blurCtx: CanvasRenderingContext2D | null = null;
  private maskCanvas: HTMLCanvasElement | null = null;
  private maskCtx: CanvasRenderingContext2D | null = null;

  // Cached latest mask data for continuous background rendering
  private latestMaskData: Float32Array | null = null;
  private latestMaskWidth: number = 0;
  private latestMaskHeight: number = 0;

  public getFaceStatus(): VisionServiceStatus {
    return this.faceStatus;
  }

  public getSegmenterStatus(): VisionServiceStatus {
    return this.segmenterStatus;
  }

  public async initialize(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    if (this.faceStatus === 'loaded' && this.segmenterStatus === 'loaded') {
      return;
    }

    this.faceStatus = 'loading';
    this.segmenterStatus = 'loading';

    this.initPromise = (async () => {
      let vision: any;
      try {
        const localWasm = typeof window !== 'undefined' ? `${window.location.origin}/wasm` : '/wasm';
        vision = await FilesetResolver.forVisionTasks(localWasm);
      } catch (e) {
        vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.1.1/wasm'
        );
      }

      // 1. Initialize MediaPipe FaceDetector
      try {
        try {
          this.faceDetector = await FaceDetector.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite',
              delegate: 'GPU',
            },
            runningMode: 'VIDEO',
            minDetectionConfidence: 0.42,
          });
        } catch (gpuErr) {
          console.warn('FaceDetector GPU fallback to CPU:', gpuErr);
          this.faceDetector = await FaceDetector.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite',
              delegate: 'CPU',
            },
            runningMode: 'VIDEO',
            minDetectionConfidence: 0.42,
          });
        }
        this.faceStatus = 'loaded';
      } catch (faceErr) {
        console.warn('FaceDetector init warning:', faceErr);
        this.faceStatus = 'error';
      }

      // 2. Initialize MediaPipe Selfie ImageSegmenter
      try {
        try {
          this.imageSegmenter = await ImageSegmenter.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite',
              delegate: 'GPU',
            },
            runningMode: 'VIDEO',
            outputConfidenceMasks: true,
            outputCategoryMask: false,
          });
        } catch (gpuErr) {
          console.warn('ImageSegmenter GPU fallback to CPU:', gpuErr);
          this.imageSegmenter = await ImageSegmenter.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite',
              delegate: 'CPU',
            },
            runningMode: 'VIDEO',
            outputConfidenceMasks: true,
            outputCategoryMask: false,
          });
        }
        this.segmenterStatus = 'loaded';
      } catch (segErr) {
        console.warn('ImageSegmenter init warning:', segErr);
        this.segmenterStatus = 'error';
      }
    })();

    return this.initPromise;
  }

  /**
   * Detects face, bounding box, 6 facial keypoints, and calculates 3D head yaw, pitch, roll.
   */
  public detectFace(video: HTMLVideoElement, timestampMs: number): DetectedFace | null {
    if (!this.faceDetector || this.faceStatus !== 'loaded' || video.readyState < 2) {
      return null;
    }

    try {
      const results = this.faceDetector.detectForVideo(video, timestampMs);
      if (!results.detections || results.detections.length === 0) {
        return null;
      }

      const det = results.detections[0];
      const score = det.categories?.[0]?.score ?? 0.9;
      const bBox = det.boundingBox || {
        originX: video.videoWidth * 0.3,
        originY: video.videoHeight * 0.15,
        width: video.videoWidth * 0.4,
        height: video.videoHeight * 0.45,
      };

      // Keypoints in BlazeFace:
      // 0: right eye
      // 1: left eye
      // 2: nose tip
      // 3: mouth center
      // 4: right ear
      // 5: left ear
      const kps = det.keypoints || [];
      const kpFallback = (idx: number, defX: number, defY: number): FaceKeypoint => ({
        x: kps[idx]?.x ?? defX,
        y: kps[idx]?.y ?? defY,
      });

      const rightEye = kpFallback(0, 0.4, 0.35);
      const leftEye = kpFallback(1, 0.6, 0.35);
      const noseTip = kpFallback(2, 0.5, 0.45);
      const mouthCenter = kpFallback(3, 0.5, 0.60);
      const rightEar = kpFallback(4, 0.3, 0.38);
      const leftEar = kpFallback(5, 0.7, 0.38);

      // --- Calculate Head Orientation (Yaw, Pitch, Roll) ---
      // Roll (head tilt sideways)
      const rawRoll = Math.atan2(leftEye.y - rightEye.y, leftEye.x - rightEye.x);

      // Yaw (head turning left / right)
      // Comparison of nose position relative to the midpoint between eyes
      const eyeMidX = (leftEye.x + rightEye.x) / 2;
      const eyeSpan = Math.max(0.04, Math.hypot(leftEye.x - rightEye.x, leftEye.y - rightEye.y));
      const rawYaw = ((noseTip.x - eyeMidX) / eyeSpan) * 1.6;

      // Pitch (head nodding up / down)
      const eyeMidY = (leftEye.y + rightEye.y) / 2;
      const faceHeightSpan = Math.max(0.04, Math.abs(mouthCenter.y - eyeMidY));
      const noseRelative = (noseTip.y - eyeMidY) / faceHeightSpan;
      const rawPitch = -(noseRelative - 0.55) * 2.2;

      // Exponential Moving Average (EMA) smoothing for stable 3D avatar head tracking
      const alpha = 0.28;
      this.smoothedYaw = this.smoothedYaw * (1 - alpha) + rawYaw * alpha;
      this.smoothedPitch = this.smoothedPitch * (1 - alpha) + rawPitch * alpha;
      this.smoothedRoll = this.smoothedRoll * (1 - alpha) + rawRoll * alpha;

      // Clamp within natural human cervical spine bounds
      const clampedYaw = Math.max(-1.1, Math.min(1.1, this.smoothedYaw));
      const clampedPitch = Math.max(-0.65, Math.min(0.65, this.smoothedPitch));
      const clampedRoll = Math.max(-0.55, Math.min(0.55, this.smoothedRoll));

      return {
        score,
        box: {
          originX: bBox.originX,
          originY: bBox.originY,
          width: bBox.width,
          height: bBox.height,
        },
        keypoints: {
          rightEye,
          leftEye,
          noseTip,
          mouthCenter,
          rightEar,
          leftEar,
        },
        orientation: {
          yaw: clampedYaw,
          pitch: clampedPitch,
          roll: clampedRoll,
          yawDeg: Math.round((clampedYaw * 180) / Math.PI),
          pitchDeg: Math.round((clampedPitch * 180) / Math.PI),
          rollDeg: Math.round((clampedRoll * 180) / Math.PI),
        },
      };
    } catch (err) {
      console.warn('Face detection error:', err);
      return null;
    }
  }

  /**
   * Applies MediaPipe Selfie Segmentation mask to separate person from background,
   * supporting Raw, High-Contrast B&W Mask, Studio Dark, Bokeh Blur, Chroma Green, and Ethiopian Heritage.
   */
  public segmentVideoFrame(
    video: HTMLVideoElement,
    targetCanvas: HTMLCanvasElement,
    backgroundMode: SegmentationBackgroundMode,
    timestampMs: number
  ): void {
    const ctx = targetCanvas.getContext('2d');
    if (!ctx || video.readyState < 2) return;

    const width = targetCanvas.width;
    const height = targetCanvas.height;

    // Fast-path: Raw video stream without background replacement
    if (backgroundMode === 'raw') {
      ctx.drawImage(video, 0, 0, width, height);
      return;
    }

    // Run MediaPipe Image Segmenter if available
    if (this.imageSegmenter && this.segmenterStatus === 'loaded') {
      try {
        this.imageSegmenter.segmentForVideo(
          video,
          timestampMs,
          (result: ImageSegmenterResult) => {
            if (result.confidenceMasks && result.confidenceMasks.length > 0) {
              const maskImage = result.confidenceMasks[0];
              this.latestMaskData = maskImage.getAsFloat32Array();
              this.latestMaskWidth = maskImage.width;
              this.latestMaskHeight = maskImage.height;
            }
          }
        );
      } catch (segErr) {
        // Fall back to cached mask or canvas processing
      }
    }

    // Initialize offscreen mask buffer
    if (!this.maskCanvas) {
      this.maskCanvas = document.createElement('canvas');
      this.maskCtx = this.maskCanvas.getContext('2d');
    }

    if (this.latestMaskData && this.latestMaskWidth > 0 && this.latestMaskHeight > 0) {
      const mWidth = this.latestMaskWidth;
      const mHeight = this.latestMaskHeight;

      if (this.maskCanvas.width !== mWidth || this.maskCanvas.height !== mHeight) {
        this.maskCanvas.width = mWidth;
        this.maskCanvas.height = mHeight;
      }

      const maskCtx = this.maskCtx;
      if (maskCtx) {
        const maskImgData = maskCtx.createImageData(mWidth, mHeight);
        const data = maskImgData.data;
        const maskFloats = this.latestMaskData;

        if (backgroundMode === 'mask') {
          // Pure Black & White Segmentation Mask (User reference: foreground white, background black)
          for (let i = 0; i < maskFloats.length; i++) {
            const conf = maskFloats[i];
            const isPerson = conf > 0.45;
            const val = isPerson ? 255 : 0;
            const pIdx = i * 4;
            data[pIdx] = val;     // R
            data[pIdx + 1] = val; // G
            data[pIdx + 2] = val; // B
            data[pIdx + 3] = 255; // Alpha
          }
          maskCtx.putImageData(maskImgData, 0, 0);
          ctx.drawImage(this.maskCanvas, 0, 0, width, height);
          return;
        }

        // For studio, blur, green, heritage: build alpha mask (foreground opaque, background transparent)
        for (let i = 0; i < maskFloats.length; i++) {
          const conf = maskFloats[i];
          const pIdx = i * 4;
          // Soft thresholding with gentle anti-aliasing edge ramp [0.25, 0.65]
          const alphaNorm = Math.max(0, Math.min(1, (conf - 0.25) / 0.40));
          data[pIdx] = 255;
          data[pIdx + 1] = 255;
          data[pIdx + 2] = 255;
          data[pIdx + 3] = Math.round(alphaNorm * 255);
        }
        maskCtx.putImageData(maskImgData, 0, 0);

        // 1. Draw Target Background
        this.drawTargetBackground(ctx, video, width, height, backgroundMode);

        // 2. Composite Person (Foreground) using mask
        if (!this.offscreenCanvas) {
          this.offscreenCanvas = document.createElement('canvas');
          this.offscreenCtx = this.offscreenCanvas.getContext('2d');
        }
        if (this.offscreenCanvas.width !== width || this.offscreenCanvas.height !== height) {
          this.offscreenCanvas.width = width;
          this.offscreenCanvas.height = height;
        }

        const offCtx = this.offscreenCtx;
        if (offCtx) {
          offCtx.save();
          offCtx.clearRect(0, 0, width, height);
          // Draw mask stretched to canvas size
          offCtx.drawImage(this.maskCanvas, 0, 0, width, height);
          // Keep only video pixels where mask is opaque
          offCtx.globalCompositeOperation = 'source-in';
          offCtx.drawImage(video, 0, 0, width, height);
          offCtx.restore();

          // Overlay segmented person onto chosen background
          ctx.drawImage(this.offscreenCanvas, 0, 0, width, height);
        }
        return;
      }
    }

    // Graceful fallback if model weights are still loading
    this.renderFallbackSegmentation(ctx, video, width, height, backgroundMode);
  }

  /**
   * Renders the stylized background based on mode
   */
  private drawTargetBackground(
    ctx: CanvasRenderingContext2D,
    video: HTMLVideoElement,
    width: number,
    height: number,
    mode: SegmentationBackgroundMode
  ) {
    if (mode === 'studio') {
      // Studio Dark (#080D18)
      ctx.fillStyle = '#080D18';
      ctx.fillRect(0, 0, width, height);

      // Subtle cyan/indigo radial glow
      const grad = ctx.createRadialGradient(
        width / 2, height * 0.4, width * 0.1,
        width / 2, height * 0.4, width * 0.75
      );
      grad.addColorStop(0, 'rgba(34, 211, 238, 0.08)');
      grad.addColorStop(0.5, 'rgba(59, 130, 246, 0.04)');
      grad.addColorStop(1, 'rgba(8, 13, 24, 0.95)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    } else if (mode === 'blur') {
      // Soft portrait bokeh blur
      ctx.save();
      ctx.filter = 'blur(16px) brightness(0.85)';
      ctx.drawImage(video, -15, -15, width + 30, height + 30);
      ctx.restore();
    } else if (mode === 'green') {
      // Broadcast Chroma Key Green
      ctx.fillStyle = '#00FF00';
      ctx.fillRect(0, 0, width, height);
    } else if (mode === 'heritage') {
      // Ethiopian cultural sign studio backdrop
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, '#042f1a');   // Deep Forest Green
      grad.addColorStop(0.5, '#2e2004'); // Warm Gold Ember
      grad.addColorStop(1, '#3b0d11');   // Deep Crimson
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Add gentle center spotlight
      const spot = ctx.createRadialGradient(
        width / 2, height * 0.45, 40,
        width / 2, height * 0.45, width * 0.55
      );
      spot.addColorStop(0, 'rgba(251, 191, 36, 0.15)');
      spot.addColorStop(1, 'rgba(0, 0, 0, 0.55)');
      ctx.fillStyle = spot;
      ctx.fillRect(0, 0, width, height);
    }
  }

  /**
   * Fallback segmentation heuristic while model compiles/loads
   */
  private renderFallbackSegmentation(
    ctx: CanvasRenderingContext2D,
    video: HTMLVideoElement,
    width: number,
    height: number,
    mode: SegmentationBackgroundMode
  ) {
    if (mode === 'mask') {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.ellipse(width * 0.5, height * 0.52, width * 0.32, height * 0.44, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      this.drawTargetBackground(ctx, video, width, height, mode);
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(width * 0.5, height * 0.52, width * 0.34, height * 0.46, 0, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(video, 0, 0, width, height);
      ctx.restore();
    }
  }

  public close() {
    if (this.faceDetector) {
      try {
        this.faceDetector.close();
      } catch (e) {
        // ignore
      }
      this.faceDetector = null;
    }
    if (this.imageSegmenter) {
      try {
        this.imageSegmenter.close();
      } catch (e) {
        // ignore
      }
      this.imageSegmenter = null;
    }
    this.faceStatus = 'unloaded';
    this.segmenterStatus = 'unloaded';
    this.initPromise = null;
    this.latestMaskData = null;
  }
}

export const faceAndSegmentationService = new FaceAndSegmentationService();
