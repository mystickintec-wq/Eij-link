import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
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
  Camera,
  Upload,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  X,
  FileCode
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

const BLENDER_AUTO_RIG_SCRIPT = `# EjjiLink AI - 1-Click Blender Hand Auto-Rigger
# 1. In Blender, switch to the "Scripting" workspace
# 2. In Object Mode, select your hand mesh
# 3. Paste this script and click "Run Script" (or Alt+P)
# 4. Result: Creates a 21-bone octahedral armature, binds with Automatic Weights, and is ready for .glb export!

import bpy

context = bpy.context
mesh_obj = context.active_object

if not mesh_obj or mesh_obj.type != 'MESH':
    print("EjjiLink: Please select your 3D hand mesh in Object Mode first!")
else:
    # 1. Create Armature
    bpy.ops.object.armature_add(enter_editmode=False, location=(0, 0, 0))
    arm_obj = context.active_object
    arm_obj.name = "EjjiLink_Hand_Rig"
    arm_obj.data.display_type = 'OCTAHEDRAL'
    arm_obj.show_in_front = True

    # 2. Generate Bones in Edit Mode
    bpy.ops.object.mode_set(mode='EDIT')
    bones = arm_obj.data.edit_bones
    root = bones[0]
    root.name = "Wrist_Root"
    root.head = (0, 0.2, 0)
    root.tail = (0, 0.45, 0)

    # 5 Anatomical Digits (Thumb, Index, Middle, Ring, Pinky)
    digits = {
        "Thumb": [(-0.16, 0.35, 0.05), (-0.28, 0.46, 0.07), (-0.38, 0.54, 0.08)],
        "Index": [(-0.12, 0.52, 0.01), (-0.13, 0.68, 0.01), (-0.14, 0.82, 0.01)],
        "Middle": [(0.00, 0.55, 0.02), (0.00, 0.72, 0.02), (0.00, 0.88, 0.02)],
        "Ring": [(0.12, 0.52, 0.01), (0.13, 0.68, 0.01), (0.14, 0.82, 0.01)],
        "Pinky": [(0.22, 0.46, -0.01), (0.24, 0.58, -0.01), (0.26, 0.70, -0.01)]
    }

    for d_name, coords in digits.items():
        prev_bone = root
        for idx in range(len(coords) - 1):
            b = bones.new(f"{d_name}_{idx+1}")
            b.head = coords[idx]
            b.tail = coords[idx+1]
            b.parent = prev_bone
            b.use_connect = (idx > 0)
            prev_bone = b

    bpy.ops.object.mode_set(mode='OBJECT')

    # 3. Parent Mesh with Automatic Weights
    mesh_obj.select_set(True)
    arm_obj.select_set(True)
    context.view_layer.objects.active = arm_obj
    bpy.ops.object.parent_set(type='ARMATURE_AUTO')
    print("EjjiLink: Armature successfully created and weighted! Export to .glb via File -> Export -> glTF 2.0")
`;

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

  // Custom Blender Model State
  const [customModelLoaded, setCustomModelLoaded] = useState(false);
  const [isCustomModelActive, setIsCustomModelActive] = useState(false);
  const [customModelName, setCustomModelName] = useState<string | null>(null);
  const [customModelLoading, setCustomModelLoading] = useState(false);
  const [customModelError, setCustomModelError] = useState<string | null>(null);
  const [showBlenderGuideModal, setShowBlenderGuideModal] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  // References to Three.js elements
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const handRootRef = useRef<THREE.Group | null>(null);
  const bonesGroupRef = useRef<THREE.Group | null>(null);
  const skinGroupRef = useRef<THREE.Group | null>(null);
  const customModelGroupRef = useRef<THREE.Group | null>(null);
  const customMeshRef = useRef<THREE.Mesh | null>(null);
  const customMeshOriginalMaterialRef = useRef<THREE.Material | THREE.Material[] | null>(null);
  const customModelBonesRef = useRef<{
    thumb?: THREE.Bone[];
    index?: THREE.Bone[];
    middle?: THREE.Bone[];
    ring?: THREE.Bone[];
    pinky?: THREE.Bone[];
    wrist?: THREE.Bone;
  } | null>(null);
  const animationMixerRef = useRef<THREE.AnimationMixer | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isCustomModelActiveRef = useRef<boolean>(false);

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

  useEffect(() => {
    isCustomModelActiveRef.current = isCustomModelActive;
  }, [isCustomModelActive]);

  // Load custom GLB/GLTF model from URL or ArrayBuffer
  const loadGLB = useCallback((source: string | ArrayBuffer, fileName: string) => {
    const targetGroup = handRootRef.current;
    if (!targetGroup) {
      setTimeout(() => loadGLB(source, fileName), 200);
      return;
    }

    setCustomModelLoading(true);
    setCustomModelError(null);

    const loader = new GLTFLoader();

    const handleLoadedGLTF = (gltf: any) => {
      // Remove previous custom model if any
      if (customModelGroupRef.current && targetGroup) {
        targetGroup.remove(customModelGroupRef.current);
        customModelGroupRef.current.traverse((child) => {
          if ((child as THREE.Mesh).geometry) {
            (child as THREE.Mesh).geometry.dispose();
          }
        });
        customModelGroupRef.current = null;
        customMeshRef.current = null;
        customMeshOriginalMaterialRef.current = null;
        customModelBonesRef.current = null;
      }

      if (animationMixerRef.current) {
        animationMixerRef.current.stopAllAction();
        animationMixerRef.current = null;
      }

      const model = gltf.scene;
      let primaryMesh: THREE.Mesh | null = null;
      model.traverse((child: any) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          if (!primaryMesh) primaryMesh = child as THREE.Mesh;
        }
      });

      // Auto-calculate bounding box and normalize scale & center
      const initialBox = new THREE.Box3().setFromObject(model);
      const size = initialBox.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      if (maxDim > 0) {
        const targetScale = 2.4 / maxDim;
        model.scale.set(targetScale, targetScale, targetScale);
      }

      // Re-measure after scaling and center precisely at (0, 0.85, 0)
      const scaledBox = new THREE.Box3().setFromObject(model);
      const scaledCenter = scaledBox.getCenter(new THREE.Vector3());
      model.position.x = -scaledCenter.x;
      model.position.y = -scaledCenter.y + 0.85;
      model.position.z = -scaledCenter.z;

      // Store primary mesh reference and pristine original material
      if (primaryMesh) {
        const mesh = primaryMesh as THREE.Mesh;
        customMeshRef.current = mesh;
        customMeshOriginalMaterialRef.current = mesh.material;
      }

      // Auto-detect skeletal armature bones if model was rigged in Blender
      const foundBones: THREE.Bone[] = [];
      model.traverse((child: any) => {
        if (child.isBone) {
          foundBones.push(child as THREE.Bone);
        }
      });

      if (foundBones.length > 0) {
        const boneMap: {
          thumb: THREE.Bone[];
          index: THREE.Bone[];
          middle: THREE.Bone[];
          ring: THREE.Bone[];
          pinky: THREE.Bone[];
          wrist?: THREE.Bone;
        } = {
          thumb: [],
          index: [],
          middle: [],
          ring: [],
          pinky: [],
        };

        foundBones.forEach((b) => {
          const n = b.name.toLowerCase();
          if (n.includes('wrist') || n.includes('root') || n.includes('hand')) {
            boneMap.wrist = b;
          } else if (n.includes('thumb') || n.includes('pollex') || n.includes('finger0')) {
            boneMap.thumb.push(b);
          } else if (n.includes('index') || n.includes('fore') || n.includes('finger1')) {
            boneMap.index.push(b);
          } else if (n.includes('middle') || n.includes('finger2')) {
            boneMap.middle.push(b);
          } else if (n.includes('ring') || n.includes('finger3')) {
            boneMap.ring.push(b);
          } else if (n.includes('pinky') || n.includes('little') || n.includes('finger4')) {
            boneMap.pinky.push(b);
          }
        });

        (['thumb', 'index', 'middle', 'ring', 'pinky'] as const).forEach((digit) => {
          boneMap[digit].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
        });

        customModelBonesRef.current = boneMap;
      } else {
        customModelBonesRef.current = null;
      }

      const customGroup = new THREE.Group();
      customGroup.add(model);
      customModelGroupRef.current = customGroup;

      // If model has pre-baked animations, set up mixer
      if (gltf.animations && gltf.animations.length > 0) {
        const mixer = new THREE.AnimationMixer(model);
        const action = mixer.clipAction(gltf.animations[0]);
        action.play();
        animationMixerRef.current = mixer;
      }

      targetGroup.add(customGroup);

      setCustomModelLoaded(true);
      // Keep Original Model active by default so gestures move with 100% precision
      setIsCustomModelActive(false);
      setCustomModelName(fileName);
      setCustomModelLoading(false);

      // Keep original model visible by default
      if (skinGroupRef.current) skinGroupRef.current.visible = true;
      if (customModelGroupRef.current) customModelGroupRef.current.visible = false;
    };

    if (typeof source === 'string') {
      loader.load(
        source,
        handleLoadedGLTF,
        undefined,
        (err) => {
          console.warn('Could not load custom GLB from URL:', err);
          setCustomModelLoading(false);
          setCustomModelError('Failed to load custom model from URL. Ensure file is a valid glTF 2.0 (.glb) export.');
        }
      );
    } else {
      loader.parse(
        source,
        '',
        handleLoadedGLTF,
        (err) => {
          console.error('Failed to parse uploaded GLB:', err);
          setCustomModelLoading(false);
          setCustomModelError('Failed to parse custom model. Make sure you exported from Blender as glTF Binary (.glb).');
        }
      );
    }
  }, []);

  const toggleCustomModel = (activate: boolean) => {
    setIsCustomModelActive(activate);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.glb') && !file.name.toLowerCase().endsWith('.gltf')) {
      setCustomModelError('Please select a glTF 2.0 file (.glb or .gltf) exported from Blender.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const buffer = event.target?.result as ArrayBuffer;
      if (buffer) {
        loadGLB(buffer, file.name);
      }
    };
    reader.onerror = () => {
      setCustomModelError('Error reading file from disk.');
    };
    reader.readAsArrayBuffer(file);
  };

  // Check if static public/models/hand.glb exists on initial mount
  useEffect(() => {
    fetch('/models/hand.glb', { method: 'HEAD' })
      .then((res) => {
        if (res.ok) {
          loadGLB('/models/hand.glb', 'hand.glb (public/models)');
        }
      })
      .catch(() => {
        // Default to procedural hand
      });
  }, [loadGLB]);

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

  // Update material visibility / mode & sync Blender Armature with Custom Model
  useEffect(() => {
    if (!skinGroupRef.current || !bonesGroupRef.current) return;

    const isArmature = materialMode === 'armature';
    const isWireframe = materialMode === 'wireframe';
    const isCyber = materialMode === 'cyber';

    if (isCustomModelActive) {
      // 1. Show Custom Model
      if (customModelGroupRef.current) {
        customModelGroupRef.current.visible = true;
      }

      // Configure Custom Mesh Shading
      if (customMeshRef.current) {
        if (isArmature) {
          // Translucent X-ray clay skin revealing internal Blender Armature bones
          customMeshRef.current.material = new THREE.MeshStandardMaterial({
            color: 0x64748b,
            roughness: 0.5,
            metalness: 0.1,
            transparent: true,
            opacity: 0.35,
            depthWrite: false,
          });
        } else if (isWireframe) {
          customMeshRef.current.material = wireframeMaterialRef.current!;
        } else if (isCyber) {
          customMeshRef.current.material = cyberMaterialRef.current!;
        } else {
          // Anatomical clay or original pristine model material
          if (customMeshOriginalMaterialRef.current) {
            customMeshRef.current.material = customMeshOriginalMaterialRef.current as any;
          } else {
            customMeshRef.current.material = clayMaterialRef.current!;
          }
        }
      }

      if (isArmature) {
        // Activate Blender Skeletal Armature inside the custom model
        bonesGroupRef.current.visible = true;
        skinGroupRef.current.visible = true;

        // Hide procedural skin meshes, keep digit bone meshes and joint heads visible & articulated
        skinGroupRef.current.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            if (child.userData?.isSkinMesh) {
              child.visible = false;
            } else if (child.userData?.isBoneMesh) {
              child.visible = true;
            }
          }
        });
      } else {
        // In solid clay / wireframe / cyber modes on custom model, hide bones and procedural skin
        bonesGroupRef.current.visible = false;
        skinGroupRef.current.visible = false;
      }
    } else {
      // 2. Original Model Mode (Flawless anatomical movement)
      if (customModelGroupRef.current) {
        customModelGroupRef.current.visible = false;
      }

      skinGroupRef.current.visible = true;

      // Make all procedural skin meshes visible
      skinGroupRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh && child.userData?.isSkinMesh) {
          child.visible = true;
        }
      });

      if (isArmature) {
        bonesGroupRef.current.visible = true;
        // Make skin translucent x-ray
        skinGroupRef.current.traverse((child) => {
          if (child instanceof THREE.Mesh && child.userData?.isSkinMesh) {
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
      } else if (isWireframe) {
        bonesGroupRef.current.visible = false;
        skinGroupRef.current.traverse((child) => {
          if (child instanceof THREE.Mesh && child.userData?.isSkinMesh) {
            child.material = wireframeMaterialRef.current!;
          }
        });
      } else if (isCyber) {
        bonesGroupRef.current.visible = false;
        skinGroupRef.current.traverse((child) => {
          if (child instanceof THREE.Mesh && child.userData?.isSkinMesh) {
            child.material = cyberMaterialRef.current!;
          }
        });
      } else {
        // Clean anatomical clay (matches Screenshot 1 & 2)
        bonesGroupRef.current.visible = false;
        skinGroupRef.current.traverse((child) => {
          if (child instanceof THREE.Mesh && child.userData?.isSkinMesh) {
            child.material = clayMaterialRef.current!;
          }
        });
      }
    }
  }, [materialMode, isCustomModelActive]);

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
    forearmMesh.userData = { isSkinMesh: true };
    skinGroup.add(forearmMesh);

    // Pedestal bottom circular cut-off (as shown in Screenshot 1 & 2)
    const pedestalRim = new THREE.Mesh(
      new THREE.TorusGeometry(0.44, 0.02, 16, 32),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5, metalness: 0.6 })
    );
    pedestalRim.rotation.x = Math.PI / 2;
    pedestalRim.position.y = -0.64;
    pedestalRim.userData = { isSkinMesh: true };
    skinGroup.add(pedestalRim);

    // Root Wrist Bone 0 Joint (Screenshot 2)
    const rootBoneJoint = createJointHead(0.08);
    rootBoneJoint.position.set(0, 0.2, 0);
    rootBoneJoint.userData = { isBoneMesh: true };
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
    palmMesh.userData = { isSkinMesh: true };
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
      mcBone.userData = { isBoneMesh: true };
      bonesGroup.add(mcBone);
    });

    // Thumb Metacarpal Bone 1 (Branches to the side)
    const thumbMcBone = createBlenderBone(0.42, 0.09);
    thumbMcBone.position.set(0, 0.2, 0);
    thumbMcBone.rotation.z = Math.PI / 4;
    thumbMcBone.rotation.y = 0.25;
    thumbMcBone.userData = { isBoneMesh: true };
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
      mcpJointHead.userData = { isBoneMesh: true };
      bonesGroup.add(mcpJointHead);

      // Proximal Phalanx Mesh (Skin)
      const proxLen = (isThumb ? 0.32 : 0.38) * scale;
      const proxMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.062 * scale, 0.075 * scale, proxLen, 16),
        clayMat
      );
      proxMesh.position.y = proxLen / 2;
      proxMesh.castShadow = !isSoftwareGl;
      proxMesh.userData = { isSkinMesh: true };
      mcpGroup.add(proxMesh);

      // Proximal Bone (Screenshot 2)
      const proxBone = createBlenderBone(proxLen, 0.065 * scale);
      proxBone.userData = { isBoneMesh: true };
      mcpGroup.add(proxBone);

      // 2. PIP Joint
      const pipGroup = new THREE.Group();
      pipGroup.position.y = proxLen;

      const pipJointHead = createJointHead(0.058 * scale);
      pipJointHead.userData = { isBoneMesh: true };
      pipGroup.add(pipJointHead);

      // Intermediate Phalanx Mesh
      const midLen = (isThumb ? 0.26 : 0.30) * scale;
      const midMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.054 * scale, 0.062 * scale, midLen, 16),
        clayMat
      );
      midMesh.position.y = midLen / 2;
      midMesh.castShadow = !isSoftwareGl;
      midMesh.userData = { isSkinMesh: true };
      pipGroup.add(midMesh);

      // Intermediate Bone (Screenshot 2)
      const midBone = createBlenderBone(midLen, 0.055 * scale);
      midBone.userData = { isBoneMesh: true };
      pipGroup.add(midBone);

      // 3. DIP Joint
      const dipGroup = new THREE.Group();
      dipGroup.position.y = midLen;

      const dipJointHead = createJointHead(0.05 * scale);
      dipJointHead.userData = { isBoneMesh: true };
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
      tipMesh.userData = { isSkinMesh: true };
      tipGroup.add(tipMesh);

      dipGroup.add(tipGroup);

      // Distal Bone (Screenshot 2)
      const tipBone = createBlenderBone(tipLen, 0.048 * scale);
      tipBone.userData = { isBoneMesh: true };
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
        if (customModelGroupRef.current) {
          customModelGroupRef.current.rotation.x = current.wristTilt[0];
          customModelGroupRef.current.rotation.z = current.wristTilt[2];
        }

        // Drive custom model's native Blender armature bones if rigged
        const cBones = customModelBonesRef.current;
        if (cBones && isCustomModelActiveRef.current) {
          (['thumb', 'index', 'middle', 'ring', 'pinky'] as const).forEach((digit) => {
            const c = current[digit];
            const bList = cBones[digit];
            if (bList && bList.length > 0) {
              if (bList[0]) {
                bList[0].rotation.z = (digit === 'thumb' ? Math.PI / 4 : 0) + c.spread;
                bList[0].rotation.x = c.curl1;
              }
              if (bList[1]) {
                bList[1].rotation.x = c.curl2;
              }
              if (bList[2]) {
                bList[2].rotation.x = c.curl3;
              }
            }
          });
          if (cBones.wrist) {
            cBones.wrist.rotation.x = current.wristTilt[0];
            cBones.wrist.rotation.z = current.wristTilt[2];
          }
        }
      }

      // Update skeletal animation mixer if custom model has animation clips
      if (animationMixerRef.current && isCustomModelActiveRef.current && isPlayingRef.current) {
        animationMixerRef.current.update(dt);
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

      {/* Hidden File Picker for Blender GLB/GLTF Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".glb,.gltf"
        className="hidden"
      />

      {/* Loading Overlay */}
      {customModelLoading && (
        <div className="absolute inset-0 z-40 bg-slate-950/75 backdrop-blur-xs flex flex-col items-center justify-center gap-3 text-cyan-300">
          <div className="w-10 h-10 border-3 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <div className="text-center">
            <p className="text-sm font-bold font-heading text-white">Importing Custom Blender 3D Model</p>
            <p className="text-xs text-cyan-400/80">Parsing mesh geometry, materials, and armature transforms...</p>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {customModelError && (
        <div className="absolute top-18 left-1/2 -translate-x-1/2 z-30 max-w-lg w-[92%] p-3.5 rounded-2xl bg-rose-950/95 border border-rose-500/60 text-rose-100 text-xs backdrop-blur-md flex items-center justify-between gap-3 shadow-2xl animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <p className="leading-snug">{customModelError}</p>
          </div>
          <button
            onClick={() => setCustomModelError(null)}
            className="p-1 rounded-lg hover:bg-rose-900/60 text-rose-300 hover:text-white transition-colors cursor-pointer shrink-0"
            title="Dismiss error"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header Badge & Mode Navigation Tabs */}
      <div className="absolute top-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Left: Branding Badge & Live Tracking Status */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 dark:bg-slate-900/90 border border-gray-200 dark:border-emerald-500/40 text-xs font-semibold backdrop-blur-md shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
            <span className="text-slate-900 dark:text-white font-heading">
              {isCustomModelActive ? 'Custom Blender Model' : 'Anatomical 3D Rigged Hand'}
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-mono text-[11px]">
              {isCustomModelActive
                ? materialMode === 'armature'
                  ? '• 🦴 Blender Armature Rig Active'
                  : '• Solid 3D Geometry'
                : '• 🦴 Blender Rig Sync'}
            </span>
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

        {/* Right Action Controls: Blender Import, Guide & Viewers */}
        <div className="flex flex-wrap items-center gap-1.5 pointer-events-auto">
          {/* Prominent Model Switcher: Original Rigged Hand vs Custom Blender Model */}
          <div className="flex items-center p-1 rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-gray-200 dark:border-emerald-500/40 backdrop-blur-md shadow-md text-xs">
            <button
              onClick={() => toggleCustomModel(false)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                !isCustomModelActive
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-gray-300 hover:text-slate-950 dark:hover:text-white'
              }`}
              title="Switch to Original Studio-Rigged Hand (Flawless anatomical movement)"
            >
              <span>🖐️</span>
              <span>Original Model</span>
            </button>

            {customModelLoaded && (
              <button
                onClick={() => toggleCustomModel(true)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  isCustomModelActive
                    ? 'bg-cyan-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-gray-300 hover:text-slate-950 dark:hover:text-white'
                }`}
                title="Switch to Your Custom Blender 3D Model"
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>Custom Model</span>
              </button>
            )}
          </div>

          {/* Import Blender Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 backdrop-blur-md shadow-md cursor-pointer border border-cyan-400/40"
            title="Import custom Blender 3D model (.glb / .gltf) directly"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Import Blender (.glb)</span>
            <span className="sm:hidden">Import</span>
          </button>

          {/* Blender Export Help Guide */}
          <button
            onClick={() => setShowBlenderGuideModal(true)}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/90 dark:bg-slate-900/90 hover:bg-gray-100 dark:hover:bg-slate-800 text-xs font-semibold text-cyan-600 dark:text-cyan-400 border border-cyan-300 dark:border-cyan-500/40 transition-all flex items-center gap-1.5 backdrop-blur-md shadow-md cursor-pointer"
            title="How to export your Blender 3D hand model to .glb"
          >
            <HelpCircle className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" />
            <span className="hidden md:inline">Blender Guide</span>
          </button>

          <button
            onClick={() => setShowReferenceModal(true)}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/90 dark:bg-slate-900/90 hover:bg-gray-100 dark:hover:bg-slate-800 text-xs font-semibold text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40 transition-all flex items-center gap-1.5 backdrop-blur-md shadow-md cursor-pointer"
            title="Compare with Blender & Quad Topology Reference Photos"
          >
            <ImageIcon className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
            <span className="hidden lg:inline">References</span>
          </button>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/90 dark:bg-slate-900/90 hover:bg-gray-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-gray-300 border border-gray-200 dark:border-slate-700 transition-colors flex items-center gap-1.5 backdrop-blur-md cursor-pointer"
            title="Toggle Control Dock"
          >
            {isCollapsed ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isCollapsed ? 'Show Dock' : 'Cinema'}</span>
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
      {/* Blender Export & Integration Guide Modal */}
      {showBlenderGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-cyan-500/40 rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl p-6 space-y-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-100 dark:bg-cyan-500/20 border border-cyan-300 dark:border-cyan-500/40 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                  <FileCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white font-heading">
                    How to Add Your Custom Blender 3D Model
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-gray-400">
                    Export your custom Blender hand file as glTF 2.0 (.glb) for the Three.js WebGL engine.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBlenderGuideModal(false)}
                className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-gray-300 transition-colors cursor-pointer"
                title="Close Guide"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Why GLB Explanation Callout */}
            <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-start gap-3 text-xs text-cyan-800 dark:text-cyan-200">
              <div className="w-7 h-7 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <strong className="block text-cyan-900 dark:text-cyan-100 font-heading mb-0.5">
                  Why export from .blend to .glb?
                </strong>
                <span>
                  Web browsers cannot read raw proprietary <code>.blend</code> binary project files directly. Three.js uses <strong>glTF 2.0 Binary (<code>.glb</code>)</strong>, which is the universal open standard that packages 3D polygonal geometry, PBR materials, textures, and skeletal bone rigs into a single fast-loading web file.
                </span>
              </div>
            </div>

            {/* Step-by-Step Blender Export Instructions */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-heading flex items-center gap-2">
                <span>Blender Export Steps (Blender 3.x / 4.x)</span>
              </h4>

              <div className="grid gap-3">
                {/* Step 1 */}
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 flex items-start gap-3.5">
                  <div className="w-7 h-7 rounded-full bg-cyan-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div className="space-y-1 text-xs text-slate-700 dark:text-gray-300">
                    <p className="font-bold text-slate-900 dark:text-white font-heading">
                      Select Your Hand & Armature in Blender
                    </p>
                    <p className="text-slate-500 dark:text-gray-400">
                      In Blender's <strong>Object Mode</strong>, click your hand mesh and skeletal armature rig to select them (or press <kbd className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-slate-800 text-[11px] font-mono">A</kbd> to select all).
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 flex items-start gap-3.5">
                  <div className="w-7 h-7 rounded-full bg-cyan-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div className="space-y-1 text-xs text-slate-700 dark:text-gray-300">
                    <p className="font-bold text-slate-900 dark:text-white font-heading">
                      Open the glTF 2.0 Export Menu
                    </p>
                    <p className="text-slate-500 dark:text-gray-400">
                      In Blender's top toolbar, click <strong className="text-slate-900 dark:text-white">File → Export → glTF 2.0 (.glb/.gltf)</strong>.
                    </p>
                  </div>
                </div>

                {/* Step 3: Exact Export Settings */}
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 flex items-start gap-3.5">
                  <div className="w-7 h-7 rounded-full bg-cyan-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    3
                  </div>
                  <div className="space-y-2 text-xs text-slate-700 dark:text-gray-300 w-full">
                    <p className="font-bold text-slate-900 dark:text-white font-heading">
                      Recommended Export Settings (Right Sidebar)
                    </p>
                    <div className="grid sm:grid-cols-2 gap-2 text-[11px] font-mono">
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 space-y-1">
                        <span className="font-bold text-cyan-600 dark:text-cyan-400">Format & Include:</span>
                        <p className="text-slate-600 dark:text-gray-400">• Format: <strong>glTF Binary (.glb)</strong></p>
                        <p className="text-slate-600 dark:text-gray-400">• Include: <strong>Selected Objects</strong></p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 space-y-1">
                        <span className="font-bold text-cyan-600 dark:text-cyan-400">Transform & Geometry:</span>
                        <p className="text-slate-600 dark:text-gray-400">• Transform: <strong>+Y Up</strong> (Checked)</p>
                        <p className="text-slate-600 dark:text-gray-400">• Geometry: <strong>Apply Modifiers</strong></p>
                        <p className="text-slate-600 dark:text-gray-400">• Armature: <strong>Deformation Bones Only</strong></p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 4: Loading into EjjiLink AI */}
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 flex items-start gap-3.5">
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    4
                  </div>
                  <div className="space-y-2 text-xs text-slate-700 dark:text-gray-300 w-full">
                    <p className="font-bold text-slate-900 dark:text-white font-heading">
                      Two Ways to Load It into the App:
                    </p>
                    <div className="grid sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 space-y-1.5">
                        <span className="font-bold text-cyan-400 font-heading">Method A: Instant Browser Upload</span>
                        <p className="text-slate-400 text-[11px]">
                          Click <strong>"Import Blender (.glb)"</strong> in the viewer to test your model right now from your computer without restarting anything.
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 space-y-1.5">
                        <span className="font-bold text-emerald-400 font-heading">Method B: Permanent Folder</span>
                        <p className="text-slate-400 text-[11px]">
                          Save or copy your file to:
                          <code className="block mt-1 p-1 bg-black/60 rounded text-amber-300 text-[10px] font-mono select-all">
                            public/models/hand.glb
                          </code>
                          The app will automatically load it on startup every time!
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* NEW: 1-Click Blender Auto-Rigging Python Script */}
            <div className="p-4 sm:p-5 rounded-2xl bg-cyan-950/30 border border-cyan-500/40 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                    <Bone className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-white font-heading">
                      1-Click Blender Auto-Rigging Script (Python)
                    </h5>
                    <p className="text-xs text-cyan-300/80">
                      Instantly adds the 21 octahedral bones &amp; parents with Automatic Weights inside Blender
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(BLENDER_AUTO_RIG_SCRIPT);
                    setCopiedScript(true);
                    setTimeout(() => setCopiedScript(false), 2500);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md ${
                    copiedScript
                      ? 'bg-emerald-600 text-white'
                      : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                  }`}
                  title="Copy Python auto-rigging script to clipboard"
                >
                  {copiedScript ? <Check className="w-3.5 h-3.5" /> : <FileCode className="w-3.5 h-3.5" />}
                  <span>{copiedScript ? 'Copied to Clipboard!' : 'Copy Python Script'}</span>
                </button>
              </div>

              <div className="text-xs text-slate-300 space-y-1.5 leading-relaxed">
                <p>
                  <strong>How to use in Blender:</strong>
                </p>
                <ol className="list-decimal list-inside space-y-1 text-slate-400 text-[11px]">
                  <li>In Blender top tabs, click <strong>Scripting</strong> (or press <kbd className="px-1 py-0.5 rounded bg-black/60 font-mono text-[10px]">Shift+F11</kbd>).</li>
                  <li>Click <strong>+ New</strong> in the text editor and paste this script.</li>
                  <li>In the 3D Viewport, click your hand mesh in <strong>Object Mode</strong>.</li>
                  <li>Click <strong>▶ Run Script</strong> (or press <kbd className="px-1 py-0.5 rounded bg-black/60 font-mono text-[10px]">Alt+P</kbd>).</li>
                </ol>
              </div>

              <div className="relative rounded-xl overflow-hidden bg-black/80 border border-cyan-500/30 p-3 max-h-36 overflow-y-auto font-mono text-[11px] text-cyan-300 leading-tight select-all">
                <pre>{BLENDER_AUTO_RIG_SCRIPT}</pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-slate-500 dark:text-gray-400">
                Ready with your exported <code>.glb</code> file?
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowBlenderGuideModal(false)}
                  className="px-4 py-2 rounded-xl bg-gray-200 dark:bg-slate-800 hover:bg-gray-300 dark:hover:bg-slate-700 text-slate-800 dark:text-gray-200 text-xs font-bold transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowBlenderGuideModal(false);
                    fileInputRef.current?.click();
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Choose .glb File Now</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
