import React from 'react';
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
  BookOpen,
  ChevronDown,
  ChevronUp,
  X,
  Smile,
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
    <div className="absolute top-3 right-3 z-20 flex flex-col items-end pointer-events-auto max-w-[360px] w-[calc(100%-1.5rem)] sm:w-full">
      {/* Drawer Toggle Header Button */}
      <button
        type="button"
        onClick={onToggleOpen}
        aria-expanded={isOpen}
        className="h-9 px-3.5 rounded-[10px] bg-[#101C2C]/95 hover:bg-[#172438] text-[#F4F7FB] font-semibold text-xs shadow-lg flex items-center gap-2 transition-colors cursor-pointer border border-[#43D9E9]/40 backdrop-blur-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#43D9E9]"
      >
        <Sliders className="w-3.5 h-3.5 text-[#43D9E9]" aria-hidden="true" />
        <span>Arm &amp; Head Kinematics</span>
        {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-[#A0AEC0]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#A0AEC0]" />}
      </button>

      {/* Expanded Adjuster Panel */}
      {isOpen && (
        <div className="mt-2 w-full max-h-[72vh] overflow-y-auto rounded-[16px] bg-[#101C2C]/95 border border-[#253448] shadow-2xl backdrop-blur-md p-4 text-left text-[#F4F7FB] text-xs space-y-3.5">
          {/* Top Title & Close */}
          <div className="flex items-center justify-between pb-2.5 border-b border-[#253448]">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#43D9E9]">
                PDF Picture Movement Studio
              </span>
              <h4 className="font-heading text-sm font-bold text-[#F4F7FB]">
                Whole 2 Arms Kinematics
              </h4>
            </div>
            <button
              type="button"
              onClick={onToggleOpen}
              aria-label="Close arm kinematics adjuster"
              className="w-8 h-8 rounded-[8px] text-[#A0AEC0] hover:text-[#F4F7FB] hover:bg-[#172438] flex items-center justify-center cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#43D9E9]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Picture Movement Presets from PDF */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-[#F4F7FB] flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-[#43D9E9]" aria-hidden="true" />
                <span>PDF Picture Presets</span>
              </span>
              <span className="text-[11px] font-mono text-[#A0AEC0]">PDF p.{activePreset.pdfPage}</span>
            </div>

            <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
              {DUAL_ARM_PICTURE_PRESETS.map((preset) => {
                const isSelected = activePresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => onSelectPreset(preset)}
                    className={`p-2 rounded-[8px] border text-left transition-colors cursor-pointer flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#43D9E9] ${
                      isSelected
                        ? 'bg-[#172438] border-[#43D9E9] text-[#F4F7FB]'
                        : 'bg-[#080D18]/70 hover:bg-[#172438]/70 border-[#253448] text-[#A0AEC0] hover:text-[#F4F7FB]'
                    }`}
                  >
                    <span className="text-base shrink-0" aria-hidden="true">{preset.emoji}</span>
                    <div className="min-w-0">
                      <div className="font-semibold text-[11px] truncate leading-tight">
                        {preset.labelEn.split('(')[0].trim()}
                      </div>
                      <div className="text-[11px] font-ethiopic text-[#43D9E9] truncate">
                        {preset.labelAm}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Preset Description Card */}
          <div className="p-3 rounded-[10px] bg-[#172438] border border-[#253448] text-[11px] leading-relaxed text-[#A0AEC0]">
            <strong className="text-[#43D9E9] block mb-0.5 font-semibold">
              {activePreset.labelEn} · <span className="font-ethiopic">{activePreset.labelAm}</span> [{activePreset.phoneticAm}]
            </strong>
            {activePreset.description}
          </div>

          {/* Dynamic Movement Player */}
          {activePreset.isDynamic && (
            <div className="p-2.5 rounded-[10px] bg-[#080D18]/80 border border-[#253448] flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={onToggleMotion}
                className={`h-8 px-3 rounded-[8px] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#43D9E9] ${
                  isMotionPlaying
                    ? 'bg-[#43D9E9] text-[#080D18]'
                    : 'bg-[#172438] text-[#F4F7FB] hover:bg-[#1e2f4a]'
                }`}
              >
                {isMotionPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isMotionPlaying ? 'Pause Motion' : 'Play Motion'}</span>
              </button>

              {/* Speed Controls */}
              <div className="flex items-center gap-1 text-[11px]">
                {[0.5, 1, 1.5].map((spd) => (
                  <button
                    key={spd}
                    type="button"
                    onClick={() => onChangeSpeed(spd)}
                    className={`px-2 py-1 rounded-[6px] font-mono cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#43D9E9] ${
                      motionSpeed === spd
                        ? 'bg-[#43D9E9] text-[#080D18] font-bold'
                        : 'bg-[#172438] text-[#A0AEC0] hover:text-[#F4F7FB]'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Target Arm Selector */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#A0AEC0]">
              Joint Adjuster Target
            </span>
            <div className="grid grid-cols-3 gap-1 p-1 rounded-[10px] bg-[#080D18] border border-[#253448] text-[11px]">
              {(['both', 'right', 'left'] as const).map((tgt) => (
                <button
                  key={tgt}
                  type="button"
                  onClick={() => onSelectArmTarget(tgt)}
                  className={`py-1.5 rounded-[7px] font-semibold transition-colors cursor-pointer capitalize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#43D9E9] ${
                    selectedArmTarget === tgt
                      ? 'bg-[#43D9E9] text-[#080D18]'
                      : 'text-[#A0AEC0] hover:text-[#F4F7FB]'
                  }`}
                >
                  {tgt === 'both' ? 'Both Arms' : `${tgt} Arm`}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Joint Sliders */}
          <div className="space-y-2.5 pt-2 border-t border-[#253448]">
            <div className="flex items-center justify-between text-xs font-semibold text-[#F4F7FB]">
              <span>Fine-Tune Joint Angles</span>
              <button
                type="button"
                onClick={onResetJoints}
                className="text-[#43D9E9] hover:text-[#67E8F9] text-[11px] flex items-center gap-1 cursor-pointer rounded px-1.5 py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#43D9E9]"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            </div>

            {[
              { key: 'shoulderPitch' as const, label: 'Shoulder Elevation', min: -0.5, max: 1.6, val: `${Math.round((currentJoints.shoulderPitch * 180) / Math.PI)}°` },
              { key: 'shoulderYaw' as const, label: 'Shoulder Swing', min: -1.0, max: 1.0, val: `${Math.round((currentJoints.shoulderYaw * 180) / Math.PI)}°` },
              { key: 'elbowBend' as const, label: 'Elbow Flexion', min: 0.1, max: 2.5, val: `${Math.round((currentJoints.elbowBend * 180) / Math.PI)}°` },
              { key: 'elbowTwist' as const, label: 'Forearm Twist', min: -1.5, max: 1.5, val: `${Math.round((currentJoints.elbowTwist * 180) / Math.PI)}°` },
              { key: 'wristPitch' as const, label: 'Wrist Flexion / Tilt', min: -0.8, max: 0.8, val: `${Math.round((currentJoints.wristPitch * 180) / Math.PI)}°` },
              { key: 'fingerCurl' as const, label: 'Finger Curl (Fist / Open)', min: 0.0, max: 1.5, val: `${Math.round((currentJoints.fingerCurl / 1.5) * 100)}%` },
              { key: 'fingerSpread' as const, label: 'Finger Spread', min: -0.3, max: 0.5, val: `${Math.round(currentJoints.fingerSpread * 100)}%` },
            ].map((item) => (
              <div key={item.key} className="space-y-1">
                <div className="flex items-center justify-between text-[11px] text-[#A0AEC0]">
                  <span>{item.label}</span>
                  <span className="font-mono tabular-nums text-[#43D9E9]">{item.val}</span>
                </div>
                <input
                  type="range"
                  aria-label={item.label}
                  min={item.min}
                  max={item.max}
                  step="0.02"
                  value={currentJoints[item.key]}
                  onChange={(e) => handleSliderChange(item.key, parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-[#080D18] rounded-lg appearance-none cursor-pointer accent-[#43D9E9]"
                />
              </div>
            ))}

            {/* 3D Head & MediaPipe Face Detection Controls */}
            <div className="pt-2.5 border-t border-[#253448] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#F4F7FB] flex items-center gap-1.5">
                  <Smile className="w-3.5 h-3.5 text-[#43D9E9]" aria-hidden="true" />
                  <span>MediaPipe Face &amp; Head Rig</span>
                </span>
                {onToggleFaceTracking && (
                  <button
                    type="button"
                    onClick={onToggleFaceTracking}
                    className={`px-2 py-0.5 rounded-[6px] text-[11px] font-semibold transition-colors cursor-pointer border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#43D9E9] ${
                      isFaceTrackingActive
                        ? 'bg-[#43D9E9]/15 text-[#43D9E9] border-[#43D9E9]/40'
                        : 'bg-[#172438] text-[#A0AEC0] border-[#253448] hover:text-[#F4F7FB]'
                    }`}
                  >
                    {isFaceTrackingActive ? 'Tracking: ON' : 'Manual'}
                  </button>
                )}
              </div>

              {detectedFace ? (
                <div className="p-2.5 rounded-[10px] bg-[#172438] border border-[#43D9E9]/30 text-[11px] space-y-1.5">
                  <div className="flex items-center justify-between text-[#43D9E9]">
                    <span className="font-semibold">Live Face Tracking Active</span>
                    <span className="font-mono tabular-nums">{Math.round(detectedFace.score * 100)}% conf</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 font-mono tabular-nums text-[#A0AEC0] text-center text-[11px]">
                    <div className="bg-[#080D18] p-1 rounded">
                      Yaw <span className="text-[#43D9E9]">{detectedFace.orientation.yawDeg}°</span>
                    </div>
                    <div className="bg-[#080D18] p-1 rounded">
                      Pitch <span className="text-[#43D9E9]">{detectedFace.orientation.pitchDeg}°</span>
                    </div>
                    <div className="bg-[#080D18] p-1 rounded">
                      Roll <span className="text-[#43D9E9]">{detectedFace.orientation.rollDeg}°</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-[#A0AEC0]">
                  Face Detection standby — start camera to mirror live head orientation or adjust manually:
                </p>
              )}

              {[
                { key: 'pitch' as const, label: 'Head Pitch (Nod)', min: -0.7, max: 0.7, value: headJoints.pitch },
                { key: 'yaw' as const, label: 'Head Yaw (Turn)', min: -1.1, max: 1.1, value: headJoints.yaw },
                { key: 'roll' as const, label: 'Head Roll (Tilt)', min: -0.6, max: 0.6, value: headJoints.roll },
              ].map((headItem) => (
                <div key={headItem.key} className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-[#A0AEC0]">
                    <span>{headItem.label}</span>
                    <span className="font-mono tabular-nums text-[#43D9E9]">
                      {Math.round((headItem.value * 180) / Math.PI)}°
                    </span>
                  </div>
                  <input
                    type="range"
                    aria-label={headItem.label}
                    min={headItem.min}
                    max={headItem.max}
                    step="0.02"
                    value={headItem.value}
                    onChange={(e) => onUpdateHead?.({ [headItem.key]: parseFloat(e.target.value) })}
                    className="w-full h-1.5 bg-[#080D18] rounded-lg appearance-none cursor-pointer accent-[#43D9E9]"
                  />
                </div>
              ))}

              <div className="grid grid-cols-3 gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => onUpdateHead?.({ pitch: 0, yaw: 0, roll: 0 })}
                  className="h-8 px-2 rounded-[8px] bg-[#172438] hover:bg-[#1e2f4a] text-[11px] text-[#F4F7FB] transition-colors cursor-pointer border border-[#253448] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#43D9E9]"
                >
                  Center
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateHead?.({ pitch: 0.22, yaw: 0, roll: 0 })}
                  className="h-8 px-2 rounded-[8px] bg-[#172438] hover:bg-[#1e2f4a] text-[11px] text-[#F4F7FB] transition-colors cursor-pointer border border-[#253448] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#43D9E9]"
                >
                  Nod (+12°)
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateHead?.({ pitch: -0.22, yaw: 0.15, roll: 0 })}
                  className="h-8 px-2 rounded-[8px] bg-[#172438] hover:bg-[#1e2f4a] text-[11px] text-[#F4F7FB] transition-colors cursor-pointer border border-[#253448] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#43D9E9]"
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
