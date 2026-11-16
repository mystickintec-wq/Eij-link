import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { GestureKey, SignSequence, LandmarkPoint, SignJointPose, DetectedFace, SegmentationBackgroundMode, HeadJoints } from '../types';
import { GESTURE_DEFINITIONS } from '../data/gestures';
import { SIGN_SEQUENCES } from '../data/signSequences';
import { computeJointPoseFromLandmarks, isValidLandmarkSet } from '../services/landmarkHandKinematics';
import { speechService } from '../services/speechService';
import { 
  DUAL_ARM_PICTURE_PRESETS, 
  DualArmPose, 
  ArmJoints 
} from '../services/dualArmKinematics';
import { DualArmPoseAdjuster } from './DualArmPoseAdjuster';
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
  FileCode,
  Smile,
  UserCheck,
  Maximize2,
  Minimize2
} from 'lucide-react';
import {
  Alert,
  Button,
  ErrorState,
  LoadingState,
  Modal,
  StatusBadge,
  useToast,
} from './ui';

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
  detectedFace?: DetectedFace | null;
  backgroundMode?: SegmentationBackgroundMode;
  onBackgroundModeChange?: (mode: SegmentationBackgroundMode) => void;
  isFaceTrackingEnabled?: boolean;
  onToggleFaceTracking?: () => void;
  selfieVideoRef?: React.RefObject<HTMLVideoElement | null>;
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
  detectedFace = null,
  backgroundMode = 'studio',
  onBackgroundModeChange,
  isFaceTrackingEnabled = true,
  onToggleFaceTracking,
  selfieVideoRef,
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
  const [webglError, setWebglError] = useState<string | null>(null);
  const { showToast } = useToast();

  // Custom Blender Model State
  const [customModelLoaded, setCustomModelLoaded] = useState(false);
  const [isCustomModelActive, setIsCustomModelActive] = useState(false);
  const [customModelName, setCustomModelName] = useState<string | null>(null);
  const [customModelLoading, setCustomModelLoading] = useState(false);
  const [customModelError, setCustomModelError] = useState<string | null>(null);
  const [showBlenderGuideModal, setShowBlenderGuideModal] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  // Whole 2 Arms Avatar & Picture Movement Adjuster State
  const [isDualArmMode, setIsDualArmMode] = useState<boolean>(true);
  const [activePicturePresetId, setActivePicturePresetId] = useState<string>('selam');
  const [leftArmJoints, setLeftArmJoints] = useState<ArmJoints>(DUAL_ARM_PICTURE_PRESETS[0].leftArm);
  const [rightArmJoints, setRightArmJoints] = useState<ArmJoints>(DUAL_ARM_PICTURE_PRESETS[0].rightArm);
  const [isMotionPlaying, setIsMotionPlaying] = useState<boolean>(true);
  const [motionSpeed, setMotionSpeed] = useState<number>(1.0);
  const [selectedArmTarget, setSelectedArmTarget] = useState<'both' | 'right' | 'left'>('both');
  const [isArmAdjusterOpen, setIsArmAdjusterOpen] = useState<boolean>(false);

  // MediaPipe Face Detection & Head Rig State
  const [headJoints, setHeadJoints] = useState<HeadJoints>({ pitch: 0, yaw: 0, roll: 0 });
  const [isFaceTrackingActive, setIsFaceTrackingActive] = useState<boolean>(isFaceTrackingEnabled);
  const [showSelfiePip, setShowSelfiePip] = useState<boolean>(true);
  const [isPipExpanded, setIsPipExpanded] = useState<boolean>(false);
  const pipCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const isDualArmModeRef = useRef<boolean>(true);
  const activePicturePresetRef = useRef<DualArmPose>(DUAL_ARM_PICTURE_PRESETS[0]);
  const leftArmJointsRef = useRef<ArmJoints>(DUAL_ARM_PICTURE_PRESETS[0].leftArm);
  const rightArmJointsRef = useRef<ArmJoints>(DUAL_ARM_PICTURE_PRESETS[0].rightArm);
  const headJointsRef = useRef<HeadJoints>({ pitch: 0, yaw: 0, roll: 0 });
  const detectedFaceRef = useRef<DetectedFace | null>(detectedFace);
  const isFaceTrackingActiveRef = useRef<boolean>(isFaceTrackingEnabled);
  const isMotionPlayingRef = useRef<boolean>(true);
  const motionSpeedRef = useRef<number>(1.0);
  const dualArmsRootRef = useRef<THREE.Group | null>(null);
  const headGroupRef = useRef<THREE.Group | null>(null);
  const faceReticleGroupRef = useRef<THREE.Group | null>(null);
  const dualArmsRef = useRef<{
    torso: THREE.Group;
    head: THREE.Group;
    left: {
      shoulder: THREE.Group;
      elbow: THREE.Group;
      wrist: THREE.Group;
      digits: Record<string, { mcp: THREE.Group; pip: THREE.Group; dip: THREE.Group }>;
    };
    right: {
      shoulder: THREE.Group;
      elbow: THREE.Group;
      wrist: THREE.Group;
      digits: Record<string, { mcp: THREE.Group; pip: THREE.Group; dip: THREE.Group }>;
    };
  } | null>(null);

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

  useEffect(() => {
    isDualArmModeRef.current = isDualArmMode;
    if (dualArmsRootRef.current && handRootRef.current) {
      dualArmsRootRef.current.visible = isDualArmMode;
      handRootRef.current.visible = !isDualArmMode;
      if (cameraRef.current) {
        if (isDualArmMode) {
          cameraRef.current.position.set(0, 1.25, 5.6);
          cameraRef.current.lookAt(0, 0.75, 0);
        } else {
          cameraRef.current.position.set(0, 1.4, 4.4);
          cameraRef.current.lookAt(0, 0.85, 0);
        }
      }
    }
  }, [isDualArmMode]);

  useEffect(() => {
    isMotionPlayingRef.current = isMotionPlaying;
  }, [isMotionPlaying]);

  useEffect(() => {
    motionSpeedRef.current = motionSpeed;
  }, [motionSpeed]);

  useEffect(() => {
    detectedFaceRef.current = detectedFace;
  }, [detectedFace]);

  useEffect(() => {
    headJointsRef.current = headJoints;
  }, [headJoints]);

  useEffect(() => {
    setIsFaceTrackingActive(isFaceTrackingEnabled);
    isFaceTrackingActiveRef.current = isFaceTrackingEnabled;
  }, [isFaceTrackingEnabled]);

  const handleUpdateHead = (updates: Partial<HeadJoints>) => {
    setHeadJoints((prev) => {
      const next = { ...prev, ...updates };
      headJointsRef.current = next;
      return next;
    });
  };

  const handleToggleFaceTracking = () => {
    const nextVal = !isFaceTrackingActive;
    setIsFaceTrackingActive(nextVal);
    isFaceTrackingActiveRef.current = nextVal;
    onToggleFaceTracking?.();
  };

  useEffect(() => {
    if (!showSelfiePip) return;
    let pipFrameId: number;
    const renderPip = () => {
      const v = selfieVideoRef?.current;
      const c = pipCanvasRef.current;
      if (v && c && v.readyState >= 2) {
        const ctx = c.getContext('2d');
        if (ctx) {
          ctx.save();
          ctx.drawImage(v, 0, 0, c.width, c.height);
          if (detectedFace && isFaceTrackingActive) {
            ctx.strokeStyle = '#22d3ee';
            ctx.lineWidth = 1.5;
            const b = detectedFace.box;
            const sx = c.width / (v.videoWidth || 640);
            const sy = c.height / (v.videoHeight || 480);
            ctx.strokeRect(b.originX * sx, b.originY * sy, b.width * sx, b.height * sy);
          }
          ctx.restore();
        }
      }
      pipFrameId = requestAnimationFrame(renderPip);
    };
    pipFrameId = requestAnimationFrame(renderPip);
    return () => cancelAnimationFrame(pipFrameId);
  }, [showSelfiePip, selfieVideoRef, detectedFace, isFaceTrackingActive]);

  const handleUpdateJoints = (arm: 'left' | 'right' | 'both', updates: Partial<ArmJoints>) => {
    if (arm === 'both' || arm === 'left') {
      setLeftArmJoints((prev) => {
        const next = { ...prev, ...updates };
        leftArmJointsRef.current = next;
        return next;
      });
    }
    if (arm === 'both' || arm === 'right') {
      setRightArmJoints((prev) => {
        const next = { ...prev, ...updates };
        rightArmJointsRef.current = next;
        return next;
      });
    }
  };

  const handleSelectPicturePreset = (preset: DualArmPose) => {
    setActivePicturePresetId(preset.id);
    activePicturePresetRef.current = preset;
    setLeftArmJoints(preset.leftArm);
    setRightArmJoints(preset.rightArm);
    leftArmJointsRef.current = preset.leftArm;
    rightArmJointsRef.current = preset.rightArm;
    if (preset.isDynamic) {
      setIsMotionPlaying(true);
      isMotionPlayingRef.current = true;
    }
  };

  const handleResetJoints = () => {
    const p = activePicturePresetRef.current;
    setLeftArmJoints(p.leftArm);
    setRightArmJoints(p.rightArm);
    leftArmJointsRef.current = p.leftArm;
    rightArmJointsRef.current = p.rightArm;
  };

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

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
        alpha: false,
      });
    } catch (err) {
      console.warn('WebGLRenderer initialization failed:', err);
      setWebglError('3D WebGL rendering could not be initialized on this device or browser context.');
      return;
    }

    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      setWebglError('WebGL 3D context was interrupted. Restore graphics context or switch 2D fallback.');
    };
    const handleContextRestored = () => {
      setWebglError(null);
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', handleContextRestored);

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

    // =========================================================================
    // Whole 2 Arms Avatar Hierarchy (Torso + Articulated Dual Arms & 10 Digits)
    // =========================================================================
    const dualArmsRoot = new THREE.Group();
    dualArmsRootRef.current = dualArmsRoot;
    dualArmsRoot.visible = isDualArmModeRef.current;
    scene.add(dualArmsRoot);

    // Torso / Clavicles Base
    const torsoGroup = new THREE.Group();
    torsoGroup.position.set(0, 0.45, -0.05);

    const chestMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.85, 0.72, 1.1, 24),
      clayMat
    );
    chestMesh.position.y = -0.15;
    chestMesh.castShadow = !isSoftwareGl;
    chestMesh.receiveShadow = !isSoftwareGl;
    chestMesh.userData = { isSkinMesh: true };
    torsoGroup.add(chestMesh);

    const clavicleMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.9, 0.22, 0.35),
      clayMat
    );
    clavicleMesh.position.set(0, 0.45, 0);
    clavicleMesh.castShadow = !isSoftwareGl;
    clavicleMesh.userData = { isSkinMesh: true };
    torsoGroup.add(clavicleMesh);

    const neckMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.26, 0.3, 0.35, 16),
      clayMat
    );
    neckMesh.position.set(0, 0.72, 0);
    neckMesh.userData = { isSkinMesh: true };
    torsoGroup.add(neckMesh);

    // =========================================================================
    // Anatomical Head & Face Rig (Driven by MediaPipe Face Detection)
    // =========================================================================
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.18, 0);
    headGroupRef.current = headGroup;
    torsoGroup.add(headGroup);

    // 1. Head Cranium (Smoothed clay mesh)
    const headGeo = new THREE.SphereGeometry(0.38, 24, 24);
    headGeo.scale(1.0, 1.18, 0.96);
    const headMesh = new THREE.Mesh(headGeo, clayMat);
    headMesh.castShadow = !isSoftwareGl;
    headMesh.receiveShadow = !isSoftwareGl;
    headMesh.userData = { isSkinMesh: true };
    headGroup.add(headMesh);

    // 2. Jaw & Chin structure
    const jawMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.28, 0.28, 16),
      clayMat
    );
    jawMesh.position.set(0, -0.32, 0.08);
    jawMesh.userData = { isSkinMesh: true };
    headGroup.add(jawMesh);

    // 3. Eyes (Right & Left)
    const eyeMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a, // dark slate iris/pupil
      roughness: 0.2,
      metalness: 0.1,
    });
    const eyeWhiteMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc, // sclera
      roughness: 0.3,
    });

    [-0.13, 0.13].forEach((xEye) => {
      // Sclera
      const sclera = new THREE.Mesh(
        new THREE.SphereGeometry(0.062, 16, 16),
        eyeWhiteMat
      );
      sclera.position.set(xEye, 0.04, 0.34);
      headGroup.add(sclera);

      // Pupil/Iris
      const pupil = new THREE.Mesh(
        new THREE.SphereGeometry(0.035, 12, 12),
        eyeMat
      );
      pupil.position.set(xEye, 0.04, 0.385);
      headGroup.add(pupil);

      // Brow ridge
      const brow = new THREE.Mesh(
        new THREE.BoxGeometry(0.14, 0.025, 0.05),
        clayMat
      );
      brow.position.set(xEye, 0.13, 0.35);
      brow.rotation.z = xEye > 0 ? -0.1 : 0.1;
      headGroup.add(brow);
    });

    // 4. Anatomical Nose
    const noseMesh = new THREE.Mesh(
      new THREE.ConeGeometry(0.065, 0.17, 12),
      clayMat
    );
    noseMesh.position.set(0, -0.06, 0.39);
    noseMesh.rotation.x = 0.35;
    noseMesh.userData = { isSkinMesh: true };
    headGroup.add(noseMesh);

    // 5. Expressive Mouth / Lips
    const mouthMesh = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.025, 0.14, 6, 12),
      clayMat
    );
    mouthMesh.rotation.z = Math.PI / 2;
    mouthMesh.position.set(0, -0.22, 0.34);
    mouthMesh.userData = { isSkinMesh: true };
    headGroup.add(mouthMesh);

    // 6. Ears (Left & Right)
    [-0.39, 0.39].forEach((xEar) => {
      const earMesh = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.05, 0.12, 6, 8),
        clayMat
      );
      earMesh.position.set(xEar, 0.02, -0.02);
      earMesh.rotation.z = xEar > 0 ? -0.2 : 0.2;
      earMesh.userData = { isSkinMesh: true };
      headGroup.add(earMesh);
    });

    // 7. MediaPipe Face Detection Keypoints Reticle on 3D Model
    const faceReticleGroup = new THREE.Group();
    faceReticleGroup.position.set(0, 0, 0.40);
    faceReticleGroupRef.current = faceReticleGroup;
    faceReticleGroup.visible = false;

    const reticleMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee });
    const kpPositions = [
      new THREE.Vector3(-0.13, 0.04, 0),
      new THREE.Vector3(0.13, 0.04, 0),
      new THREE.Vector3(0, -0.06, 0.02),
      new THREE.Vector3(0, -0.22, -0.02),
      new THREE.Vector3(-0.38, 0.02, -0.4),
      new THREE.Vector3(0.38, 0.02, -0.4),
    ];
    kpPositions.forEach((pos) => {
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 8), reticleMat);
      dot.position.copy(pos);
      faceReticleGroup.add(dot);
    });
    headGroup.add(faceReticleGroup);

    dualArmsRoot.add(torsoGroup);

    // Helper to build a complete articulated arm with shoulder, elbow, forearm, wrist & digits
    function buildCompleteArticulatedArm(isLeft: boolean) {
      const armRoot = new THREE.Group();
      armRoot.position.set(isLeft ? -0.95 : 0.95, 0.9, 0);

      const shoulderJoint = createJointHead(0.13);
      shoulderJoint.userData = { isBoneMesh: true };
      armRoot.add(shoulderJoint);

      const shoulderGroup = new THREE.Group();
      armRoot.add(shoulderGroup);

      const humerusLen = 0.95;
      const upperArmMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14, 0.17, humerusLen, 16),
        clayMat
      );
      upperArmMesh.position.y = -humerusLen / 2;
      upperArmMesh.castShadow = !isSoftwareGl;
      upperArmMesh.userData = { isSkinMesh: true };
      shoulderGroup.add(upperArmMesh);

      const upperArmBone = createBlenderBone(humerusLen, 0.11);
      upperArmBone.rotation.x = Math.PI;
      upperArmBone.userData = { isBoneMesh: true };
      shoulderGroup.add(upperArmBone);

      const elbowGroup = new THREE.Group();
      elbowGroup.position.set(0, -humerusLen, 0);
      shoulderGroup.add(elbowGroup);

      const elbowJoint = createJointHead(0.11);
      elbowJoint.userData = { isBoneMesh: true };
      elbowGroup.add(elbowJoint);

      const forearmLen = 0.88;
      const forearmMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.14, forearmLen, 16),
        clayMat
      );
      forearmMesh.position.y = -forearmLen / 2;
      forearmMesh.castShadow = !isSoftwareGl;
      forearmMesh.userData = { isSkinMesh: true };
      elbowGroup.add(forearmMesh);

      const forearmBone = createBlenderBone(forearmLen, 0.10);
      forearmBone.rotation.x = Math.PI;
      forearmBone.userData = { isBoneMesh: true };
      elbowGroup.add(forearmBone);

      const wristGroup = new THREE.Group();
      wristGroup.position.set(0, -forearmLen, 0);
      elbowGroup.add(wristGroup);

      const wristJoint = createJointHead(0.095);
      wristJoint.userData = { isBoneMesh: true };
      wristGroup.add(wristJoint);

      const palmMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.56, 0.55, 0.19, 4, 4, 3),
        clayMat
      );
      palmMesh.position.set(0, -0.3, 0);
      palmMesh.castShadow = !isSoftwareGl;
      palmMesh.userData = { isSkinMesh: true };
      wristGroup.add(palmMesh);

      function buildPhalanxDigit(
        xOff: number,
        yOff: number,
        zOff: number,
        scale: number,
        isThumb: boolean = false
      ) {
        const mcp = new THREE.Group();
        mcp.position.set(xOff, yOff, zOff);

        const mcpJoint = createJointHead(0.05 * scale);
        mcpJoint.userData = { isBoneMesh: true };
        mcp.add(mcpJoint);

        const pLen = (isThumb ? 0.22 : 0.26) * scale;
        const pMesh = new THREE.Mesh(
          new THREE.CylinderGeometry(0.045 * scale, 0.055 * scale, pLen, 12),
          clayMat
        );
        pMesh.position.y = -pLen / 2;
        pMesh.castShadow = !isSoftwareGl;
        pMesh.userData = { isSkinMesh: true };
        mcp.add(pMesh);

        const pip = new THREE.Group();
        pip.position.set(0, -pLen, 0);
        mcp.add(pip);

        const pipJoint = createJointHead(0.045 * scale);
        pipJoint.userData = { isBoneMesh: true };
        pip.add(pipJoint);

        const mLen = (isThumb ? 0.18 : 0.21) * scale;
        const mMesh = new THREE.Mesh(
          new THREE.CylinderGeometry(0.04 * scale, 0.046 * scale, mLen, 12),
          clayMat
        );
        mMesh.position.y = -mLen / 2;
        mMesh.castShadow = !isSoftwareGl;
        mMesh.userData = { isSkinMesh: true };
        pip.add(mMesh);

        const dip = new THREE.Group();
        dip.position.set(0, -mLen, 0);
        pip.add(dip);

        const dipJoint = createJointHead(0.04 * scale);
        dipJoint.userData = { isBoneMesh: true };
        dip.add(dipJoint);

        const dLen = (isThumb ? 0.15 : 0.17) * scale;
        const dMesh = new THREE.Mesh(
          new THREE.CylinderGeometry(0.035 * scale, 0.04 * scale, dLen, 12),
          clayMat
        );
        dMesh.position.y = -dLen / 2;
        dMesh.castShadow = !isSoftwareGl;
        dMesh.userData = { isSkinMesh: true };
        dip.add(dMesh);

        wristGroup.add(mcp);
        return { mcp, pip, dip };
      }

      const digits = {
        thumb: buildPhalanxDigit(isLeft ? -0.28 : 0.28, -0.22, 0.04, 0.88, true),
        index: buildPhalanxDigit(isLeft ? -0.16 : 0.16, -0.58, 0.01, 0.95, false),
        middle: buildPhalanxDigit(isLeft ? -0.01 : 0.01, -0.61, 0.02, 1.05, false),
        ring: buildPhalanxDigit(isLeft ? 0.14 : -0.14, -0.57, 0.01, 0.95, false),
        pinky: buildPhalanxDigit(isLeft ? 0.26 : -0.26, -0.52, -0.01, 0.82, false),
      };

      dualArmsRoot.add(armRoot);

      return {
        shoulder: shoulderGroup,
        elbow: elbowGroup,
        wrist: wristGroup,
        digits,
      };
    }

    const leftArmConstruct = buildCompleteArticulatedArm(true);
    const rightArmConstruct = buildCompleteArticulatedArm(false);

    dualArmsRef.current = {
      torso: torsoGroup,
      head: headGroup,
      left: leftArmConstruct,
      right: rightArmConstruct,
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
      if (isDualArmModeRef.current) {
        if (dualArmsRootRef.current) {
          dualArmsRootRef.current.rotation.y = THREE.MathUtils.damp(
            dualArmsRootRef.current.rotation.y,
            targetRotationY,
            6,
            rawDt
          );
          dualArmsRootRef.current.rotation.x = THREE.MathUtils.damp(
            dualArmsRootRef.current.rotation.x,
            targetRotationX,
            6,
            rawDt
          );
        }
      } else {
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
      }

      if (isDualArmModeRef.current) {
        if (dualArmsRootRef.current) dualArmsRootRef.current.visible = true;
        if (handRootRef.current) handRootRef.current.visible = false;

        const dualArms = dualArmsRef.current;
        if (dualArms) {
          const activePreset = activePicturePresetRef.current;
          let leftT: ArmJoints = { ...leftArmJointsRef.current };
          let rightT: ArmJoints = { ...rightArmJointsRef.current };

          // If dynamic picture motion is playing, calculate interpolated oscillation
          if (activePreset.isDynamic && isMotionPlayingRef.current && activePreset.dynamicCycle) {
            const cycle = activePreset.dynamicCycle;
            const cycleSpeed = motionSpeedRef.current;
            const t = (Math.sin((now * 0.001 * cycleSpeed * Math.PI * 2) / cycle.durationSec) + 1) / 2;

            if (cycle.leftArmDelta) {
              const lDelta = cycle.leftArmDelta;
              if (lDelta.shoulderPitch !== undefined) leftT.shoulderPitch += lDelta.shoulderPitch * t;
              if (lDelta.shoulderYaw !== undefined) leftT.shoulderYaw += lDelta.shoulderYaw * t;
              if (lDelta.shoulderRoll !== undefined) leftT.shoulderRoll += lDelta.shoulderRoll * t;
              if (lDelta.elbowBend !== undefined) leftT.elbowBend += lDelta.elbowBend * t;
              if (lDelta.elbowTwist !== undefined) leftT.elbowTwist += lDelta.elbowTwist * t;
              if (lDelta.wristPitch !== undefined) leftT.wristPitch += lDelta.wristPitch * t;
              if (lDelta.wristRoll !== undefined) leftT.wristRoll += lDelta.wristRoll * t;
              if (lDelta.fingerCurl !== undefined) leftT.fingerCurl += lDelta.fingerCurl * t;
              if (lDelta.fingerSpread !== undefined) leftT.fingerSpread += lDelta.fingerSpread * t;
            }
            if (cycle.rightArmDelta) {
              const rDelta = cycle.rightArmDelta;
              if (rDelta.shoulderPitch !== undefined) rightT.shoulderPitch += rDelta.shoulderPitch * t;
              if (rDelta.shoulderYaw !== undefined) rightT.shoulderYaw += rDelta.shoulderYaw * t;
              if (rDelta.shoulderRoll !== undefined) rightT.shoulderRoll += rDelta.shoulderRoll * t;
              if (rDelta.elbowBend !== undefined) rightT.elbowBend += rDelta.elbowBend * t;
              if (rDelta.elbowTwist !== undefined) rightT.elbowTwist += rDelta.elbowTwist * t;
              if (rDelta.wristPitch !== undefined) rightT.wristPitch += rDelta.wristPitch * t;
              if (rDelta.wristRoll !== undefined) rightT.wristRoll += rDelta.wristRoll * t;
              if (rDelta.fingerCurl !== undefined) rightT.fingerCurl += rDelta.fingerCurl * t;
              if (rDelta.fingerSpread !== undefined) rightT.fingerSpread += rDelta.fingerSpread * t;
            }
            if (cycle.torsoDelta && dualArms.torso) {
              dualArms.torso.rotation.x = cycle.torsoDelta[0] * t;
            }
          }

          const dampRate = 9.0;
          // Left Arm Rotations
          dualArms.left.shoulder.rotation.x = THREE.MathUtils.damp(dualArms.left.shoulder.rotation.x, leftT.shoulderPitch, dampRate, dt);
          dualArms.left.shoulder.rotation.y = THREE.MathUtils.damp(dualArms.left.shoulder.rotation.y, leftT.shoulderYaw, dampRate, dt);
          dualArms.left.shoulder.rotation.z = THREE.MathUtils.damp(dualArms.left.shoulder.rotation.z, leftT.shoulderRoll, dampRate, dt);

          dualArms.left.elbow.rotation.x = THREE.MathUtils.damp(dualArms.left.elbow.rotation.x, leftT.elbowBend, dampRate, dt);
          dualArms.left.elbow.rotation.y = THREE.MathUtils.damp(dualArms.left.elbow.rotation.y, leftT.elbowTwist, dampRate, dt);

          dualArms.left.wrist.rotation.x = THREE.MathUtils.damp(dualArms.left.wrist.rotation.x, leftT.wristPitch, dampRate, dt);
          dualArms.left.wrist.rotation.z = THREE.MathUtils.damp(dualArms.left.wrist.rotation.z, leftT.wristRoll, dampRate, dt);

          // Right Arm Rotations
          dualArms.right.shoulder.rotation.x = THREE.MathUtils.damp(dualArms.right.shoulder.rotation.x, rightT.shoulderPitch, dampRate, dt);
          dualArms.right.shoulder.rotation.y = THREE.MathUtils.damp(dualArms.right.shoulder.rotation.y, rightT.shoulderYaw, dampRate, dt);
          dualArms.right.shoulder.rotation.z = THREE.MathUtils.damp(dualArms.right.shoulder.rotation.z, rightT.shoulderRoll, dampRate, dt);

          dualArms.right.elbow.rotation.x = THREE.MathUtils.damp(dualArms.right.elbow.rotation.x, rightT.elbowBend, dampRate, dt);
          dualArms.right.elbow.rotation.y = THREE.MathUtils.damp(dualArms.right.elbow.rotation.y, rightT.elbowTwist, dampRate, dt);

          dualArms.right.wrist.rotation.x = THREE.MathUtils.damp(dualArms.right.wrist.rotation.x, rightT.wristPitch, dampRate, dt);
          dualArms.right.wrist.rotation.z = THREE.MathUtils.damp(dualArms.right.wrist.rotation.z, rightT.wristRoll, dampRate, dt);

          // Apply finger curls to both hands
          (['thumb', 'index', 'middle', 'ring', 'pinky'] as const).forEach((d) => {
            const lD = dualArms.left.digits[d];
            if (lD) {
              lD.mcp.rotation.x = THREE.MathUtils.damp(lD.mcp.rotation.x, -leftT.fingerCurl * 0.7, dampRate, dt);
              lD.pip.rotation.x = THREE.MathUtils.damp(lD.pip.rotation.x, -leftT.fingerCurl * 0.8, dampRate, dt);
              lD.dip.rotation.x = THREE.MathUtils.damp(lD.dip.rotation.x, -leftT.fingerCurl * 0.6, dampRate, dt);
              lD.mcp.rotation.z = THREE.MathUtils.damp(lD.mcp.rotation.z, leftT.fingerSpread * (d === 'pinky' ? 0.3 : d === 'index' ? -0.3 : 0), dampRate, dt);
            }
            const rD = dualArms.right.digits[d];
            if (rD) {
              rD.mcp.rotation.x = THREE.MathUtils.damp(rD.mcp.rotation.x, -rightT.fingerCurl * 0.7, dampRate, dt);
              rD.pip.rotation.x = THREE.MathUtils.damp(rD.pip.rotation.x, -rightT.fingerCurl * 0.8, dampRate, dt);
              rD.dip.rotation.x = THREE.MathUtils.damp(rD.dip.rotation.x, -rightT.fingerCurl * 0.6, dampRate, dt);
              rD.mcp.rotation.z = THREE.MathUtils.damp(rD.mcp.rotation.z, rightT.fingerSpread * (d === 'pinky' ? -0.3 : d === 'index' ? 0.3 : 0), dampRate, dt);
            }
          });

          // Head & MediaPipe Face Tracking Driver
          if (dualArms.head) {
            if (isFaceTrackingActiveRef.current && detectedFaceRef.current) {
              const df = detectedFaceRef.current;
              const targetYaw = -df.orientation.yaw;
              const targetPitch = df.orientation.pitch;
              const targetRoll = -df.orientation.roll;

              dualArms.head.rotation.y = THREE.MathUtils.damp(dualArms.head.rotation.y, targetYaw, dampRate, dt);
              dualArms.head.rotation.x = THREE.MathUtils.damp(dualArms.head.rotation.x, targetPitch, dampRate, dt);
              dualArms.head.rotation.z = THREE.MathUtils.damp(dualArms.head.rotation.z, targetRoll, dampRate, dt);

              if (faceReticleGroupRef.current) {
                faceReticleGroupRef.current.visible = true;
              }
            } else {
              const hPreset = activePreset.head || { pitch: 0, yaw: 0, roll: 0 };
              const targetYaw = headJointsRef.current.yaw || hPreset.yaw;
              const targetPitch = headJointsRef.current.pitch || hPreset.pitch;
              const targetRoll = headJointsRef.current.roll || hPreset.roll;

              dualArms.head.rotation.y = THREE.MathUtils.damp(dualArms.head.rotation.y, targetYaw, dampRate, dt);
              dualArms.head.rotation.x = THREE.MathUtils.damp(dualArms.head.rotation.x, targetPitch, dampRate, dt);
              dualArms.head.rotation.z = THREE.MathUtils.damp(dualArms.head.rotation.z, targetRoll, dampRate, dt);

              if (faceReticleGroupRef.current) {
                faceReticleGroupRef.current.visible = false;
              }
            }
          }
        }
      } else {
        if (dualArmsRootRef.current) dualArmsRootRef.current.visible = false;
        if (handRootRef.current) handRootRef.current.visible = true;
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
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', handleContextRestored);
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
    <div className="flex flex-col rounded-[16px] overflow-hidden border border-slate-200 dark:border-[#253448] bg-white dark:bg-[#101C2C] shadow-sm">
      {/* Structured Studio Control Toolbar (Docked cleanly above 3D Canvas) */}
      <div className="px-4 py-3 bg-slate-50 dark:bg-[#0D1726] border-b border-slate-200 dark:border-[#253448] flex flex-wrap items-center justify-between gap-3">
        {/* Left: Rig Status & Mode Switch */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#0E7490] dark:text-[#43D9E9]" aria-hidden="true" />
            <span className="font-heading text-xs sm:text-sm font-bold text-slate-900 dark:text-[#F4F7FB]">
              {isCustomModelActive ? customModelName || 'Custom Blender Model' : 'Anatomical 3D Rig'}
            </span>
          </div>

          <StatusBadge tone={isCustomModelActive ? 'info' : 'success'}>
            {isCustomModelActive
              ? materialMode === 'armature'
                ? 'Blender Armature Active'
                : 'Custom GLB'
              : '60 FPS PBR Rig'}
          </StatusBadge>

          {viewerMode === 'live' && (
            <StatusBadge tone={liveLandmarks && liveLandmarks.length === 21 ? 'success' : 'warning'}>
              {liveLandmarks && liveLandmarks.length === 21
                ? `Live: 21 Landmarks (${handedness})`
                : 'Live Standby'}
            </StatusBadge>
          )}
        </div>

        {/* Center: Mode Navigation Tabs */}
        {showModeTabs && (
          <div
            role="tablist"
            aria-label="3D visualization mode"
            className="flex items-center gap-1 p-1 rounded-[10px] bg-white dark:bg-[#080D18] border border-slate-200 dark:border-[#253448]"
          >
            <button
              type="button"
              role="tab"
              aria-selected={viewerMode === 'preset'}
              onClick={() => {
                setViewerMode('preset');
                setIsPlaying(true);
              }}
              className={`h-8 px-3 rounded-[7px] text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] dark:focus-visible:ring-[#43D9E9] ${
                viewerMode === 'preset'
                  ? 'bg-[#0E7490] dark:bg-[#43D9E9] text-white dark:text-[#080D18]'
                  : 'text-slate-600 dark:text-[#A0AEC0] hover:text-slate-900 dark:hover:text-[#F4F7FB]'
              }`}
            >
              <span>12 Poses</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={viewerMode === 'sequence'}
              onClick={() => {
                setViewerMode('sequence');
                setIsPlaying(true);
              }}
              className={`h-8 px-3 rounded-[7px] text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] dark:focus-visible:ring-[#43D9E9] ${
                viewerMode === 'sequence'
                  ? 'bg-[#0E7490] dark:bg-[#43D9E9] text-white dark:text-[#080D18]'
                  : 'text-slate-600 dark:text-[#A0AEC0] hover:text-slate-900 dark:hover:text-[#F4F7FB]'
              }`}
            >
              <ListChecks className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Sequences ({SIGN_SEQUENCES.length})</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={viewerMode === 'live'}
              onClick={() => setViewerMode('live')}
              className={`h-8 px-3 rounded-[7px] text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] dark:focus-visible:ring-[#43D9E9] ${
                viewerMode === 'live'
                  ? 'bg-[#0E7490] dark:bg-[#43D9E9] text-white dark:text-[#080D18]'
                  : 'text-slate-600 dark:text-[#A0AEC0] hover:text-slate-900 dark:hover:text-[#F4F7FB]'
              }`}
            >
              <Camera className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Live Mirror</span>
            </button>
          </div>
        )}

        {/* Right: Avatar Figure Switch + Blender Tools + Cinema Toggle */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Dual Arm vs Single Hand */}
          <div
            role="group"
            aria-label="3D Figure Mode"
            className="flex items-center p-1 rounded-[10px] bg-white dark:bg-[#080D18] border border-slate-200 dark:border-[#253448]"
          >
            <button
              type="button"
              onClick={() => {
                setIsDualArmMode(true);
                isDualArmModeRef.current = true;
                if (dualArmsRootRef.current) dualArmsRootRef.current.visible = true;
                if (handRootRef.current) handRootRef.current.visible = false;
                if (cameraRef.current) {
                  cameraRef.current.position.set(0, 1.25, 5.6);
                  cameraRef.current.lookAt(0, 0.75, 0);
                }
              }}
              aria-pressed={isDualArmMode}
              className={`h-8 px-2.5 rounded-[7px] text-xs font-semibold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] dark:focus-visible:ring-[#43D9E9] ${
                isDualArmMode
                  ? 'bg-[#0E7490] dark:bg-[#43D9E9] text-white dark:text-[#080D18]'
                  : 'text-slate-600 dark:text-[#A0AEC0] hover:text-slate-900 dark:hover:text-[#F4F7FB]'
              }`}
              title="Whole 2 Arms Figure"
            >
              2 Arms
            </button>

            <button
              type="button"
              onClick={() => {
                setIsDualArmMode(false);
                isDualArmModeRef.current = false;
                if (dualArmsRootRef.current) dualArmsRootRef.current.visible = false;
                if (handRootRef.current) handRootRef.current.visible = true;
                if (cameraRef.current) {
                  cameraRef.current.position.set(0, 1.4, 4.4);
                  cameraRef.current.lookAt(0, 0.85, 0);
                }
              }}
              aria-pressed={!isDualArmMode}
              className={`h-8 px-2.5 rounded-[7px] text-xs font-semibold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] dark:focus-visible:ring-[#43D9E9] ${
                !isDualArmMode
                  ? 'bg-[#0E7490] dark:bg-[#43D9E9] text-white dark:text-[#080D18]'
                  : 'text-slate-600 dark:text-[#A0AEC0] hover:text-slate-900 dark:hover:text-[#F4F7FB]'
              }`}
              title="Single Hand Focus Mode"
            >
              1 Hand
            </button>
          </div>

          {customModelLoaded && (
            <div className="flex items-center p-1 rounded-[10px] bg-white dark:bg-[#080D18] border border-slate-200 dark:border-[#253448]">
              <button
                type="button"
                onClick={() => toggleCustomModel(false)}
                className={`h-8 px-2.5 rounded-[7px] text-xs font-semibold cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] dark:focus-visible:ring-[#43D9E9] ${
                  !isCustomModelActive
                    ? 'bg-[#0E7490] dark:bg-[#43D9E9] text-white dark:text-[#080D18]'
                    : 'text-slate-600 dark:text-[#A0AEC0]'
                }`}
              >
                Studio
              </button>
              <button
                type="button"
                onClick={() => toggleCustomModel(true)}
                className={`h-8 px-2.5 rounded-[7px] text-xs font-semibold cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] dark:focus-visible:ring-[#43D9E9] ${
                  isCustomModelActive
                    ? 'bg-[#0E7490] dark:bg-[#43D9E9] text-white dark:text-[#080D18]'
                    : 'text-slate-600 dark:text-[#A0AEC0]'
                }`}
              >
                Custom GLB
              </button>
            </div>
          )}

          <Button
            variant="secondary"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            leftIcon={<Upload className="w-3.5 h-3.5 text-[#0E7490] dark:text-[#43D9E9]" />}
            title="Import custom Blender 3D model (.glb / .gltf)"
          >
            <span className="hidden sm:inline">Import .glb</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowBlenderGuideModal(true)}
            leftIcon={<HelpCircle className="w-3.5 h-3.5" />}
            title="How to export your Blender 3D hand model to .glb"
          >
            <span className="hidden md:inline">Guide</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowReferenceModal(true)}
            leftIcon={<ImageIcon className="w-3.5 h-3.5" />}
            title="Compare with Blender & Quad Topology Reference Photos"
          >
            <span className="hidden xl:inline">References</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            leftIcon={isCollapsed ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            title="Toggle bottom control dock"
          >
            <span className="hidden sm:inline">{isCollapsed ? 'Show Dock' : 'Cinema'}</span>
          </Button>
        </div>
      </div>

      {/* 3D Canvas Stage */}
      <div className="relative w-full h-[500px] md:h-[560px] overflow-hidden bg-[#080D18]">
        {/* 3D WebGL Canvas Container */}
        <div
          ref={mountRef}
          className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing select-none"
          aria-label="Interactive 3D anatomical hand and arm viewport. Drag to orbit."
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

        {/* WebGL Context Lost / Error Fallback */}
        {webglError && (
          <div className="absolute inset-0 z-40 bg-[#080D18]/92 backdrop-blur-md flex items-center justify-center p-6">
            <div className="max-w-md w-full">
              <ErrorState
                title="3D WebGL Renderer Unavailable"
                message={webglError}
                onRetry={() => setWebglError(null)}
                retryLabel="Dismiss Warning"
              />
            </div>
          </div>
        )}

        {/* Custom Model Loading Overlay */}
        {customModelLoading && (
          <div className="absolute inset-0 z-40 bg-[#080D18]/80 backdrop-blur-xs flex items-center justify-center p-6">
            <LoadingState
              title="Importing Custom Blender 3D Model"
              description="Parsing mesh geometry, PBR materials, and armature bone transforms..."
              className="max-w-sm w-full"
            />
          </div>
        )}

        {/* Custom Model Upload Error Banner */}
        {customModelError && (
          <div className="absolute top-3 left-3 z-30 max-w-md w-[calc(100%-1.5rem)]">
            <Alert
              variant="error"
              title="Model Import Failed"
              onDismiss={() => setCustomModelError(null)}
            >
              {customModelError}
            </Alert>
          </div>
        )}

        {/* Whole 2 Arms Picture Movement & Joint Angles Adjuster */}
        {isDualArmMode && (
          <DualArmPoseAdjuster
            activePresetId={activePicturePresetId}
            onSelectPreset={handleSelectPicturePreset}
            leftArmJoints={leftArmJoints}
            rightArmJoints={rightArmJoints}
            onUpdateJoints={handleUpdateJoints}
            onResetJoints={handleResetJoints}
            headJoints={headJoints}
            onUpdateHead={handleUpdateHead}
            detectedFace={detectedFace}
            isFaceTrackingActive={isFaceTrackingActive}
            onToggleFaceTracking={handleToggleFaceTracking}
            isMotionPlaying={isMotionPlaying}
            onToggleMotion={() => setIsMotionPlaying(!isMotionPlaying)}
            motionSpeed={motionSpeed}
            onChangeSpeed={(spd) => setMotionSpeed(spd)}
            selectedArmTarget={selectedArmTarget}
            onSelectArmTarget={(target) => setSelectedArmTarget(target)}
            isOpen={isArmAdjusterOpen}
            onToggleOpen={() => setIsArmAdjusterOpen(!isArmAdjusterOpen)}
          />
        )}

        {/* Collapsible Bottom Control Dock */}
        <div
          className={`absolute bottom-3 left-1/2 -translate-x-1/2 z-20 w-[96%] max-w-[940px] transition-all duration-200 ${
            isCollapsed ? 'translate-y-36 opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
          }`}
        >
          <div className="p-3.5 sm:p-4 rounded-[16px] bg-white dark:bg-[#101C2C]/96 border border-slate-200 dark:border-[#253448] shadow-2xl backdrop-blur-md flex flex-col gap-3">
            {/* TAB 1: PRESET GESTURES EXPLORER */}
            {viewerMode === 'preset' && (
              <div className="flex flex-wrap items-center justify-center gap-1.5" role="group" aria-label="3D Hand Pose Presets">
                <button
                  type="button"
                  onClick={() => onSelectGesture?.('neutral')}
                  aria-pressed={activeGestureKey === 'neutral'}
                  className={`h-8 px-3 rounded-[8px] text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] dark:focus-visible:ring-[#43D9E9] ${
                    activeGestureKey === 'neutral'
                      ? 'bg-[#0E7490] dark:bg-[#43D9E9] text-white dark:text-[#080D18]'
                      : 'bg-slate-100 dark:bg-[#172438] text-slate-700 dark:text-[#A0AEC0] hover:text-slate-900 dark:hover:text-[#F4F7FB]'
                  }`}
                >
                  <span>Neutral Pose</span>
                </button>

                {Object.keys(GESTURE_DEFINITIONS).map((key) => {
                  const def = GESTURE_DEFINITIONS[key];
                  const isSelected = activeGestureKey === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => onSelectGesture?.(key as GestureKey)}
                      aria-pressed={isSelected}
                      className={`h-8 px-2.5 rounded-[8px] text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] dark:focus-visible:ring-[#43D9E9] ${
                        isSelected
                          ? 'bg-[#0E7490] dark:bg-[#43D9E9] text-white dark:text-[#080D18]'
                          : 'bg-slate-100 dark:bg-[#172438] text-slate-700 dark:text-[#A0AEC0] hover:text-slate-900 dark:hover:text-[#F4F7FB]'
                      }`}
                    >
                      <span aria-hidden="true">{def.emoji}</span>
                      <span>{def.labelEn}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* TAB 2: SENTENCE SEQUENCES */}
            {viewerMode === 'sequence' && selectedSequence && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-[#253448] pb-2">
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-slate-600 dark:text-[#A0AEC0] font-semibold uppercase text-[11px]">Scenarios:</span>
                    {(['all', 'classroom', 'service', 'daily'] as const).map((sc) => (
                      <button
                        key={sc}
                        type="button"
                        onClick={() => setSelectedScenarioFilter(sc)}
                        className={`px-2.5 py-1 rounded-[8px] text-xs font-semibold capitalize cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] dark:focus-visible:ring-[#43D9E9] ${
                          selectedScenarioFilter === sc
                            ? 'bg-[#0E7490]/15 dark:bg-[#43D9E9]/15 text-[#0E7490] dark:text-[#43D9E9] border border-[#0E7490]/30 dark:border-[#43D9E9]/40'
                            : 'text-slate-600 dark:text-[#A0AEC0] hover:text-slate-900 dark:hover:text-[#F4F7FB]'
                        }`}
                      >
                        {sc === 'all' ? 'All Phrases' : sc}
                      </button>
                    ))}
                  </div>

                  <StatusBadge tone="info">{selectedSequence.scenarioLabelEn}</StatusBadge>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 max-h-24 overflow-y-auto">
                  {SIGN_SEQUENCES.filter((s) => selectedScenarioFilter === 'all' || s.scenario === selectedScenarioFilter).map((seq) => {
                    const isSelected = selectedSequence.id === seq.id;
                    return (
                      <button
                        key={seq.id}
                        type="button"
                        onClick={() => {
                          setSelectedSequence(seq);
                          setCurrentStepIndex(0);
                          stepTimerRef.current = 0;
                          setIsPlaying(true);
                        }}
                        className={`h-8 px-3 rounded-[8px] text-xs font-medium border transition-colors flex items-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] dark:focus-visible:ring-[#43D9E9] ${
                          isSelected
                            ? 'bg-[#0E7490] dark:bg-[#43D9E9] text-white dark:text-[#080D18] border-transparent font-semibold'
                            : 'bg-slate-100 dark:bg-[#172438] text-slate-700 dark:text-[#F4F7FB] border-slate-200 dark:border-[#253448]'
                        }`}
                      >
                        <span aria-hidden="true">{seq.steps[0]?.emoji || '🎬'}</span>
                        <span>{seq.titleEn}</span>
                        <span
                          className={`text-[11px] font-ethiopic ${
                            isSelected ? 'text-white dark:text-[#080D18]' : 'text-slate-600 dark:text-[#A0AEC0]'
                          }`}
                        >
                          ({seq.titleAm})
                        </span>
                      </button>
                    );
                  })}
                </div>

                {selectedSequence.steps[currentStepIndex] && (
                  <div className="p-3 rounded-[12px] bg-slate-50 dark:bg-[#080D18] border border-slate-200 dark:border-[#253448] flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-2xl shrink-0" aria-hidden="true">{selectedSequence.steps[currentStepIndex].emoji}</span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-heading font-bold text-slate-900 dark:text-[#F4F7FB] text-sm">
                            {selectedSequence.steps[currentStepIndex].glossEn}
                          </span>
                          <span className="text-[#0E7490] dark:text-[#43D9E9] font-semibold font-ethiopic text-xs">
                            {selectedSequence.steps[currentStepIndex].glossAm}
                          </span>
                          <StatusBadge tone="success">
                            Step {currentStepIndex + 1} / {selectedSequence.steps.length}
                          </StatusBadge>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-[#A0AEC0] mt-0.5 truncate">
                          {selectedSequence.steps[currentStepIndex].description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleSpeakCurrentStep(selectedSequence.steps[currentStepIndex])}
                        aria-label="Speak current step"
                        leftIcon={<Volume2 className="w-3.5 h-3.5 text-[#0E7490] dark:text-[#43D9E9]" />}
                      />
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handlePrevStep}
                        disabled={currentStepIndex === 0}
                        aria-label="Previous step"
                        leftIcon={<StepBack className="w-3.5 h-3.5" />}
                      />
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setIsPlaying(!isPlaying)}
                        leftIcon={isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      >
                        {isPlaying ? 'Pause' : 'Play'}
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleNextStep}
                        disabled={currentStepIndex === selectedSequence.steps.length - 1}
                        aria-label="Next step"
                        leftIcon={<StepForward className="w-3.5 h-3.5" />}
                      />
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleReplaySequence}
                        aria-label="Replay sequence"
                        leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-1 w-full pt-0.5">
                  {selectedSequence.steps.map((st, i) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => {
                        setCurrentStepIndex(i);
                        stepTimerRef.current = 0;
                      }}
                      aria-label={`Jump to step ${i + 1}: ${st.glossEn}`}
                      className={`h-1.5 rounded-full flex-1 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] dark:focus-visible:ring-[#43D9E9] ${
                        i === currentStepIndex
                          ? 'bg-[#0E7490] dark:bg-[#43D9E9]'
                          : i < currentStepIndex
                          ? 'bg-emerald-600 dark:bg-emerald-500'
                          : 'bg-slate-200 dark:bg-[#253448]'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: LIVE CAMERA MIRRORING STATUS */}
            {viewerMode === 'live' && (
              <div className="p-3 rounded-[12px] bg-slate-50 dark:bg-[#080D18] border border-slate-200 dark:border-[#253448] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 border ${
                    liveLandmarks && liveLandmarks.length === 21
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-400'
                      : 'bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-400'
                  }`}>
                    <Activity className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <div>
                    <div className="font-heading font-bold text-slate-900 dark:text-[#F4F7FB]">
                      {liveLandmarks && liveLandmarks.length === 21
                        ? 'Live Kinematic Landmark Mirror Active'
                        : 'Live Mirror Standby (No Hand in Frame)'}
                    </div>
                    <p className="text-slate-600 dark:text-[#A0AEC0] text-[11px] mt-0.5">
                      {liveLandmarks && liveLandmarks.length === 21
                        ? 'Streaming 21 MediaPipe coordinates directly into articulated finger bones.'
                        : 'Start camera in Live Recognition to mirror hand and face movements.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge tone="neutral">{handedness} Hand</StatusBadge>
                  <StatusBadge tone={liveLandmarks && liveLandmarks.length === 21 ? 'success' : 'neutral'}>
                    {liveLandmarks ? `${liveLandmarks.length} Points` : '0 Points'}
                  </StatusBadge>
                </div>
              </div>
            )}

            {/* Bottom Row: Shading Mode + Speed + Playback Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200 dark:border-[#253448]">
              <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="3D Material Shading">
                <span className="text-[11px] font-semibold text-slate-600 dark:text-[#A0AEC0] mr-1">Shading:</span>

                {[
                  { id: 'clay' as const, label: 'Anatomical Clay' },
                  { id: 'wireframe' as const, label: 'Quad Topology' },
                  { id: 'armature' as const, label: 'Blender Rig', icon: <Bone className="w-3 h-3" aria-hidden="true" /> },
                ].map((modeOption) => (
                  <button
                    key={modeOption.id}
                    type="button"
                    onClick={() => setMaterialMode(modeOption.id)}
                    aria-pressed={materialMode === modeOption.id}
                    className={`h-8 px-2.5 rounded-[8px] text-xs font-medium border transition-colors flex items-center gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] dark:focus-visible:ring-[#43D9E9] ${
                      materialMode === modeOption.id
                        ? 'bg-[#0E7490] dark:bg-[#43D9E9] text-white dark:text-[#080D18] border-[#0E7490] dark:border-[#43D9E9] font-semibold'
                        : 'bg-slate-100 dark:bg-[#172438] text-slate-700 dark:text-[#A0AEC0] border-slate-200 dark:border-[#253448] hover:text-slate-900 dark:hover:text-[#F4F7FB]'
                    }`}
                  >
                    {modeOption.icon}
                    <span>{modeOption.label}</span>
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#080D18] p-1 rounded-[8px] border border-slate-200 dark:border-[#253448]">
                  {[0.5, 1.0, 1.5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setPlaybackSpeed(s)}
                      className={`px-2 py-0.5 rounded-[6px] text-[11px] font-mono font-semibold cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] dark:focus-visible:ring-[#43D9E9] ${
                        playbackSpeed === s
                          ? 'bg-[#0E7490] dark:bg-[#43D9E9] text-white dark:text-[#080D18]'
                          : 'text-slate-600 dark:text-[#A0AEC0] hover:text-slate-900 dark:hover:text-[#F4F7FB]'
                      }`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>

                <Button
                  variant={isPlaying ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setIsPlaying(!isPlaying)}
                  aria-label={isPlaying ? 'Pause transition' : 'Play transition'}
                  leftIcon={isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                />

                <Button
                  variant={autoRotate ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setAutoRotate(!autoRotate)}
                  aria-label="Toggle auto rotate"
                  leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                />

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleResetView}
                  leftIcon={<RotateCcw className="w-3 h-3" />}
                >
                  Reset View
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reference Photographs Comparison Modal */}
      <Modal
        isOpen={showReferenceModal}
        onClose={() => setShowReferenceModal(false)}
        title="3D Hand Model & Armature References"
        description="Anatomical topology and skeletal bone hierarchy reference guides."
        icon={<ImageIcon className="w-5 h-5" />}
        maxWidthClass="max-w-4xl"
        footer={
          <>
            <span className="text-xs text-slate-600 dark:text-[#A0AEC0]">
              Both reference standards are active in the Three.js model.
            </span>
            <Button variant="primary" size="sm" onClick={() => setShowReferenceModal(false)}>
              Back to 3D Studio
            </Button>
          </>
        }
      >
        <div className="grid md:grid-cols-2 gap-5">
          <div className="bg-slate-50 dark:bg-[#080D18] rounded-[14px] p-4 border border-slate-200 dark:border-[#253448] space-y-3">
            <div className="flex items-center justify-between">
              <StatusBadge tone="success">Reference #1: Quad Topology</StatusBadge>
              <span className="text-xs text-slate-600 dark:text-[#A0AEC0]">Palmar &amp; Dorsal</span>
            </div>
            <div className="rounded-[10px] overflow-hidden border border-slate-200 dark:border-[#253448] bg-black aspect-square flex items-center justify-center">
              <img
                src="/assets/aistudio/Screenshot_2026-10-22_175411_ae73bd1e.png"
                alt="Hand Quad Topology Reference"
                className="w-full h-full object-contain"
              />
            </div>
            <p className="text-xs text-slate-600 dark:text-[#A0AEC0] leading-relaxed">
              Demonstrates the anatomical hand shape, phalanx ratios, and quad wireframe edge loop flow mirrored in <strong>Quad Topology</strong> shading.
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-[#080D18] rounded-[14px] p-4 border border-slate-200 dark:border-[#253448] space-y-3">
            <div className="flex items-center justify-between">
              <StatusBadge tone="info">Reference #2: Blender Rig</StatusBadge>
              <span className="text-xs text-slate-600 dark:text-[#A0AEC0]">Bone 0–21 Hierarchy</span>
            </div>
            <div className="rounded-[10px] overflow-hidden border border-slate-200 dark:border-[#253448] bg-black aspect-square flex items-center justify-center">
              <img
                src="/assets/aistudio/Screenshot_2026-10-22_175423_a9cf9e69.png"
                alt="Blender Armature Hand Rig Reference"
                className="w-full h-full object-contain"
              />
            </div>
            <p className="text-xs text-slate-600 dark:text-[#A0AEC0] leading-relaxed">
              Shows the octahedral skeletal bone hierarchy (Wrist 0, Thumb 1–3, Index 5–8, Middle 9–13, Ring 14–17, Pinky 18–21) used in <strong>Blender Rig</strong> shading.
            </p>
          </div>
        </div>
      </Modal>

      {/* Blender Export & Integration Guide Modal */}
      <Modal
        isOpen={showBlenderGuideModal}
        onClose={() => setShowBlenderGuideModal(false)}
        title="Custom Blender 3D Model Export Guide"
        description="Export your rigged Blender hand file as glTF 2.0 (.glb) for the Three.js WebGL engine."
        icon={<FileCode className="w-5 h-5" />}
        maxWidthClass="max-w-3xl"
        footer={
          <>
            <span className="text-xs text-slate-600 dark:text-[#A0AEC0]">
              Ready with your exported <code>.glb</code> file?
            </span>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowBlenderGuideModal(false)}>
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Upload className="w-3.5 h-3.5" />}
                onClick={() => {
                  setShowBlenderGuideModal(false);
                  fileInputRef.current?.click();
                }}
              >
                Choose .glb File
              </Button>
            </div>
          </>
        }
      >
        <Alert variant="info" title="Why export from .blend to .glb?">
          Web browsers cannot read proprietary <code>.blend</code> files directly. Three.js uses <strong>glTF 2.0 Binary (.glb)</strong> to package geometry, PBR materials, and skeletal rigs into one web-ready file.
        </Alert>

        <div className="space-y-3">
          {[
            {
              step: 1,
              title: 'Select Hand Mesh & Armature in Object Mode',
              body: 'Select your hand mesh and skeletal armature rig (or press A in Blender Object Mode).',
            },
            {
              step: 2,
              title: 'Export via File → Export → glTF 2.0 (.glb/.gltf)',
              body: 'Set Format to glTF Binary (.glb), Enable +Y Up, Apply Modifiers, and Deformation Bones Only.',
            },
            {
              step: 3,
              title: 'Load via Browser Upload or public/models/hand.glb',
              body: 'Use "Import .glb" in the Studio toolbar to test immediately from your computer.',
            },
          ].map((s) => (
            <div
              key={s.step}
              className="p-3.5 rounded-[12px] bg-slate-50 dark:bg-[#080D18] border border-slate-200 dark:border-[#253448] flex items-start gap-3"
            >
              <span className="w-6 h-6 rounded-full bg-[#0E7490] dark:bg-[#43D9E9] text-white dark:text-[#080D18] font-bold text-xs flex items-center justify-center shrink-0">
                {s.step}
              </span>
              <div className="text-xs space-y-0.5">
                <p className="font-semibold text-slate-900 dark:text-[#F4F7FB]">{s.title}</p>
                <p className="text-slate-600 dark:text-[#A0AEC0]">{s.body}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 rounded-[14px] bg-slate-50 dark:bg-[#080D18] border border-slate-200 dark:border-[#253448] space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h5 className="font-heading text-sm font-bold text-slate-900 dark:text-[#F4F7FB]">
                1-Click Blender Auto-Rigging Python Script
              </h5>
              <p className="text-xs text-slate-600 dark:text-[#A0AEC0]">
                Adds 21 octahedral bones &amp; parents with Automatic Weights inside Blender Scripting.
              </p>
            </div>
            <Button
              variant={copiedScript ? 'secondary' : 'primary'}
              size="sm"
              leftIcon={copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" /> : <FileCode className="w-3.5 h-3.5" />}
              onClick={() => {
                navigator.clipboard.writeText(BLENDER_AUTO_RIG_SCRIPT);
                setCopiedScript(true);
                showToast('Copied Blender auto-rigging Python script', 'success');
                setTimeout(() => setCopiedScript(false), 2500);
              }}
            >
              {copiedScript ? 'Copied' : 'Copy Python Script'}
            </Button>
          </div>
          <div className="rounded-[10px] overflow-hidden bg-[#080D18] border border-[#253448] p-3 max-h-36 overflow-y-auto font-mono text-[11px] text-[#43D9E9] leading-tight select-all">
            <pre>{BLENDER_AUTO_RIG_SCRIPT}</pre>
          </div>
        </div>
      </Modal>
    </div>
  );
};
