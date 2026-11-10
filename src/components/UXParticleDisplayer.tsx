import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { CommunicationState, ThemeAccent } from '../types';
import { 
  Sparkles, 
  Mic, 
  MicOff, 
  Bot, 
  Languages, 
  Volume2, 
  CheckCircle2, 
  AlertCircle, 
  Maximize2,
  Minimize2,
  Sliders,
  RotateCcw,
  Activity,
  Zap,
  Waves,
  CircleDot,
  Radio,
  X
} from 'lucide-react';

export type ParticleMode = 'spherical-eq' | 'neural-network' | 'acoustic-waves';

export interface UXParticleDisplayerProps {
  state?: CommunicationState;
  audioLevel?: number; // 0 to 100
  accent?: ThemeAccent;
  statusText?: string;
  className?: string;
  disable3D?: boolean;
  onStateSelect?: (state: CommunicationState) => void;
  showStateControls?: boolean;
  defaultMode?: ParticleMode;
  allowLiveMic?: boolean;
}

// Color palettes for communication states
const STATE_COLORS: Record<CommunicationState, { primary: string; secondary: string; glow: string; name: string }> = {
  idle: { primary: '#22d3ee', secondary: '#3b82f6', glow: 'rgba(34, 211, 238, 0.4)', name: 'Ready / Standby' },
  listening: { primary: '#06b6d4', secondary: '#22d3ee', glow: 'rgba(6, 182, 212, 0.7)', name: 'Voice Input Active' },
  processing: { primary: '#f59e0b', secondary: '#38bdf8', glow: 'rgba(245, 158, 11, 0.65)', name: 'AI Reasoning' },
  speaking: { primary: '#38bdf8', secondary: '#818cf8', glow: 'rgba(56, 189, 248, 0.65)', name: 'Articulating Speech' },
  translating: { primary: '#a855f7', secondary: '#22d3ee', glow: 'rgba(168, 85, 247, 0.65)', name: 'Universal Translation' },
  success: { primary: '#10b981', secondary: '#34d399', glow: 'rgba(16, 185, 129, 0.65)', name: 'Action Completed' },
  error: { primary: '#f43f5e', secondary: '#fb7185', glow: 'rgba(244, 63, 94, 0.55)', name: 'Attention Needed' },
};

export const UXParticleDisplayer: React.FC<UXParticleDisplayerProps> = ({
  state = 'idle',
  audioLevel = 0,
  accent = 'cyan',
  statusText,
  className = '',
  disable3D = false,
  onStateSelect,
  showStateControls = true,
  defaultMode = 'spherical-eq',
  allowLiveMic = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [internalState, setInternalState] = useState<CommunicationState>(state);
  const [displayMode, setDisplayMode] = useState<ParticleMode>(defaultMode);
  const [particleDensity, setParticleDensity] = useState<'normal' | 'dense' | 'ultra'>('dense');
  const [isHovered, setIsHovered] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Live Microphone Web Audio API State
  const [isLiveMicActive, setIsLiveMicActive] = useState(false);
  const [micAudioLevel, setMicAudioLevel] = useState(0);
  const [micFrequencyBins, setMicFrequencyBins] = useState<number[]>([0, 0, 0, 0, 0]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animFrameMicRef = useRef<number | null>(null);

  // Mouse / Pointer coordinates for interactive attraction
  const pointerPosRef = useRef<{ x: number; y: number; active: boolean }>({ x: 0, y: 0, active: false });

  // Sync internal state with prop
  useEffect(() => {
    setInternalState(state);
  }, [state]);

  const activeColors = STATE_COLORS[internalState] || STATE_COLORS.idle;
  const currentAudioLevel = isLiveMicActive ? micAudioLevel : audioLevel;

  // Live Microphone Handler
  const toggleLiveMic = async () => {
    if (isLiveMicActive) {
      // Stop Live Mic
      if (animFrameMicRef.current) cancelAnimationFrame(animFrameMicRef.current);
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((t) => t.stop());
        micStreamRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        try {
          await audioContextRef.current.close();
        } catch (e) {
          console.warn('AudioContext close error:', e);
        }
        audioContextRef.current = null;
      }
      analyserRef.current = null;
      setIsLiveMicActive(false);
      setMicAudioLevel(0);
      setMicFrequencyBins([0, 0, 0, 0, 0]);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        micStreamRef.current = stream;
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioContextClass();
        audioContextRef.current = audioCtx;

        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 128;
        analyser.smoothingTimeConstant = 0.75;
        analyserRef.current = analyser;

        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);

        setIsLiveMicActive(true);
        if (internalState === 'idle') {
          handleSelectState('listening');
        }

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const pollMic = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);

          // Calculate average energy
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          const normalized = Math.min(100, Math.round((avg / 128) * 100));
          setMicAudioLevel(normalized);

          // 5-band frequency snapshot (Bass, Low-Mid, Mid, High-Mid, Treble)
          const bands = 5;
          const step = Math.floor(dataArray.length / bands);
          const binValues: number[] = [];
          for (let b = 0; b < bands; b++) {
            let bSum = 0;
            for (let k = b * step; k < (b + 1) * step; k++) {
              bSum += dataArray[k] || 0;
            }
            binValues.push(Math.round((bSum / step / 255) * 100));
          }
          setMicFrequencyBins(binValues);

          animFrameMicRef.current = requestAnimationFrame(pollMic);
        };

        pollMic();
      } catch (err: any) {
        console.warn('Microphone permission denied or unsupported:', err);
        setIsLiveMicActive(false);
      }
    }
  };

  // Cleanup Live Mic on unmount
  useEffect(() => {
    return () => {
      if (animFrameMicRef.current) cancelAnimationFrame(animFrameMicRef.current);
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  // Three.js Render Canvas Engine
  useEffect(() => {
    if (disable3D) return;
    const container = containerRef.current;
    if (!container) return;

    // Detect software-rendered WebGL to guard performance
    const isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    const scene = new THREE.Scene();
    const width = container.clientWidth || 360;
    const height = container.clientHeight || 360;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 4.4;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: !isSoftwareGl,
        powerPreference: isSoftwareGl ? 'low-power' : 'high-performance',
      });
      renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
      renderer.setSize(width, height);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      container.appendChild(renderer.domElement);
    } catch (e) {
      console.warn('Could not initialize Three.js renderer for UX Particle Displayer:', e);
      return;
    }

    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // Particle Density determination
    const baseCount = particleDensity === 'normal' ? 220 : particleDensity === 'dense' ? 440 : 660;
    const particleCount = isSoftwareGl ? Math.min(baseCount, 180) : baseCount;

    // 1. Geodesic Core / Center Orb (for Spherical EQ mode)
    const coreDetail = isSoftwareGl ? 1 : 2;
    const coreGeometry = new THREE.IcosahedronGeometry(1.0, coreDetail);
    const coreWireframe = new THREE.WireframeGeometry(coreGeometry);
    const coreMaterial = new THREE.LineBasicMaterial({
      color: new THREE.Color(activeColors.primary),
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
    });
    const coreMesh = new THREE.LineSegments(coreWireframe, coreMaterial);
    rootGroup.add(coreMesh);

    // Inner Glowing Core
    const innerSphereGeo = new THREE.SphereGeometry(0.72, 16, 16);
    const innerSphereMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(activeColors.primary),
      transparent: true,
      opacity: 0.2,
      blending: THREE.AdditiveBlending,
    });
    const innerSphere = new THREE.Mesh(innerSphereGeo, innerSphereMat);
    rootGroup.add(innerSphere);

    // 2. Concentric Frequency Rings (Acoustic Wave Mode)
    const ringCount = 4;
    const rings: THREE.LineLoop[] = [];
    const ringMaterials: THREE.LineBasicMaterial[] = [];

    for (let r = 0; r < ringCount; r++) {
      const ringGeo = new THREE.BufferGeometry();
      const segments = 64;
      const positions = new Float32Array((segments + 1) * 3);
      const baseRadius = 1.1 + r * 0.26;

      for (let s = 0; s <= segments; s++) {
        const theta = (s / segments) * Math.PI * 2;
        positions[s * 3] = Math.cos(theta) * baseRadius;
        positions[s * 3 + 1] = Math.sin(theta) * baseRadius;
        positions[s * 3 + 2] = 0;
      }
      ringGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      const ringMat = new THREE.LineBasicMaterial({
        color: new THREE.Color(activeColors.secondary),
        transparent: true,
        opacity: 0.4 - r * 0.07,
        blending: THREE.AdditiveBlending,
      });
      ringMaterials.push(ringMat);

      const ring = new THREE.LineLoop(ringGeo, ringMat);
      ring.rotation.x = (r * Math.PI) / 3.5;
      ring.rotation.y = (r * Math.PI) / 4.5;
      rings.push(ring);
      rootGroup.add(ring);
    }

    // 3. Dynamic Particle Cloud Field
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);
    const originalPositions = new Float32Array(particleCount * 3);
    const particleVelocities = new Float32Array(particleCount * 3);

    const primCol = new THREE.Color(activeColors.primary);
    const secCol = new THREE.Color(activeColors.secondary);

    for (let i = 0; i < particleCount; i++) {
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = 2 * Math.PI * Math.random();
      const radius = 1.35 + Math.random() * 0.9;

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);

      particlePositions[i * 3] = x;
      particlePositions[i * 3 + 1] = y;
      particlePositions[i * 3 + 2] = z;

      originalPositions[i * 3] = x;
      originalPositions[i * 3 + 1] = y;
      originalPositions[i * 3 + 2] = z;

      particleVelocities[i * 3] = (Math.random() - 0.5) * 0.02;
      particleVelocities[i * 3 + 1] = (Math.random() - 0.5) * 0.02;
      particleVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02;

      const mix = Math.random();
      const col = mix > 0.45 ? primCol : secCol;
      particleColors[i * 3] = col.r;
      particleColors[i * 3 + 1] = col.g;
      particleColors[i * 3 + 2] = col.b;
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: particleDensity === 'ultra' ? 0.055 : 0.07,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    rootGroup.add(particles);

    // 4. Neural Network Synaptic Lines
    const maxLines = 160;
    const linePositions = new Float32Array(maxLines * 6);
    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));

    const lineMaterial = new THREE.LineBasicMaterial({
      color: new THREE.Color(activeColors.primary),
      transparent: true,
      opacity: 0.25,
      blending: THREE.AdditiveBlending,
    });
    const neuralLines = new THREE.LineSegments(lineGeometry, lineMaterial);
    rootGroup.add(neuralLines);

    // Pointer Interaction (Drag & Coordinates)
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let targetRotX = 0;
    let targetRotY = 0;

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const normX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const normY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      pointerPosRef.current = { x: normX, y: normY, active: true };

      if (isDragging) {
        const dx = e.clientX - prevMouseX;
        const dy = e.clientY - prevMouseY;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;

        targetRotY += dx * 0.008;
        targetRotX += dy * 0.008;
      }
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    const onPointerLeave = () => {
      isDragging = false;
      pointerPosRef.current.active = false;
    };

    const dom = renderer.domElement;
    dom.addEventListener('pointerdown', onPointerDown);
    dom.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    dom.addEventListener('pointerleave', onPointerLeave);

    const onResize = () => {
      if (!container || !renderer) return;
      const w = container.clientWidth || 360;
      const h = container.clientHeight || 360;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // Animation Clock & Loop
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Smooth interaction rotation
      rootGroup.rotation.y += (targetRotY - rootGroup.rotation.y) * 0.08;
      rootGroup.rotation.x += (targetRotX - rootGroup.rotation.x) * 0.08;

      const normAudio = Math.min(1.0, currentAudioLevel / 100);
      const currentPalette = STATE_COLORS[internalState] || STATE_COLORS.idle;

      // Update color interpolation
      const targetPrim = new THREE.Color(currentPalette.primary);
      const targetSec = new THREE.Color(currentPalette.secondary);
      coreMaterial.color.lerp(targetPrim, 0.1);
      innerSphereMat.color.lerp(targetPrim, 0.1);
      lineMaterial.color.lerp(targetPrim, 0.1);
      ringMaterials.forEach((m) => m.color.lerp(targetSec, 0.1));

      // Display Mode Specific Visibility
      if (displayMode === 'spherical-eq') {
        coreMesh.visible = true;
        innerSphere.visible = true;
        neuralLines.visible = false;
        rings.forEach((r) => (r.visible = true));
      } else if (displayMode === 'neural-network') {
        coreMesh.visible = true;
        innerSphere.visible = true;
        neuralLines.visible = true;
        rings.forEach((r) => (r.visible = false));
      } else if (displayMode === 'acoustic-waves') {
        coreMesh.visible = false;
        innerSphere.visible = true;
        neuralLines.visible = false;
        rings.forEach((r) => (r.visible = true));
      }

      // State-specific procedural behaviors
      if (internalState === 'idle') {
        targetRotY += delta * 0.28;
        const breath = 1.0 + Math.sin(elapsed * 1.6) * 0.04;
        coreMesh.scale.set(breath, breath, breath);
        innerSphere.scale.set(breath, breath, breath);

        rings.forEach((r, idx) => {
          r.rotation.z += delta * (0.2 + idx * 0.1);
        });
      } else if (internalState === 'listening') {
        targetRotY += delta * 0.45;
        const pulse = 1.0 + normAudio * 0.4 + Math.sin(elapsed * 6.0) * 0.05;
        coreMesh.scale.set(pulse, pulse, pulse);
        innerSphere.scale.set(pulse * 0.9, pulse * 0.9, pulse * 0.9);

        rings.forEach((r, idx) => {
          const waveScale = 1.0 + normAudio * (0.5 + idx * 0.25);
          r.scale.set(waveScale, waveScale, waveScale);
          r.rotation.z += delta * (0.6 + normAudio * 2.0);
        });
      } else if (internalState === 'processing') {
        targetRotY += delta * 1.5;
        targetRotX += Math.sin(elapsed * 2.2) * delta * 0.45;
        const flux = 1.0 + Math.sin(elapsed * 9.0) * 0.08;
        coreMesh.scale.set(flux, flux, flux);

        rings.forEach((r, idx) => {
          r.rotation.x += delta * (1.3 + idx * 0.7);
          r.rotation.y += delta * (0.9 + idx * 0.5);
        });
      } else if (internalState === 'speaking') {
        targetRotY += delta * 0.55;
        const speechAmp = 1.0 + normAudio * 0.38 + Math.sin(elapsed * 8.0) * 0.06;
        coreMesh.scale.set(speechAmp, speechAmp, speechAmp);
        innerSphere.scale.set(speechAmp * 0.95, speechAmp * 0.95, speechAmp * 0.95);

        rings.forEach((r, idx) => {
          const rScale = 1.0 + normAudio * (0.4 + idx * 0.3);
          r.scale.set(rScale, rScale, rScale);
          r.rotation.z -= delta * (0.9 + normAudio * 2.2);
        });
      } else if (internalState === 'translating') {
        targetRotY += delta * 0.9;
        const morph = Math.sin(elapsed * 3.2) * 0.35;
        coreMesh.rotation.y += delta * 1.3;
        coreMesh.rotation.z = morph;

        if (rings[0]) rings[0].rotation.z += delta * 1.2;
        if (rings[1]) rings[1].rotation.x += delta * 1.0;
        if (rings[2]) rings[2].rotation.y += delta * 1.4;
      } else if (internalState === 'success') {
        const burst = 1.0 + Math.sin(Math.min(Math.PI, elapsed * 3.0)) * 0.2;
        coreMesh.scale.set(burst, burst, burst);
        rings.forEach((r) => r.scale.set(burst * 1.2, burst * 1.2, burst * 1.2));
      } else if (internalState === 'error') {
        const slowWarn = 1.0 + Math.sin(elapsed * 2.5) * 0.05;
        coreMesh.scale.set(slowWarn, slowWarn, slowWarn);
      }

      // Update Particle Physics & Displacements
      const posArr = particleGeometry.attributes.position.array as Float32Array;
      const pointer = pointerPosRef.current;

      for (let i = 0; i < particleCount; i++) {
        const ox = originalPositions[i * 3];
        const oy = originalPositions[i * 3 + 1];
        const oz = originalPositions[i * 3 + 2];

        if (displayMode === 'spherical-eq') {
          // Spherical Equalizer Mode: Harmonic spherical waves
          const harmonic = Math.sin(elapsed * 4.0 + ox * 3.0) * Math.cos(elapsed * 3.0 + oy * 3.0);
          const distScale = 1.0 + normAudio * 0.55 + harmonic * 0.08;
          posArr[i * 3] = ox * distScale;
          posArr[i * 3 + 1] = oy * distScale;
          posArr[i * 3 + 2] = oz * distScale;
        } else if (displayMode === 'neural-network') {
          // Neural Synapses Mode: Constellation orbits
          const clusterSign = i % 2 === 0 ? 1 : -1;
          const drift = Math.sin(elapsed * 1.5 + i) * 0.06;
          posArr[i * 3] = ox * 0.9 + drift * clusterSign;
          posArr[i * 3 + 1] = oy * 0.9 + Math.cos(elapsed * 1.2 + i) * 0.06;
          posArr[i * 3 + 2] = oz * 0.9 + Math.sin(elapsed * 1.8 + i) * 0.06;
        } else if (displayMode === 'acoustic-waves') {
          // Acoustic Wave Mode: Undulating ripples along Z-plane
          const wave = Math.sin(elapsed * 5.0 + Math.sqrt(ox * ox + oy * oy) * 4.0);
          const amp = 0.2 + normAudio * 0.45;
          posArr[i * 3] = ox;
          posArr[i * 3 + 1] = oy;
          posArr[i * 3 + 2] = oz + wave * amp;
        }

        // Pointer Attraction / Swirl effect
        if (pointer.active) {
          const dx = posArr[i * 3] - pointer.x * 2.0;
          const dy = posArr[i * 3 + 1] - pointer.y * 2.0;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 1.2) {
            const pull = (1.2 - dist) * 0.12;
            posArr[i * 3] -= dx * pull;
            posArr[i * 3 + 1] -= dy * pull;
          }
        }
      }
      particleGeometry.attributes.position.needsUpdate = true;

      // Update Neural Connecting Lines
      if (displayMode === 'neural-network') {
        const lineArr = lineGeometry.attributes.position.array as Float32Array;
        let lineIdx = 0;
        const maxDist = 0.65 + normAudio * 0.25;

        for (let i = 0; i < Math.min(particleCount, 45); i++) {
          for (let j = i + 1; j < Math.min(particleCount, 45); j++) {
            if (lineIdx >= maxLines * 6) break;

            const x1 = posArr[i * 3];
            const y1 = posArr[i * 3 + 1];
            const z1 = posArr[i * 3 + 2];
            const x2 = posArr[j * 3];
            const y2 = posArr[j * 3 + 1];
            const z2 = posArr[j * 3 + 2];

            const d = Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2 + (z1 - z2) ** 2);
            if (d < maxDist) {
              lineArr[lineIdx++] = x1;
              lineArr[lineIdx++] = y1;
              lineArr[lineIdx++] = z1;
              lineArr[lineIdx++] = x2;
              lineArr[lineIdx++] = y2;
              lineArr[lineIdx++] = z2;
            }
          }
        }
        lineGeometry.setDrawRange(0, lineIdx / 3);
        lineGeometry.attributes.position.needsUpdate = true;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      dom.removeEventListener('pointerdown', onPointerDown);
      dom.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      dom.removeEventListener('pointerleave', onPointerLeave);

      coreGeometry.dispose();
      coreWireframe.dispose();
      coreMaterial.dispose();
      innerSphereGeo.dispose();
      innerSphereMat.dispose();

      rings.forEach((r) => r.geometry.dispose());
      ringMaterials.forEach((m) => m.dispose());

      particleGeometry.dispose();
      particleMaterial.dispose();
      lineGeometry.dispose();
      lineMaterial.dispose();

      if (renderer) {
        renderer.dispose();
        if (renderer.domElement && renderer.domElement.parentNode === container) {
          container.removeChild(renderer.domElement);
        }
      }
    };
  }, [disable3D, internalState, displayMode, particleDensity, currentAudioLevel]);

  const handleSelectState = (s: CommunicationState) => {
    setInternalState(s);
    onStateSelect?.(s);
  };

  const getStatusLabel = () => {
    if (statusText) return statusText;
    switch (internalState) {
      case 'listening': return 'Voice input active • Listening for speech & sound waves...';
      case 'processing': return 'AI Reasoning • Analyzing gesture syntax & language semantics...';
      case 'speaking': return 'Articulating speech aloud via Web Speech API synthesizer...';
      case 'translating': return 'Universal Translation • English ↔ Amharic bidirectional flow...';
      case 'success': return 'Action completed successfully.';
      case 'error': return 'Communication notice • Please check microphone or text.';
      case 'idle':
      default: return 'UX Particle Displayer • Reactive Three.js acoustic equalizer.';
    }
  };

  return (
    <div className={`relative rounded-[18px] overflow-hidden border border-slate-200 dark:border-[rgba(148,163,184,0.15)] bg-white dark:bg-[#0D1422] shadow-sm flex flex-col justify-between p-4 sm:p-5 transition-all ${className}`}>
      
      {/* Top Header Card Info */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-[rgba(148,163,184,0.12)] pb-3 z-10 gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div 
            className="w-2.5 h-2.5 rounded-full shrink-0 transition-all duration-300"
            style={{ 
              backgroundColor: activeColors.primary,
              boxShadow: `0 0 10px ${activeColors.glow}`
            }}
          />
          <div className="min-w-0">
            <span className="text-xs font-bold text-slate-900 dark:text-[#F8FAFC] font-heading uppercase tracking-wider block truncate">
              UX Particle Displayer
            </span>
            <span className="text-[11px] text-slate-500 dark:text-[#8493A8] capitalize block truncate">
              State: <strong className="text-[#22D3EE]">{internalState}</strong> · Mode: <span className="text-slate-700 dark:text-[#B6C2D2] font-mono text-[10px]">{displayMode}</span>
            </span>
          </div>
        </div>

        {/* Live Microphone Toggle & Audio Meter */}
        <div className="flex items-center gap-1.5 shrink-0">
          {allowLiveMic && (
            <button
              type="button"
              onClick={toggleLiveMic}
              aria-label={isLiveMicActive ? 'Stop Live Mic Equalizer' : 'Start Live Mic Equalizer'}
              className={`h-8 px-2.5 rounded-[8px] text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
                isLiveMicActive
                  ? 'bg-[#22D3EE] text-[#080D18] border-[#22D3EE] shadow-xs'
                  : 'bg-slate-100 dark:bg-[#121C2D] text-slate-700 dark:text-[#B6C2D2] border-slate-200 dark:border-[rgba(148,163,184,0.15)] hover:border-[#22D3EE]/50 hover:text-[#22D3EE]'
              }`}
              title="Drive 3D particles in real time using your microphone voice"
            >
              {isLiveMicActive ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isLiveMicActive ? 'Mic: ON' : 'Live Mic'}</span>
            </button>
          )}

          {/* Level Badge */}
          <div className="flex items-center gap-1 px-2 py-1 rounded-[8px] bg-slate-100 dark:bg-[#121C2D] border border-slate-200 dark:border-[rgba(148,163,184,0.12)] text-[11px] font-mono text-slate-700 dark:text-[#22D3EE]">
            <span className={`w-1.5 h-1.5 rounded-full ${currentAudioLevel > 0 ? 'bg-[#22D3EE] animate-pulse' : 'bg-slate-400'}`} />
            <span>{currentAudioLevel}%</span>
          </div>

          {/* Fullscreen Expand Trigger */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            aria-label="Expand 3D Particle Viewport"
            className="w-8 h-8 rounded-[8px] bg-slate-100 dark:bg-[#121C2D] text-slate-600 dark:text-[#B6C2D2] border border-slate-200 dark:border-[rgba(148,163,184,0.15)] hover:text-slate-900 dark:hover:text-[#F8FAFC] flex items-center justify-center transition-colors cursor-pointer"
            title="Expand Particle Displayer"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Mode Selector Tabs (Spherical Equalizer | Neural Constellation | Acoustic Waves) */}
      <div className="flex items-center gap-1 pt-2.5 pb-1 z-10 overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => setDisplayMode('spherical-eq')}
          className={`px-2.5 py-1 rounded-[6px] text-[10px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer border whitespace-nowrap ${
            displayMode === 'spherical-eq'
              ? 'bg-[#22D3EE]/15 text-[#22D3EE] border-[#22D3EE]/40 font-semibold'
              : 'bg-transparent text-slate-500 dark:text-[#8493A8] border-transparent hover:text-slate-800 dark:hover:text-[#F8FAFC]'
          }`}
        >
          <CircleDot className="w-3 h-3" /> Spherical Equalizer
        </button>

        <button
          type="button"
          onClick={() => setDisplayMode('neural-network')}
          className={`px-2.5 py-1 rounded-[6px] text-[10px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer border whitespace-nowrap ${
            displayMode === 'neural-network'
              ? 'bg-[#22D3EE]/15 text-[#22D3EE] border-[#22D3EE]/40 font-semibold'
              : 'bg-transparent text-slate-500 dark:text-[#8493A8] border-transparent hover:text-slate-800 dark:hover:text-[#F8FAFC]'
          }`}
        >
          <Zap className="w-3 h-3" /> Neural Network
        </button>

        <button
          type="button"
          onClick={() => setDisplayMode('acoustic-waves')}
          className={`px-2.5 py-1 rounded-[6px] text-[10px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer border whitespace-nowrap ${
            displayMode === 'acoustic-waves'
              ? 'bg-[#22D3EE]/15 text-[#22D3EE] border-[#22D3EE]/40 font-semibold'
              : 'bg-transparent text-slate-500 dark:text-[#8493A8] border-transparent hover:text-slate-800 dark:hover:text-[#F8FAFC]'
          }`}
        >
          <Waves className="w-3 h-3" /> Acoustic Waves
        </button>
      </div>

      {/* Center 3D Stage / Static Accessible Fallback */}
      <div 
        className={`relative w-full ${isFullscreen ? 'h-96 sm:h-[460px]' : 'h-64 sm:h-72'} my-2 flex items-center justify-center cursor-grab active:cursor-grabbing select-none transition-all duration-300`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {!disable3D ? (
          <div ref={containerRef} className="w-full h-full flex items-center justify-center" />
        ) : (
          /* High-Contrast Accessible 2D Wave Fallback (WCAG prefers-reduced-motion) */
          <div className="w-full h-full flex flex-col items-center justify-center space-y-4 p-6 text-center">
            <div className="relative w-28 h-28 rounded-full border-2 border-[#22D3EE]/40 flex items-center justify-center bg-[#22D3EE]/10">
              <div 
                className="w-16 h-16 rounded-full border border-[#22D3EE] flex items-center justify-center"
                style={{ backgroundColor: activeColors.glow }}
              >
                <Sparkles className="w-8 h-8 text-[#22D3EE]" />
              </div>
            </div>
            {/* 2D Audio Frequency Bars */}
            <div className="flex items-end gap-1 h-8">
              {[30, 60, 95, 45, 80, 50, 100, 70, 40].map((h, i) => (
                <div
                  key={i}
                  className="w-1.5 bg-[#22D3EE] rounded-t-sm transition-all duration-100"
                  style={{ height: `${(h * Math.max(0.2, currentAudioLevel / 100)).toFixed(0)}%` }}
                />
              ))}
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-800 dark:text-[#F8FAFC]">Accessible 2D Equalizer Active</p>
              <p className="text-[11px] text-slate-500 dark:text-[#8493A8]">3D WebGL motion paused per reduced-motion preference.</p>
            </div>
          </div>
        )}

        {/* Live Mic Frequency Snapshot Bar (Overlay) */}
        {isLiveMicActive && (
          <div className="absolute top-2 left-3 flex items-end gap-1 px-2.5 py-1.5 rounded-[8px] bg-white/80 dark:bg-[#080D18]/85 backdrop-blur-md border border-slate-200 dark:border-[rgba(148,163,184,0.15)] shadow-xs pointer-events-none z-10">
            <span className="text-[9px] font-mono text-[#22D3EE] uppercase mr-1">EQ</span>
            {micFrequencyBins.map((binVal, idx) => (
              <div
                key={idx}
                className="w-1.5 bg-[#22D3EE] rounded-t-xs transition-all duration-75"
                style={{ height: `${Math.max(4, (binVal / 100) * 16)}px` }}
              />
            ))}
          </div>
        )}

        {/* Center Hover Hint */}
        {isHovered && !disable3D && (
          <div className="absolute bottom-2 px-2.5 py-1 rounded-[8px] bg-slate-900/90 text-slate-300 border border-slate-800 text-[10px] pointer-events-none transition-opacity">
            Drag to rotate in 3D • Move cursor to swirl particles
          </div>
        )}
      </div>

      {/* Status Banner */}
      <div className="p-3 rounded-[10px] bg-slate-50 dark:bg-[#121C2D] border border-slate-200 dark:border-[rgba(148,163,184,0.12)] text-xs text-slate-700 dark:text-[#B6C2D2] flex items-center gap-2.5 z-10 mb-3">
        {internalState === 'listening' ? (
          <Mic className="w-4 h-4 text-[#22D3EE] shrink-0 animate-pulse" />
        ) : internalState === 'processing' ? (
          <Bot className="w-4 h-4 text-[#FBBF24] shrink-0 animate-spin" />
        ) : internalState === 'speaking' ? (
          <Volume2 className="w-4 h-4 text-[#38bdf8] shrink-0" />
        ) : internalState === 'translating' ? (
          <Languages className="w-4 h-4 text-[#a855f7] shrink-0" />
        ) : internalState === 'success' ? (
          <CheckCircle2 className="w-4 h-4 text-[#10b981] shrink-0" />
        ) : internalState === 'error' ? (
          <AlertCircle className="w-4 h-4 text-[#f43f5e] shrink-0" />
        ) : (
          <Sparkles className="w-4 h-4 text-[#22D3EE] shrink-0" />
        )}
        <span className="text-[11px] font-medium leading-tight truncate">
          {getStatusLabel()}
        </span>
      </div>

      {/* Interactive State Preview Controls */}
      {showStateControls && (
        <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-[rgba(148,163,184,0.12)] z-10">
          <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-[#8493A8] font-semibold uppercase tracking-wider font-heading">
            <span>Visualizer State Reactions</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setParticleDensity((prev) => prev === 'normal' ? 'dense' : prev === 'dense' ? 'ultra' : 'normal')}
                className="text-[10px] text-slate-500 hover:text-slate-800 dark:hover:text-[#F8FAFC] flex items-center gap-1 cursor-pointer"
                title="Toggle Particle Density"
              >
                <span>Density: {particleDensity}</span>
              </button>
              <button
                type="button"
                onClick={() => handleSelectState('idle')}
                className="text-slate-500 hover:text-slate-800 dark:hover:text-[#F8FAFC] flex items-center gap-1 cursor-pointer"
                title="Reset to Idle"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            </div>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-7 gap-1">
            {(['idle', 'listening', 'processing', 'speaking', 'translating', 'success', 'error'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => handleSelectState(s)}
                className={`py-1.5 px-1 rounded-[8px] text-[10px] font-bold capitalize transition-all cursor-pointer border text-center ${
                  internalState === s
                    ? 'bg-[#22D3EE]/20 text-[#22D3EE] border-[#22D3EE]/50 shadow-xs'
                    : 'bg-slate-100 dark:bg-[#121C2D] hover:bg-slate-200 dark:hover:bg-[#19263A] text-slate-600 dark:text-[#B6C2D2] border-slate-200 dark:border-[rgba(148,163,184,0.1)]'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
