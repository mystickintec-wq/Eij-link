import {
  DUAL_ARM_PICTURE_PRESETS,
  DualArmPose,
  ArmJoints,
} from '../services/dualArmKinematics';
import { HeadJoints, DetectedFace } from '../types';
import {
  Sliders,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  BookOpen,
  ChevronDown,
  ChevronUp,
  X,
  Volume2,
  Smile,
  Eye
} from 'lucide-react';

interface DualArmPoseAdjusterProps {
  activePresetId: string;
  onSelectPreset: (preset: DualArmPose) => void;
  leftArmJoints: ArmJoints;
  rightArmJoints: ArmJoints;
  onUpdateJoints: (arm: 'left' | 'right' | 'both', updates: Partial<ArmJoints>) => void;
  onResetJoints: () => void;
  headJoints?: HeadJoints;
  onUpdateHead?: (updates: Partial<HeadJoints>) => void;
  detectedFace?: DetectedFace | null;
  isFaceTrackingActive?: boolean;
  onToggleFaceTracking?: () => void;
  isMotionPlaying: boolean;
  onToggleMotion: () => void;
  motionSpeed: number;
  onChangeSpeed: (speed: number) => void;
  selectedArmTarget: 'both' | 'right' | 'left';
  onSelectArmTarget: (target: 'both' | 'right' | 'left') => void;
  isOpen: boolean;
  onToggleOpen: () => void;
}

export const DualArmPoseAdjuster: React.FC<DualArmPoseAdjusterProps> = ({
  activePresetId,
  onSelectPreset,
  leftArmJoints,
  rightArmJoints,
  onUpdateJoints,
  onResetJoints,
  headJoints = { pitch: 0, yaw: 0, roll: 0 },
  onUpdateHead,
  detectedFace = null,
  isFaceTrackingActive = true,
  onToggleFaceTracking,
  isMotionPlaying,
  onToggleMotion,
  motionSpeed,
  onChangeSpeed,
  selectedArmTarget,
  onSelectArmTarget,
  isOpen,
  onToggleOpen,
}) => {
  const activePreset =
    DUAL_ARM_PICTURE_PRESETS.find((p) => p.id === activePresetId) ||
    DUAL_ARM_PICTURE_PRESETS[0];

  const currentJoints =
    selectedArmTarget === 'left' ? leftArmJoints : rightArmJoints;

  const handleSliderChange = (jointKey: keyof ArmJoints, value: number) => {
    onUpdateJoints(selectedArmTarget, { [jointKey]: value });
  };

  return (
    <div className="absolute top-16 right-3 z-30 flex flex-col items-end pointer-events-auto max-w-[380px] w-full">
      {/* Drawer Toggle Header Button */}
      <button
        onClick={onToggleOpen}
        className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-xs shadow-xl flex items-center gap-2 transition-all cursor-pointer border border-cyan-300/40"
      >
        <Sliders className="w-4 h-4" />
        <span>Arm & Picture Movement Adjuster</span>
        {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {/* Expanded Adjuster Panel */}
      {isOpen && (
        <div className="mt-2 w-full max-h-[82vh] overflow-y-auto rounded-2xl bg-[#09111E]/95 border border-cyan-500/40 shadow-2xl backdrop-blur-md p-3.5 text-left text-slate-200 text-xs space-y-3.5 ring-1 ring-cyan-500/20">
          {/* Top Title & Close */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                PDF Picture Movement Studio
              </span>
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>Whole 2 Arms Kinematics</span>
              </h4>
            </div>
            <button
              onClick={onToggleOpen}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Picture Movement Presets from PDF */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-slate-300 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                <span>PDF Picture Movement Presets:</span>
              </span>
              <span className="text-[10px] text-slate-400">PDF Page {activePreset.pdfPage}</span>
            </div>

            <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
              {DUAL_ARM_PICTURE_PRESETS.map((preset) => {
                const isSelected = activePresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => onSelectPreset(preset)}
                    className={`p-1.5 rounded-lg border text-left transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-gradient-to-r from-cyan-950 to-blue-950 border-cyan-400 text-white shadow-xs'
                        : 'bg-[#0E1A2C] hover:bg-[#14233A] border-slate-800 text-slate-300'
                    }`}
                  >
                    <span className="text-base shrink-0">{preset.emoji}</span>
                    <div className="min-w-0">
                      <div className="font-bold text-[11px] truncate leading-tight">
                        {preset.labelEn.split('(')[0].trim()}
                      </div>
                      <div className="text-[10px] font-ethiopic text-cyan-400 truncate">
                        {preset.labelAm}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Preset Description Card */}
          <div className="p-2.5 rounded-xl bg-[#0E1A2C] border border-cyan-500/25 text-[11px] leading-relaxed text-slate-300">
            <strong className="text-cyan-300 block mb-0.5">
              {activePreset.labelEn} · {activePreset.labelAm} [{activePreset.phoneticAm}]
            </strong>
            {activePreset.description}
          </div>

          {/* Dynamic Movement Player */}
          {activePreset.isDynamic && (
            <div className="p-2.5 rounded-xl bg-slate-900/90 border border-emerald-500/30 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={onToggleMotion}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isMotionPlaying
                      ? 'bg-emerald-500 text-slate-950 shadow-md'
                      : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                  }`}
                >
                  {isMotionPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isMotionPlaying ? 'Pause Motion' : 'Play Picture Motion'}</span>
                </button>
              </div>

              {/* Speed Controls */}
              <div className="flex items-center gap-1 text-[10px]">
                {[0.5, 1, 1.5].map((spd) => (
                  <button
                    key={spd}
                    onClick={() => onChangeSpeed(spd)}
                    className={`px-1.5 py-0.5 rounded font-mono cursor-pointer ${
                      motionSpeed === spd
                        ? 'bg-cyan-400 text-slate-950 font-bold'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Target Arm Selector */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Joint Adjuster Target:
            </span>
            <div className="grid grid-cols-3 gap-1 p-0.5 rounded-xl bg-[#0E1A2C] border border-slate-800 text-[11px]">
              <button
                onClick={() => onSelectArmTarget('both')}
                className={`py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  selectedArmTarget === 'both'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                👐 Both Arms
              </button>
              <button
                onClick={() => onSelectArmTarget('right')}
                className={`py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  selectedArmTarget === 'right'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                👉 Right Arm
              </button>
              <button
                onClick={() => onSelectArmTarget('left')}
                className={`py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  selectedArmTarget === 'left'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                👈 Left Arm
              </button>
            </div>
          </div>

          {/* Interactive Joint Sliders */}
          <div className="space-y-2.5 pt-1 border-t border-slate-800">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
              <span>Fine-Tune Joint Angles:</span>
              <button
                onClick={onResetJoints}
                className="text-cyan-400 hover:text-cyan-300 text-[10px] flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" /> Reset Angles
              </button>
            </div>

            {/* 1. Shoulder Pitch */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>Shoulder Elevation (Up / Down)</span>
                <span className="font-mono text-cyan-300">
                  {Math.round((currentJoints.shoulderPitch * 180) / Math.PI)}°
                </span>
              </div>
              <input
                type="range"
                min="-0.5"
                max="1.6"
                step="0.02"
                value={currentJoints.shoulderPitch}
                onChange={(e) => handleSliderChange('shoulderPitch', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            {/* 2. Shoulder Yaw */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>Shoulder Swing (Forward / Back)</span>
                <span className="font-mono text-cyan-300">
                  {Math.round((currentJoints.shoulderYaw * 180) / Math.PI)}°
                </span>
              </div>
              <input
                type="range"
                min="-1.0"
                max="1.0"
                step="0.02"
                value={currentJoints.shoulderYaw}
                onChange={(e) => handleSliderChange('shoulderYaw', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            {/* 3. Elbow Bend */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>Elbow Flexion (Bend Angle)</span>
                <span className="font-mono text-cyan-300">
                  {Math.round((currentJoints.elbowBend * 180) / Math.PI)}°
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="2.5"
                step="0.02"
                value={currentJoints.elbowBend}
                onChange={(e) => handleSliderChange('elbowBend', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            {/* 4. Forearm Twist */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>Forearm Twist (Palm Orientation)</span>
                <span className="font-mono text-cyan-300">
                  {Math.round((currentJoints.elbowTwist * 180) / Math.PI)}°
                </span>
              </div>
              <input
                type="range"
                min="-1.5"
                max="1.5"
                step="0.02"
                value={currentJoints.elbowTwist}
                onChange={(e) => handleSliderChange('elbowTwist', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            {/* 5. Wrist Pitch */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>Wrist Flexion / Tilt</span>
                <span className="font-mono text-cyan-300">
                  {Math.round((currentJoints.wristPitch * 180) / Math.PI)}°
                </span>
              </div>
              <input
                type="range"
                min="-0.8"
                max="0.8"
                step="0.02"
                value={currentJoints.wristPitch}
                onChange={(e) => handleSliderChange('wristPitch', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            {/* 6. Finger Curl */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>Finger Handshape Curl (Fist / Open)</span>
                <span className="font-mono text-cyan-300">
                  {Math.round((currentJoints.fingerCurl / 1.5) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.5"
                step="0.02"
                value={currentJoints.fingerCurl}
                onChange={(e) => handleSliderChange('fingerCurl', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            {/* 7. Finger Spread */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>Finger Spread / Alignment</span>
                <span className="font-mono text-cyan-300">
                  {Math.round(currentJoints.fingerSpread * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="-0.3"
                max="0.5"
                step="0.02"
                value={currentJoints.fingerSpread}
                onChange={(e) => handleSliderChange('fingerSpread', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            {/* ========================================================= */}
            {/* 3D Head & MediaPipe Face Detection Controls */}
            {/* ========================================================= */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200 flex items-center gap-1.5">
                  <Smile className="w-3.5 h-3.5 text-cyan-400" />
                  <span>MediaPipe Face & Head Rig</span>
                </span>
                {onToggleFaceTracking && (
                  <button
                    onClick={onToggleFaceTracking}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                      isFaceTrackingActive
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {isFaceTrackingActive ? 'Tracking: ON' : 'Manual'}
                  </button>
                )}
              </div>

              {/* Live Face Detection Telemetry Badge */}
              {detectedFace ? (
                <div className="p-2 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-[10px] space-y-1">
                  <div className="flex items-center justify-between text-cyan-300">
                    <span className="font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                      Live Face Tracking Active
                    </span>
                    <span className="font-mono">{Math.round(detectedFace.score * 100)}% conf</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 font-mono text-slate-300 text-center text-[9px]">
                    <div className="bg-slate-900/60 p-1 rounded">
                      Yaw: <span className="text-cyan-400">{detectedFace.orientation.yawDeg}°</span>
                    </div>
                    <div className="bg-slate-900/60 p-1 rounded">
                      Pitch: <span className="text-cyan-400">{detectedFace.orientation.pitchDeg}°</span>
                    </div>
                    <div className="bg-slate-900/60 p-1 rounded">
                      Roll: <span className="text-cyan-400">{detectedFace.orientation.rollDeg}°</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-[10px] text-slate-400 italic">
                  Face Detection standby — start camera to mirror live head movement or use manual sliders below:
                </div>
              )}

              {/* Head Pitch (Nodding) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>Head Pitch (Nod Up / Down)</span>
                  <span className="font-mono text-cyan-300">
                    {Math.round((headJoints.pitch * 180) / Math.PI)}°
                  </span>
                </div>
                <input
                  type="range"
                  min="-0.7"
                  max="0.7"
                  step="0.02"
                  value={headJoints.pitch}
                  onChange={(e) => onUpdateHead?.({ pitch: parseFloat(e.target.value) })}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>

              {/* Head Yaw (Turn Left / Right) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>Head Yaw (Turn Left / Right)</span>
                  <span className="font-mono text-cyan-300">
                    {Math.round((headJoints.yaw * 180) / Math.PI)}°
                  </span>
                </div>
                <input
                  type="range"
                  min="-1.1"
                  max="1.1"
                  step="0.02"
                  value={headJoints.yaw}
                  onChange={(e) => onUpdateHead?.({ yaw: parseFloat(e.target.value) })}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>

              {/* Head Roll (Tilt Sideways) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>Head Roll (Tilt Sideways)</span>
                  <span className="font-mono text-cyan-300">
                    {Math.round((headJoints.roll * 180) / Math.PI)}°
                  </span>
                </div>
                <input
                  type="range"
                  min="-0.6"
                  max="0.6"
                  step="0.02"
                  value={headJoints.roll}
                  onChange={(e) => onUpdateHead?.({ roll: parseFloat(e.target.value) })}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>

              {/* Quick Head Pose Buttons */}
              <div className="grid grid-cols-3 gap-1 pt-1">
                <button
                  type="button"
                  onClick={() => onUpdateHead?.({ pitch: 0, yaw: 0, roll: 0 })}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 transition-colors"
                >
                  Straight Ahead
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateHead?.({ pitch: 0.22, yaw: 0, roll: 0 })}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 transition-colors"
                >
                  Nod Yes (+12°)
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateHead?.({ pitch: -0.22, yaw: 0.15, roll: 0 })}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 transition-colors"
                >
                  Watch Hands
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
