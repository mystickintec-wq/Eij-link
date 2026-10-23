import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GestureKey, SignSequence, LandmarkPoint, SignJointPose } from '../types';
import { GESTURE_DEFINITIONS } from '../data/gestures';
import { SIGN_SEQUENCES } from '../data/signSequences';
import { computeJointPoseFromLandmarks, isValidLandmarkSet } from '../services/landmarkHandKinematics';
import { speechService } from '../services/speechService';
import { 
  Eye, 
  EyeOff, 
  RotateCcw, 
  Play, 
  Pause, 
  Sparkles, 
  Layers, 
  Box, 
  FastForward, 
  Image as ImageIcon,
  Bone,
  Check,
  Activity,
  StepForward,
  StepBack,
  Volume2,
  ListChecks,
  Camera
} from 'lucide-react';

export interface ThreeDHandViewerProps {
  activeGestureKey: GestureKey | 'neutral';
  onSelectGesture?: (key: GestureKey | 'neutral') => void;
  isSimulated?: boolean;
  liveLandmarks?: LandmarkPoint[] | null;
  handedness?: string;
  initialMode?: 'preset' | 'live' | 'sequence';
  sequence?: SignSequence | null;
  onSequenceComplete?: () => void;
  showModeTabs?: boolean;
}

// Preset joint rotational configurations for the 7 gestures + neutral pose
interface DigitPose {
  spread: number; // Z-axis abduction/adduction
  curl1: number;  // MCP flexion
  curl2: number;  // PIP flexion
  curl3: number;  // DIP flexion
}

interface PoseTargets {
  thumb: DigitPose;
  index: DigitPose;
  middle: DigitPose;
  ring: DigitPose;
  pinky: DigitPose;
  wristTilt: [number, number, number]; // [X, Y, Z]
}

const POSE_PRESETS: Record<string, PoseTargets> = {
  neutral: {
    // Natural anatomical relaxed resting hand (as seen in Blender reference Screenshot 1 & 2)
    thumb: { spread: -0.35, curl1: 0.15, curl2: 0.15, curl3: 0.1 },
    index: { spread: -0.08, curl1: 0.12, curl2: 0.15, curl3: 0.1 },
    middle: { spread: 0.0, curl1: 0.14, curl2: 0.16, curl3: 0.1 },
    ring: { spread: 0.08, curl1: 0.16, curl2: 0.18, curl3: 0.12 },
    pinky: { spread: 0.16, curl1: 0.18, curl2: 0.2, curl3: 0.14 },
    wristTilt: [0, 0, 0],
  },
  hello: {
    // Open upright palm with all fingers extended and spread naturally
    thumb: { spread: -0.45, curl1: -0.05, curl2: 0.05, curl3: 0.05 },
    index: { spread: -0.16, curl1: -0.05, curl2: 0.02, curl3: 0.02 },
    middle: { spread: 0.0, curl1: -0.05, curl2: 0.02, curl3: 0.02 },
    ring: { spread: 0.15, curl1: -0.05, curl2: 0.02, curl3: 0.02 },
    pinky: { spread: 0.28, curl1: -0.05, curl2: 0.02, curl3: 0.02 },
    wristTilt: [0, 0, 0],
  },
  thank_you: {
    // Flat hand held straight with fingers together, tilted respectfully forward
    thumb: { spread: -0.15, curl1: 0.2, curl2: 0.15, curl3: 0.1 },
    index: { spread: -0.02, curl1: 0.05, curl2: 0.05, curl3: 0.05 },
    middle: { spread: 0.0, curl1: 0.05, curl2: 0.05, curl3: 0.05 },
    ring: { spread: 0.02, curl1: 0.05, curl2: 0.05, curl3: 0.05 },
    pinky: { spread: 0.04, curl1: 0.05, curl2: 0.05, curl3: 0.05 },
    wristTilt: [-0.35, 0, 0],
  },
  yes: {
    // Thumbs-up: tight fist with thumb pointed clearly upward
    thumb: { spread: -0.3, curl1: -0.75, curl2: -0.2, curl3: 0.0 },
    index: { spread: 0.0, curl1: 1.45, curl2: 1.5, curl3: 1.1 },
    middle: { spread: 0.0, curl1: 1.5, curl2: 1.55, curl3: 1.1 },
    ring: { spread: 0.0, curl1: 1.45, curl2: 1.5, curl3: 1.1 },
    pinky: { spread: 0.0, curl1: 1.4, curl2: 1.45, curl3: 1.1 },
    wristTilt: [0.1, -0.15, 0],
  },
  no: {
    // Thumbs-down: tight fist with thumb pointed downward below wrist
    thumb: { spread: -0.35, curl1: 1.6, curl2: 0.4, curl3: 0.2 },
    index: { spread: 0.0, curl1: 1.45, curl2: 1.5, curl3: 1.1 },
    middle: { spread: 0.0, curl1: 1.5, curl2: 1.55, curl3: 1.1 },
    ring: { spread: 0.0, curl1: 1.45, curl2: 1.5, curl3: 1.1 },
    pinky: { spread: 0.0, curl1: 1.4, curl2: 1.45, curl3: 1.1 },
    wristTilt: [0.35, 0, 0.3],
  },
  help: {
    // Solid closed fist facing camera
    thumb: { spread: 0.1, curl1: 1.3, curl2: 0.9, curl3: 0.7 },
    index: { spread: 0.0, curl1: 1.45, curl2: 1.5, curl3: 1.1 },
    middle: { spread: 0.0, curl1: 1.5, curl2: 1.55, curl3: 1.1 },
    ring: { spread: 0.0, curl1: 1.45, curl2: 1.5, curl3: 1.1 },
    pinky: { spread: 0.0, curl1: 1.4, curl2: 1.45, curl3: 1.1 },
    wristTilt: [0, 0, 0],
  },
  water: {
    // Thumb and index fingertip pinched together with middle, ring, pinky raised
    thumb: { spread: -0.12, curl1: 0.75, curl2: 0.85, curl3: 0.3 },
    index: { spread: 0.0, curl1: 0.95, curl2: 0.95, curl3: 0.4 },
    middle: { spread: 0.0, curl1: 0.05, curl2: 0.05, curl3: 0.05 },
    ring: { spread: 0.06, curl1: 0.05, curl2: 0.05, curl3: 0.05 },
    pinky: { spread: 0.14, curl1: 0.05, curl2: 0.05, curl3: 0.05 },
    wristTilt: [-0.1, 0.08, 0],
  },
  please: {
    // Aligned fingers held flush side-by-side, thumb gently resting along palm
    thumb: { spread: 0.05, curl1: 0.45, curl2: 0.3, curl3: 0.1 },
    index: { spread: -0.01, curl1: 0.02, curl2: 0.02, curl3: 0.02 },
    middle: { spread: 0.0, curl1: 0.02, curl2: 0.02, curl3: 0.02 },
    ring: { spread: 0.01, curl1: 0.02, curl2: 0.02, curl3: 0.02 },
    pinky: { spread: 0.02, curl1: 0.02, curl2: 0.02, curl3: 0.02 },
    wristTilt: [-0.1, 0, -0.05],
  },
  peace: {
    // Peace / Victory V-sign: index and middle extended, ring and pinky curled
    thumb: { spread: 0.05, curl1: 1.15, curl2: 0.8, curl3: 0.3 },
    index: { spread: -0.16, curl1: -0.05, curl2: 0.0, curl3: 0.0 },
    middle: { spread: 0.16, curl1: -0.05, curl2: 0.0, curl3: 0.0 },
    ring: { spread: 0.0, curl1: 1.45, curl2: 1.5, curl3: 1.1 },
    pinky: { spread: 0.0, curl1: 1.4, curl2: 1.45, curl3: 1.1 },
    wristTilt: [0.05, 0, 0],
  },
  love: {
    // I Love You (ILY): thumb, index, pinky extended upright, middle & ring curled
    thumb: { spread: -0.4, curl1: -0.4, curl2: -0.1, curl3: 0.0 },
    index: { spread: -0.08, curl1: -0.05, curl2: 0.0, curl3: 0.0 },
    middle: { spread: 0.0, curl1: 1.5, curl2: 1.55, curl3: 1.1 },
    ring: { spread: 0.0, curl1: 1.45, curl2: 1.5, curl3: 1.1 },
    pinky: { spread: 0.25, curl1: -0.05, curl2: 0.0, curl3: 0.0 },
    wristTilt: [-0.05, 0, 0],
  },
  ok: {
    // OK / Perfect: thumb and index form circular loop, other 3 fingers extended
    thumb: { spread: -0.1, curl1: 0.85, curl2: 0.9, curl3: 0.4 },
    index: { spread: -0.05, curl1: 1.05, curl2: 1.1, curl3: 0.5 },
    middle: { spread: 0.05, curl1: -0.02, curl2: 0.0, curl3: 0.0 },
    ring: { spread: 0.12, curl1: -0.02, curl2: 0.0, curl3: 0.0 },
    pinky: { spread: 0.22, curl1: -0.02, curl2: 0.0, curl3: 0.0 },
    wristTilt: [-0.15, 0.1, 0],
  },
  call: {
    // Call Me: thumb and pinky extended outwards, middle 3 fingers curled tight
    thumb: { spread: -0.45, curl1: -0.5, curl2: -0.1, curl3: 0.0 },
    index: { spread: 0.0, curl1: 1.45, curl2: 1.5, curl3: 1.1 },
    middle: { spread: 0.0, curl1: 1.5, curl2: 1.55, curl3: 1.1 },
    ring: { spread: 0.0, curl1: 1.45, curl2: 1.5, curl3: 1.1 },
    pinky: { spread: 0.35, curl1: -0.1, curl2: 0.0, curl3: 0.0 },
    wristTilt: [0.1, -0.2, 0.2],
  },
  stop: {
    // Stop / Wait: vertical open palm pushing forward, all fingers united
    thumb: { spread: 0.05, curl1: 0.2, curl2: 0.15, curl3: 0.1 },
    index: { spread: -0.02, curl1: 0.0, curl2: 0.0, curl3: 0.0 },
    middle: { spread: 0.0, curl1: 0.0, curl2: 0.0, curl3: 0.0 },
    ring: { spread: 0.02, curl1: 0.0, curl2: 0.0, curl3: 0.0 },
    pinky: { spread: 0.04, curl1: 0.0, curl2: 0.0, curl3: 0.0 },
    wristTilt: [-0.4, 0, 0],
  },
};

type MaterialMode = 'clay' | 'wireframe' | 'armature' | 'cyber';

export const ThreeDHandViewer: React.FC<ThreeDHandViewerProps> = ({
  activeGestureKey,
  onSelectGesture,
  isSimulated = false,
  liveLandmarks = null,
  handedness = 'Right',
  initialMode = 'preset',
  sequence = null,
  onSequenceComplete,
  showModeTabs = true,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [viewerMode, setViewerMode] = useState<'preset' | 'live' | 'sequence'>(initialMode);
  const [selectedSequence, setSelectedSequence] = useState<SignSequence>(sequence || SIGN_SEQUENCES[0]);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [materialMode, setMaterialMode] = useState<MaterialMode>('clay');
  const [autoRotate, setAutoRotate] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showReferenceModal, setShowReferenceModal] = useState(false);
  const [selectedScenarioFilter, setSelectedScenarioFilter] = useState<'all' | 'classroom' | 'service' | 'daily'>('all');

  // References to Three.js elements
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const handRootRef = useRef<THREE.Group | null>(null);
  const bonesGroupRef = useRef<THREE.Group | null>(null);
  const skinGroupRef = useRef<THREE.Group | null>(null);

  // Materials references
  const clayMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const wireframeMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const cyberMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const boneMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const jointMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);

  // Joint hierarchy references for animation
  const jointsRef = useRef<{
    thumb: { mcp: THREE.Group; pip: THREE.Group; dip: THREE.Group };
    index: { mcp: THREE.Group; pip: THREE.Group; dip: THREE.Group };
    middle: { mcp: THREE.Group; pip: THREE.Group; dip: THREE.Group };
    ring: { mcp: THREE.Group; pip: THREE.Group; dip: THREE.Group };
    pinky: { mcp: THREE.Group; pip: THREE.Group; dip: THREE.Group };
  } | null>(null);

  const currentPoseRef = useRef<PoseTargets>(JSON.parse(JSON.stringify(POSE_PRESETS.neutral)));
  const targetGestureRef = useRef<string>(activeGestureKey);

  // Animation sync refs to avoid restarting WebGL loop
  const viewerModeRef = useRef<'preset' | 'live' | 'sequence'>(viewerMode);
  const liveLandmarksRef = useRef<LandmarkPoint[] | null>(liveLandmarks);
  const handednessRef = useRef<string>(handedness);
  const playbackSpeedRef = useRef<number>(playbackSpeed);
  const autoRotateRef = useRef<boolean>(autoRotate);
  const isPlayingRef = useRef<boolean>(isPlaying);
  const selectedSequenceRef = useRef<SignSequence>(selectedSequence);
  const currentStepIndexRef = useRef<number>(currentStepIndex);
  const stepTimerRef = useRef<number>(0);
  const onSequenceCompleteRef = useRef(onSequenceComplete);

  useEffect(() => {
    targetGestureRef.current = activeGestureKey;
  }, [activeGestureKey]);

  useEffect(() => {
    viewerModeRef.current = viewerMode;
  }, [viewerMode]);

  useEffect(() => {
    liveLandmarksRef.current = liveLandmarks;
  }, [liveLandmarks]);

  useEffect(() => {
    handednessRef.current = handedness;
  }, [handedness]);

  useEffect(() => {
    playbackSpeedRef.current = playbackSpeed;
  }, [playbackSpeed]);

  useEffect(() => {
    autoRotateRef.current = autoRotate;
  }, [autoRotate]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    selectedSequenceRef.current = selectedSequence;
  }, [selectedSequence]);

  useEffect(() => {
    currentStepIndexRef.current = currentStepIndex;
    stepTimerRef.current = 0;
  }, [currentStepIndex]);

  useEffect(() => {
    onSequenceCompleteRef.current = onSequenceComplete;
  }, [onSequenceComplete]);

  useEffect(() => {
    if (sequence) {
      setSelectedSequence(sequence);
      setViewerMode('sequence');
      setCurrentStepIndex(0);
      setIsPlaying(true);
    }
  }, [sequence]);

  const handleResetView = () => {
    if (cameraRef.current) {
      cameraRef.current.position.set(0, 1.4, 4.4);
      cameraRef.current.lookAt(0, 0.85, 0);
    }
    if (handRootRef.current) {
      handRootRef.current.rotation.set(0, 0, 0);
    }
  };

  const handlePrevStep = () => {
    setCurrentStepIndex((prev) => Math.max(0, prev - 1));
    stepTimerRef.current = 0;
  };

  const handleNextStep = () => {
    setCurrentStepIndex((prev) => Math.min(selectedSequence.steps.length - 1, prev + 1));
    stepTimerRef.current = 0;
  };

  const handleReplaySequence = () => {
    setCurrentStepIndex(0);
    stepTimerRef.current = 0;
    setIsPlaying(true);
  };

  const handleSpeakCurrentStep = (step: any) => {
    const def = GESTURE_DEFINITIONS[step.signKey as GestureKey];
    if (def) {
      speechService.speak(def, 'en-US');
    } else {
      speechService.speakCustomText(`${step.glossEn}. ${step.phoneticAm}`, 'en-US');
    }
  };

  // Update material visibility / mode
  useEffect(() => {
    if (!skinGroupRef.current || !bonesGroupRef.current) return;

    if (materialMode === 'armature') {
      skinGroupRef.current.visible = true;
      bonesGroupRef.current.visible = true;
      // Make skin translucent x-ray
      skinGroupRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.material = new THREE.MeshStandardMaterial({
            color: 0x64748b,
            roughness: 0.6,
            metalness: 0.1,
            transparent: true,
            opacity: 0.32,
            depthWrite: false,
          });
        }
      });
    } else if (materialMode === 'wireframe') {
      skinGroupRef.current.visible = true;
      bonesGroupRef.current.visible = false;
      skinGroupRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.material = wireframeMaterialRef.current!;
        }
      });
    } else if (materialMode === 'cyber') {
      skinGroupRef.current.visible = true;
      bonesGroupRef.current.visible = false;
      skinGroupRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.material = cyberMaterialRef.current!;
        }
      });
    } else {
      // Clean anatomical clay (matches Screenshot 1 & 2)
      skinGroupRef.current.visible = true;
      bonesGroupRef.current.visible = false;
      skinGroupRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.material = clayMaterialRef.current!;
        }
      });
    }
  }, [materialMode]);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;

    // Detect software WebGL guard
    const isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch (e) {
        return true;
      }
    })();

    // 1. Setup Scene, Camera, Renderer
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0a0f1d);
    scene.fog = new THREE.FogExp2(0x0a0f1d, 0.08);

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 520;
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 50);
    camera.position.set(0, 1.4, 4.4);
    camera.lookAt(0, 0.85, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // 2. Studio Environment Reflection
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 3. Studio PBR Lighting Rig (Warm Key Light, Cool Rim, Balanced Ambient)
    const keyLight = new THREE.DirectionalLight(0xfff7ed, 2.8);
    keyLight.position.set(3.5, 5, 4);
    keyLight.castShadow = !isSoftwareGl;
    if (keyLight.castShadow) {
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.6);
    rimLight.position.set(-4, 3, -3);
    scene.add(rimLight);

    const softFillLight = new THREE.DirectionalLight(0x10b981, 0.9);
    softFillLight.position.set(0, -2, 3);
    scene.add(softFillLight);

    const hemiLight = new THREE.HemisphereLight(0x94a3b8, 0x0f172a, 1.1);
    scene.add(hemiLight);

    // 4. Ground Contact Shadow & Pedestal Base
    const groundGeo = new THREE.PlaneGeometry(12, 12);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x070c18,
      roughness: 0.9,
      metalness: 0.1,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.65;
    ground.receiveShadow = !isSoftwareGl;
    scene.add(ground);

    // Soft Radial Shadow Under Pedestal
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 256;
    shadowCanvas.height = 256;
    const sCtx = shadowCanvas.getContext('2d');
    if (sCtx) {
      const grad = sCtx.createRadialGradient(128, 128, 10, 128, 128, 120);
      grad.addColorStop(0, 'rgba(0, 0, 0, 0.75)');
      grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.35)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      sCtx.fillStyle = grad;
      sCtx.fillRect(0, 0, 256, 256);
    }
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const contactShadow = new THREE.Mesh(
      new THREE.PlaneGeometry(2.6, 2.6),
      new THREE.MeshBasicMaterial({
        map: shadowTex,
        transparent: true,
        opacity: 0.75,
        depthWrite: false,
      })
    );
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.y = -0.64;
    scene.add(contactShadow);

    // 5. Materials Setup
    // A. Studio Gray Clay (Matching Screenshot 1 & 2)
    const clayMat = new THREE.MeshStandardMaterial({
      color: 0xcfd8dc, // Elegant anatomical clay tone
      roughness: 0.42,
      metalness: 0.12,
    });
    clayMaterialRef.current = clayMat;

    // B. Quad-Topology Wireframe Texture Material (Matching Screenshot 1)
    const quadCanvas = document.createElement('canvas');
    quadCanvas.width = 256;
    quadCanvas.height = 256;
    const qCtx = quadCanvas.getContext('2d');
    if (qCtx) {
      qCtx.fillStyle = '#b0bec5';
      qCtx.fillRect(0, 0, 256, 256);
      qCtx.strokeStyle = '#263238';
      qCtx.lineWidth = 2.5;
      // Grid lines replicating quad polygon topology
      for (let i = 0; i <= 256; i += 32) {
        qCtx.beginPath();
        qCtx.moveTo(i, 0); qCtx.lineTo(i, 256);
        qCtx.moveTo(0, i); qCtx.lineTo(256, i);
        qCtx.stroke();
      }
    }
    const quadTex = new THREE.CanvasTexture(quadCanvas);
    quadTex.wrapS = THREE.RepeatWrapping;
    quadTex.wrapT = THREE.RepeatWrapping;
    quadTex.repeat.set(4, 4);

    const wireframeMat = new THREE.MeshStandardMaterial({
      color: 0xe0e6ed,
      map: quadTex,
      roughness: 0.45,
      metalness: 0.1,
      wireframe: false,
    });
    wireframeMaterialRef.current = wireframeMat;

    // C. Cybernetic Emerald & Gold Finish
    const cyberMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.25,
      metalness: 0.85,
    });
    cyberMaterialRef.current = cyberMat;

    // D. Blender Armature Octahedral Bone Material (Matching Screenshot 2)
    const boneMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.35,
      metalness: 0.2,
    });
    boneMaterialRef.current = boneMat;

    // E. Spherical Joint Head Material (Matching Screenshot 2)
    const jointMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.2,
      metalness: 0.4,
    });
    jointMaterialRef.current = jointMat;

    // 6. Build the Anatomical Hand Hierarchy (Matching Screenshot 1 & 2)
    const handRoot = new THREE.Group();
    handRootRef.current = handRoot;
    scene.add(handRoot);

    const skinGroup = new THREE.Group();
    skinGroupRef.current = skinGroup;
    handRoot.add(skinGroup);

    const bonesGroup = new THREE.Group();
    bonesGroupRef.current = bonesGroup;
    bonesGroup.visible = false;
    handRoot.add(bonesGroup);

    // --- Helper to build an octahedral Blender-style bone mesh (Screenshot 2) ---
    function createBlenderBone(length: number, thickness: number = 0.08): THREE.Mesh {
      const geo = new THREE.BufferGeometry();
      // 6 vertices of an octahedron (base, head, and 4 middle ring points)
      const w = thickness;
      const midY = length * 0.28; // Thickest point at 28% from base
      const vertices = new Float32Array([
        // Head
        0, length, 0,
        // Ring
        -w, midY, -w,
        w, midY, -w,
        w, midY, w,
        -w, midY, w,
        // Base
        0, 0, 0,
      ]);

      const indices = [
        // Upper cone (head to ring)
        0, 1, 2,
        0, 2, 3,
        0, 3, 4,
        0, 4, 1,
        // Lower cone (ring to base)
        5, 2, 1,
        5, 3, 2,
        5, 4, 3,
        5, 1, 4,
      ];

      geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
      geo.setIndex(indices);
      geo.computeVertexNormals();

      const mesh = new THREE.Mesh(geo, boneMat);
      mesh.castShadow = !isSoftwareGl;
      return mesh;
    }

    // --- Helper for Joint Marker Sphere ---
    function createJointHead(radius: number): THREE.Mesh {
      const geo = new THREE.SphereGeometry(radius, 16, 16);
      const mesh = new THREE.Mesh(geo, jointMat);
      mesh.castShadow = !isSoftwareGl;
      return mesh;
    }

    // A. Forearm & Wrist Pedestal Base (Screenshot 1 & 2)
    const forearmGeo = new THREE.CylinderGeometry(0.38, 0.44, 0.85, 24);
    const forearmMesh = new THREE.Mesh(forearmGeo, clayMat);
    forearmMesh.position.y = -0.22;
    forearmMesh.castShadow = !isSoftwareGl;
    forearmMesh.receiveShadow = !isSoftwareGl;
    skinGroup.add(forearmMesh);

    // Pedestal bottom circular cut-off (as shown in Screenshot 1 & 2)
    const pedestalRim = new THREE.Mesh(
      new THREE.TorusGeometry(0.44, 0.02, 16, 32),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5, metalness: 0.6 })
    );
    pedestalRim.rotation.x = Math.PI / 2;
    pedestalRim.position.y = -0.64;
    skinGroup.add(pedestalRim);

    // Root Wrist Bone 0 Joint (Screenshot 2)
    const rootBoneJoint = createJointHead(0.08);
    rootBoneJoint.position.set(0, 0.2, 0);
    bonesGroup.add(rootBoneJoint);

    // B. Anatomical Palm Mesh (Contoured palmar arch & thenar pad)
    const palmGeo = new THREE.BoxGeometry(0.88, 0.75, 0.26, 6, 6, 4);
    // Taper vertices slightly to form organic thenar and hypothenar mounds
    const pPos = palmGeo.attributes.position;
    for (let i = 0; i < pPos.count; i++) {
      const y = pPos.getY(i);
      const x = pPos.getX(i);
      const z = pPos.getZ(i);
      // Arch the palm slightly forward
      pPos.setZ(i, z - (x * x) * 0.15 + (y * 0.05));
    }
    palmGeo.computeVertexNormals();

    const palmMesh = new THREE.Mesh(palmGeo, clayMat);
    palmMesh.position.set(0, 0.58, 0);
    palmMesh.castShadow = !isSoftwareGl;
    palmMesh.receiveShadow = !isSoftwareGl;
    skinGroup.add(palmMesh);

    // Metacarpal bones fanning from wrist to MCP joints (Screenshot 2)
    const metacarpalLayout = [
      { id: 5, x: -0.26, len: 0.52 }, // Index
      { id: 9, x: -0.02, len: 0.56 }, // Middle
      { id: 14, x: 0.22, len: 0.52 },  // Ring
      { id: 18, x: 0.40, len: 0.45 },  // Pinky
    ];

    metacarpalLayout.forEach((mc) => {
      const mcBone = createBlenderBone(mc.len, 0.09);
      mcBone.position.set(0, 0.2, 0);
      // Angle toward knuckle
      mcBone.rotation.z = -mc.x * 0.85;
      bonesGroup.add(mcBone);
    });

    // Thumb Metacarpal Bone 1 (Branches to the side)
    const thumbMcBone = createBlenderBone(0.42, 0.09);
    thumbMcBone.position.set(0, 0.2, 0);
    thumbMcBone.rotation.z = Math.PI / 4;
    thumbMcBone.rotation.y = 0.25;
    bonesGroup.add(thumbMcBone);

    // --- Helper to build an articulated Anatomical Finger Digit Chain ---
    function buildAnatomicalDigit(
      xOffset: number,
      yOffset: number,
      zOffset: number,
      scale: number,
      boneIds: [number, number, number],
      isThumb: boolean = false
    ) {
      // 1. MCP Knuckle Joint
      const mcpGroup = new THREE.Group();
      mcpGroup.position.set(xOffset, yOffset, zOffset);

      // Knuckle Bone Joint Head (Screenshot 2)
      const mcpJointHead = createJointHead(0.065 * scale);
      bonesGroup.add(mcpJointHead);

      // Proximal Phalanx Mesh (Skin)
      const proxLen = (isThumb ? 0.32 : 0.38) * scale;
      const proxMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.062 * scale, 0.075 * scale, proxLen, 16),
        clayMat
      );
      proxMesh.position.y = proxLen / 2;
      proxMesh.castShadow = !isSoftwareGl;
      mcpGroup.add(proxMesh);

      // Proximal Bone (Screenshot 2)
      const proxBone = createBlenderBone(proxLen, 0.065 * scale);
      mcpGroup.add(proxBone);

      // 2. PIP Joint
      const pipGroup = new THREE.Group();
      pipGroup.position.y = proxLen;

      const pipJointHead = createJointHead(0.058 * scale);
      pipGroup.add(pipJointHead);

      // Intermediate Phalanx Mesh
      const midLen = (isThumb ? 0.26 : 0.30) * scale;
      const midMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.054 * scale, 0.062 * scale, midLen, 16),
        clayMat
      );
      midMesh.position.y = midLen / 2;
      midMesh.castShadow = !isSoftwareGl;
      pipGroup.add(midMesh);

      // Intermediate Bone (Screenshot 2)
      const midBone = createBlenderBone(midLen, 0.055 * scale);
      pipGroup.add(midBone);

      // 3. DIP Joint
      const dipGroup = new THREE.Group();
      dipGroup.position.y = midLen;

      const dipJointHead = createJointHead(0.05 * scale);
      dipGroup.add(dipJointHead);

      // Distal Phalanx with rounded anatomical fingertip pad
      const tipLen = (isThumb ? 0.22 : 0.24) * scale;
      const tipGroup = new THREE.Group();
      tipGroup.position.y = tipLen / 2;

      const tipMesh = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.046 * scale, tipLen * 0.7, 8, 16),
        clayMat
      );
      tipMesh.castShadow = !isSoftwareGl;
      tipGroup.add(tipMesh);

      dipGroup.add(tipGroup);

      // Distal Bone (Screenshot 2)
      const tipBone = createBlenderBone(tipLen, 0.048 * scale);
      dipGroup.add(tipBone);

      pipGroup.add(dipGroup);
      mcpGroup.add(pipGroup);
      skinGroup.add(mcpGroup);

      return { mcp: mcpGroup, pip: pipGroup, dip: dipGroup };
    }

    // Build the 5 articulated digits matching the exact coordinates of Screenshot 1 & 2
    const thumbDigit = buildAnatomicalDigit(-0.42, 0.44, 0.06, 0.95, [1, 2, 3], true);
    thumbDigit.mcp.rotation.z = Math.PI / 3.8;
    thumbDigit.mcp.rotation.y = 0.35;

    const indexDigit = buildAnatomicalDigit(-0.26, 0.94, 0.02, 1.05, [6, 7, 8]);
    const middleDigit = buildAnatomicalDigit(-0.02, 0.98, 0.04, 1.16, [10, 12, 13]);
    const ringDigit = buildAnatomicalDigit(0.22, 0.93, 0.02, 1.05, [14, 15, 17]);
    const pinkyDigit = buildAnatomicalDigit(0.42, 0.84, -0.01, 0.88, [19, 20, 21]);

    jointsRef.current = {
      thumb: thumbDigit,
      index: indexDigit,
      middle: middleDigit,
      ring: ringDigit,
      pinky: pinkyDigit,
    };

    // 7. Interactive Orbit & Viewing Controls (Mouse & Touch Dragging)
    let isDragging = false;
    let prevMousePos = { x: 0, y: 0 };
    let targetRotationY = 0;
    let targetRotationX = 0;

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      isDragging = true;
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
      prevMousePos = { x: clientX, y: clientY };
    };

    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
      const deltaX = clientX - prevMousePos.x;
      const deltaY = clientY - prevMousePos.y;
      prevMousePos = { x: clientX, y: clientY };

      targetRotationY += deltaX * 0.01;
      targetRotationX += deltaY * 0.008;
      targetRotationX = Math.max(-0.6, Math.min(0.6, targetRotationX));
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    container.addEventListener('mousedown', onPointerDown);
    container.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);

    container.addEventListener('touchstart', onPointerDown, { passive: true });
    container.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('touchend', onPointerUp);

    // 8. Animation & Damping Render Loop (Smooth kinematic gesture transitions)
    let animationFrameId = 0;
    let lastTime = performance.now();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const now = performance.now();
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      const speed = playbackSpeedRef.current;
      const dt = Math.min(rawDt, 0.1) * speed;

      // Auto rotation when idle
      if (autoRotateRef.current && !isDragging && isPlayingRef.current) {
        targetRotationY += 0.3 * dt;
      }

      // Smooth camera / hand rotation damping
      if (handRootRef.current) {
        handRootRef.current.rotation.y = THREE.MathUtils.damp(
          handRootRef.current.rotation.y,
          targetRotationY,
          6,
          rawDt
        );
        handRootRef.current.rotation.x = THREE.MathUtils.damp(
          handRootRef.current.rotation.x,
          targetRotationX,
          6,
          rawDt
        );
      }

      // Determine Target Joint Pose based on current active mode
      let targetPose: PoseTargets = POSE_PRESETS.neutral;
      const mode = viewerModeRef.current;

      if (mode === 'live') {
        const lms = liveLandmarksRef.current;
        if (lms && lms.length === 21 && isValidLandmarkSet(lms)) {
          targetPose = computeJointPoseFromLandmarks(lms, handednessRef.current);
        } else {
          targetPose = POSE_PRESETS.neutral;
        }
      } else if (mode === 'sequence') {
        const seq = selectedSequenceRef.current;
        const sIdx = currentStepIndexRef.current;
        if (seq && seq.steps[sIdx]) {
          const step = seq.steps[sIdx];
          targetPose = POSE_PRESETS[step.signKey] || POSE_PRESETS.neutral;

          // Progress sequence timing
          if (isPlayingRef.current) {
            stepTimerRef.current += dt * 1000;
            if (stepTimerRef.current >= step.durationMs) {
              stepTimerRef.current = 0;
              if (sIdx + 1 < seq.steps.length) {
                const nextIdx = sIdx + 1;
                currentStepIndexRef.current = nextIdx;
                setCurrentStepIndex(nextIdx);
              } else {
                // Completed full sequence
                isPlayingRef.current = false;
                setIsPlaying(false);
                onSequenceCompleteRef.current?.();
              }
            }
          }
        }
      } else {
        // Preset gesture explorer mode
        targetPose = POSE_PRESETS[targetGestureRef.current] || POSE_PRESETS.neutral;
      }

      const current = currentPoseRef.current;
      const lambda = mode === 'live' ? 14 : 7.5; // High responsiveness for live camera mirroring

      // Apply to finger joint hierarchies
      const joints = jointsRef.current;
      if (joints && (isPlayingRef.current || mode === 'live')) {
        (['thumb', 'index', 'middle', 'ring', 'pinky'] as const).forEach((digit) => {
          const c = current[digit];
          const t = targetPose[digit];

          c.spread = THREE.MathUtils.damp(c.spread, t.spread, lambda, dt);
          c.curl1 = THREE.MathUtils.damp(c.curl1, t.curl1, lambda, dt);
          c.curl2 = THREE.MathUtils.damp(c.curl2, t.curl2, lambda, dt);
          c.curl3 = THREE.MathUtils.damp(c.curl3, t.curl3, lambda, dt);

          const digitJoints = joints[digit];
          if (digit === 'thumb') {
            digitJoints.mcp.rotation.z = (Math.PI / 3.8) + c.spread;
            digitJoints.mcp.rotation.x = c.curl1;
            digitJoints.pip.rotation.x = c.curl2;
            digitJoints.dip.rotation.x = c.curl3;
          } else {
            digitJoints.mcp.rotation.z = c.spread;
            digitJoints.mcp.rotation.x = c.curl1;
            digitJoints.pip.rotation.x = c.curl2;
            digitJoints.dip.rotation.x = c.curl3;
          }
        });

        // Hand wrist tilt
        current.wristTilt[0] = THREE.MathUtils.damp(current.wristTilt[0], targetPose.wristTilt[0], lambda, dt);
        current.wristTilt[1] = THREE.MathUtils.damp(current.wristTilt[1], targetPose.wristTilt[1], lambda, dt);
        current.wristTilt[2] = THREE.MathUtils.damp(current.wristTilt[2], targetPose.wristTilt[2], lambda, dt);

        if (skinGroupRef.current) {
          skinGroupRef.current.rotation.x = current.wristTilt[0];
          skinGroupRef.current.rotation.z = current.wristTilt[2];
        }
        if (bonesGroupRef.current) {
          bonesGroupRef.current.rotation.x = current.wristTilt[0];
          bonesGroupRef.current.rotation.z = current.wristTilt[2];
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // 9. Resize Handling
    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousedown', onPointerDown);
      container.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
      container.removeEventListener('touchstart', onPointerDown);
      container.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('touchend', onPointerUp);
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-[520px] md:h-[580px] rounded-3xl overflow-hidden bg-slate-950 border border-gray-200 dark:border-emerald-500/30 shadow-2xl">
      {/* 3D WebGL Canvas Container */}
      <div
        ref={mountRef}
        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing select-none"
        title="Click and drag to rotate the 3D hand"
      />

      {/* Top Header Badge & Mode Navigation Tabs */}
      <div className="absolute top-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Left: Branding Badge & Live Tracking Status */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 dark:bg-slate-900/90 border border-gray-200 dark:border-emerald-500/40 text-xs font-semibold backdrop-blur-md shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
            <span className="text-slate-900 dark:text-white font-heading">Anatomical 3D Rigged Hand</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-mono text-[11px]">• Blender Rig Sync</span>
          </div>

          {viewerMode === 'live' && (
            <div className={`px-2.5 py-1 rounded-full text-[11px] font-bold border backdrop-blur-md flex items-center gap-1.5 ${
              liveLandmarks && liveLandmarks.length === 21
                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/40'
                : 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/40'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                liveLandmarks && liveLandmarks.length === 21 ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'
              }`} />
              <span>
                {liveLandmarks && liveLandmarks.length === 21
                  ? `Live: 21 Landmarks (${handedness} Hand)`
                  : 'Live Standby: Waiting for Hand'}
              </span>
            </div>
          )}
        </div>

        {/* Center: Interactive Mode Tabs */}
        {showModeTabs && (
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-gray-200 dark:border-emerald-500/30 backdrop-blur-md pointer-events-auto shadow-md">
            <button
              onClick={() => {
                setViewerMode('preset');
                setIsPlaying(true);
              }}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewerMode === 'preset'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-gray-300 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              <span>🖐️</span>
              <span>12 Poses</span>
            </button>

            <button
              onClick={() => {
                setViewerMode('sequence');
                setIsPlaying(true);
              }}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewerMode === 'sequence'
                  ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-xs'
                  : 'text-slate-600 dark:text-gray-300 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              <ListChecks className="w-3.5 h-3.5" />
              <span>Sequences ({SIGN_SEQUENCES.length})</span>
            </button>

            <button
              onClick={() => setViewerMode('live')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewerMode === 'live'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-gray-300 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Live Mirror</span>
              {liveLandmarks && liveLandmarks.length === 21 && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>
          </div>
        )}

        {/* Right Action Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => setShowReferenceModal(true)}
            className="px-3 py-1.5 rounded-xl bg-white/90 dark:bg-slate-900/90 hover:bg-gray-100 dark:hover:bg-slate-800 text-xs font-semibold text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40 transition-all flex items-center gap-1.5 backdrop-blur-md shadow-md cursor-pointer"
            title="Compare with Blender & Quad Topology Reference Photos"
          >
            <ImageIcon className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
            <span className="hidden sm:inline">Reference Photos</span>
          </button>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="px-3 py-1.5 rounded-xl bg-white/90 dark:bg-slate-900/90 hover:bg-gray-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-gray-300 border border-gray-200 dark:border-slate-700 transition-colors flex items-center gap-1.5 backdrop-blur-md cursor-pointer"
            title="Toggle Control Dock"
          >
            {isCollapsed ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isCollapsed ? 'Show Dock' : 'Cinema Mode'}</span>
          </button>
        </div>
      </div>

      {/* Collapsible Sleek Bottom Control Dock */}
      <div
        className={`absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-[96%] max-w-[940px] transition-all duration-300 ${
          isCollapsed ? 'translate-y-36 opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
        }`}
      >
        <div className="p-3.5 sm:p-4 rounded-3xl bg-white/95 dark:bg-slate-900/95 border border-gray-200 dark:border-emerald-500/30 shadow-2xl backdrop-blur-md flex flex-col gap-3">
          {/* ========================================================= */}
          {/* TAB 1: PRESET GESTURES EXPLORER */}
          {/* ========================================================= */}
          {viewerMode === 'preset' && (
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              <button
                onClick={() => onSelectGesture?.('neutral')}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeGestureKey === 'neutral'
                    ? 'bg-gradient-to-r from-emerald-600 to-amber-500 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-slate-800/90 text-slate-700 dark:text-gray-300 hover:text-slate-950 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>🖐️</span>
                <span>Neutral Pose</span>
              </button>

              {Object.keys(GESTURE_DEFINITIONS).map((key) => {
                const def = GESTURE_DEFINITIONS[key];
                const isSelected = activeGestureKey === key;
                return (
                  <button
                    key={key}
                    onClick={() => onSelectGesture?.(key as GestureKey)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-emerald-600 to-amber-500 text-white shadow-md'
                        : 'bg-gray-100 dark:bg-slate-800/90 text-slate-700 dark:text-gray-300 hover:text-slate-950 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span>{def.emoji}</span>
                    <span>{def.labelEn}</span>
                    {def.isNew && (
                      <span className="text-[9px] px-1 py-0.2 rounded bg-amber-400 text-slate-950 font-black">
                        NEW
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: SENTENCE SEQUENCES & DEMONSTRATION SCENARIOS */}
          {/* ========================================================= */}
          {viewerMode === 'sequence' && selectedSequence && (
            <div className="space-y-3">
              {/* Scenario Category Filter Tabs */}
              <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 pb-2">
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-500 dark:text-gray-400 font-bold uppercase text-[10px]">Scenarios:</span>
                  {(['all', 'classroom', 'service', 'daily'] as const).map((sc) => (
                    <button
                      key={sc}
                      onClick={() => setSelectedScenarioFilter(sc)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize cursor-pointer transition-colors ${
                        selectedScenarioFilter === sc
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40'
                          : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {sc === 'all' ? 'All Phrases' : sc}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400">
                  <span>{selectedSequence.scenarioLabelEn}</span>
                </div>
              </div>

              {/* Sequence Selector Buttons */}
              <div className="flex flex-wrap items-center gap-1.5 max-h-24 overflow-y-auto">
                {SIGN_SEQUENCES.filter((s) => selectedScenarioFilter === 'all' || s.scenario === selectedScenarioFilter).map((seq) => (
                  <button
                    key={seq.id}
                    onClick={() => {
                      setSelectedSequence(seq);
                      setCurrentStepIndex(0);
                      stepTimerRef.current = 0;
                      setIsPlaying(true);
                    }}
                    className={`px-3 py-1 rounded-xl text-xs font-medium border transition-all flex items-center gap-1.5 cursor-pointer ${
                      selectedSequence.id === seq.id
                        ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-white border-amber-500 shadow-sm'
                        : 'bg-gray-100 dark:bg-slate-800 text-slate-700 dark:text-gray-300 border-gray-200 dark:border-slate-700 hover:border-amber-500/40'
                    }`}
                  >
                    <span>{seq.steps[0]?.emoji || '🎬'}</span>
                    <span className="font-semibold">{seq.titleEn}</span>
                    <span className="text-[10px] font-ethiopic opacity-80">({seq.titleAm})</span>
                  </button>
                ))}
              </div>

              {/* Active Step Timeline HUD */}
              {selectedSequence.steps[currentStepIndex] && (
                <div className="p-3 rounded-2xl bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{selectedSequence.steps[currentStepIndex].emoji}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 dark:text-white text-sm font-heading">
                          {selectedSequence.steps[currentStepIndex].glossEn}
                        </span>
                        <span className="text-amber-600 dark:text-amber-400 font-bold font-ethiopic text-xs">
                          {selectedSequence.steps[currentStepIndex].glossAm}
                        </span>
                        <span className="text-gray-500 text-[11px]">
                          ("{selectedSequence.steps[currentStepIndex].phoneticAm}")
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 font-mono text-[10px] font-bold">
                          Step {currentStepIndex + 1} of {selectedSequence.steps.length}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-gray-400 mt-0.5">
                        {selectedSequence.steps[currentStepIndex].description}
                      </p>
                    </div>
                  </div>

                  {/* Step Control Buttons */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleSpeakCurrentStep(selectedSequence.steps[currentStepIndex])}
                      className="p-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-slate-700 dark:text-gray-300 border border-gray-200 dark:border-slate-700 transition-colors cursor-pointer"
                      title="Speak Current Gloss Audio"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-emerald-500" />
                    </button>

                    <button
                      onClick={handlePrevStep}
                      disabled={currentStepIndex === 0}
                      className="p-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-slate-700 dark:text-gray-300 border border-gray-200 dark:border-slate-700 disabled:opacity-40 transition-colors cursor-pointer"
                      title="Previous Step"
                    >
                      <StepBack className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1 cursor-pointer shadow-sm transition-colors"
                      title={isPlaying ? 'Pause Sequence' : 'Play Sequence'}
                    >
                      {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      <span>{isPlaying ? 'Pause' : 'Play'}</span>
                    </button>

                    <button
                      onClick={handleNextStep}
                      disabled={currentStepIndex === selectedSequence.steps.length - 1}
                      className="p-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-slate-700 dark:text-gray-300 border border-gray-200 dark:border-slate-700 disabled:opacity-40 transition-colors cursor-pointer"
                      title="Next Step"
                    >
                      <StepForward className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={handleReplaySequence}
                      className="p-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-slate-700 dark:text-gray-300 border border-gray-200 dark:border-slate-700 transition-colors cursor-pointer"
                      title="Replay Full Sequence from Start"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
                    </button>
                  </div>
                </div>
              )}

              {/* Progress Timeline Segments */}
              <div className="flex items-center gap-1 w-full pt-1">
                {selectedSequence.steps.map((st, i) => (
                  <div
                    key={st.id}
                    onClick={() => {
                      setCurrentStepIndex(i);
                      stepTimerRef.current = 0;
                    }}
                    className={`h-1.5 rounded-full flex-1 transition-all cursor-pointer ${
                      i === currentStepIndex
                        ? 'bg-amber-500 ring-2 ring-amber-400/50'
                        : i < currentStepIndex
                        ? 'bg-emerald-500'
                        : 'bg-gray-200 dark:bg-slate-800'
                    }`}
                    title={`Step ${i + 1}: ${st.glossEn}`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: LIVE CAMERA MIRRORING STATUS */}
          {/* ========================================================= */}
          {viewerMode === 'live' && (
            <div className="p-3 rounded-2xl bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                  liveLandmarks && liveLandmarks.length === 21
                    ? 'bg-emerald-100 dark:bg-emerald-500/20 border-emerald-400 dark:border-emerald-500/40 text-emerald-600'
                    : 'bg-amber-100 dark:bg-amber-500/20 border-amber-400 dark:border-amber-500/40 text-amber-600'
                }`}>
                  <Activity className={`w-4 h-4 ${liveLandmarks && liveLandmarks.length === 21 ? 'animate-pulse' : ''}`} />
                </div>
                <div>
                  <div className="font-bold text-slate-900 dark:text-white font-heading">
                    {liveLandmarks && liveLandmarks.length === 21
                      ? '● Live Kinematic Landmark Mirror Active'
                      : '○ Live Mirror Standby (No Hand in Frame)'}
                  </div>
                  <p className="text-slate-500 dark:text-gray-400 text-[11px] mt-0.5">
                    {liveLandmarks && liveLandmarks.length === 21
                      ? `Streaming 21 MediaPipe coordinates directly into 15 anatomical finger bones and wrist pitch/yaw.`
                      : `3D hand is in neutral anatomical rest pose. Start camera in Mode A to mirror your movements live.`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="px-3 py-1 rounded-xl bg-gray-100 dark:bg-slate-800 font-mono text-[11px] font-bold text-slate-700 dark:text-gray-300">
                  {handedness} Hand
                </span>
                <span className="px-3 py-1 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 font-mono text-[11px] font-bold">
                  {liveLandmarks ? `${liveLandmarks.length} Points` : '0 Points'}
                </span>
              </div>
            </div>
          )}

          {/* Bottom Row: Shading Mode + Speed + Playback Toggles */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-200 dark:border-slate-800/80">
            {/* Material Shading Modes (Clay, Quad Wireframe, Blender Armature, Cyber) */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-gray-400 mr-1">Shading:</span>

              <button
                onClick={() => setMaterialMode('clay')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                  materialMode === 'clay'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border-emerald-400 dark:border-emerald-500/50'
                    : 'bg-gray-100 dark:bg-slate-800 text-slate-700 dark:text-gray-400 border-gray-200 dark:border-slate-700 hover:text-slate-950 dark:hover:text-gray-200'
                }`}
                title="Studio Anatomical Clay (Matches Screenshot 1 & 2)"
              >
                Anatomical Clay
              </button>

              <button
                onClick={() => setMaterialMode('wireframe')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                  materialMode === 'wireframe'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 border-amber-400 dark:border-amber-500/50'
                    : 'bg-gray-100 dark:bg-slate-800 text-slate-700 dark:text-gray-400 border-gray-200 dark:border-slate-700 hover:text-slate-950 dark:hover:text-gray-200'
                }`}
                title="Quad Wireframe Topology (Matches Screenshot 1)"
              >
                Quad Topology
              </button>

              <button
                onClick={() => setMaterialMode('armature')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1 cursor-pointer ${
                  materialMode === 'armature'
                    ? 'bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-300 border-sky-400 dark:border-sky-500/50'
                    : 'bg-gray-100 dark:bg-slate-800 text-slate-700 dark:text-gray-400 border-gray-200 dark:border-slate-700 hover:text-slate-950 dark:hover:text-gray-200'
                }`}
                title="Blender Skeletal Armature Rig (Matches Screenshot 2)"
              >
                <Bone className="w-3 h-3" />
                <span>Blender Rig</span>
              </button>
            </div>

            {/* Playback Controls (Play/Pause, Speed 0.5x, 1x, 1.5x) */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-slate-950 p-1 rounded-xl border border-gray-200 dark:border-slate-800">
                {[0.5, 1.0, 1.5].map((s) => (
                  <button
                    key={s}
                    onClick={() => setPlaybackSpeed(s)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer ${
                      playbackSpeed === s
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-600 dark:text-gray-400 hover:text-slate-950 dark:hover:text-white'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>

              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`p-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                  isPlaying
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/50'
                    : 'bg-gray-100 dark:bg-slate-800 text-slate-700 dark:text-gray-400 border-gray-200 dark:border-slate-700'
                }`}
                title="Play/Pause Kinematic Transition"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={() => setAutoRotate(!autoRotate)}
                className={`p-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                  autoRotate
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 border-amber-300 dark:border-amber-500/50'
                    : 'bg-gray-100 dark:bg-slate-800 text-slate-700 dark:text-gray-400 border-gray-200 dark:border-slate-700'
                }`}
                title="Toggle Auto Spin"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={handleResetView}
                className="px-2 py-1 rounded-xl text-xs font-semibold border bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-gray-300 border-gray-200 dark:border-slate-700 transition-colors cursor-pointer flex items-center gap-1"
                title="Reset Camera Angle & View"
              >
                <RotateCcw className="w-3 h-3 text-amber-500" />
                <span>Reset View</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reference Photographs Comparison Modal */}
      {showReferenceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-amber-500/40 rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-500/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white font-heading">
                    Official Reference Images for 3D Hand Model & Rig
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-gray-400">
                    Uploaded reference photographs used to engineer the 3D anatomical hand mesh & skeletal bone hierarchy.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowReferenceModal(false)}
                className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-gray-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Reference 1: Quad Mesh Topology */}
              <div className="bg-gray-50 dark:bg-slate-950 rounded-2xl p-4 border border-gray-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider font-heading">
                    Reference #1: Quad Topology
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-gray-400">Palmar & Dorsal Views</span>
                </div>
                <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-slate-800 bg-black aspect-square flex items-center justify-center">
                  <img
                    src="/assets/aistudio/Screenshot_2026-10-22_175411_ae73bd1e.png"
                    alt="Hand Quad Topology Reference"
                    className="w-full h-full object-contain"
                  />
                </div>
                <p className="text-xs text-slate-700 dark:text-gray-300 leading-relaxed">
                  Demonstrates the anatomical hand shape, natural phalanx ratios, and quad wireframe edge loop flow. Mirrored in the 3D viewer's <strong>"Quad Topology"</strong> mode.
                </p>
              </div>

              {/* Reference 2: Blender Skeletal Armature Rig */}
              <div className="bg-gray-50 dark:bg-slate-950 rounded-2xl p-4 border border-gray-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider font-heading">
                    Reference #2: Blender Armature Rig
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-gray-400">Bone 0 – 21 Hierarchy</span>
                </div>
                <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-slate-800 bg-black aspect-square flex items-center justify-center">
                  <img
                    src="/assets/aistudio/Screenshot_2026-10-22_175423_a9cf9e69.png"
                    alt="Blender Armature Hand Rig Reference"
                    className="w-full h-full object-contain"
                  />
                </div>
                <p className="text-xs text-slate-700 dark:text-gray-300 leading-relaxed">
                  Shows the octahedral skeletal bone hierarchy (Wrist 0, Thumb 1-3, Index 5-8, Middle 9-13, Ring 14-17, Pinky 18-21). Mirrored in the 3D viewer's <strong>"Blender Rig"</strong> mode.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-500/30 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
              <span>Both reference standards are actively integrated into the Three.js model above.</span>
              <button
                onClick={() => setShowReferenceModal(false)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer shadow-xs"
              >
                Back to 3D Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
