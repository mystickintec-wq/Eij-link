import React from 'react';
import { GestureKey } from '../types';

interface HandPoseDiagramProps {
  gestureKey: GestureKey;
  variant?: 'stage' | 'compact';
  className?: string;
}

type Point2D = [number, number];

interface HandRigPose {
  // 21 MediaPipe-style 2D landmarks in a 160x160 coordinate space:
  // 0: wrist
  // 1-4: thumb (CMC, MCP, IP, TIP)
  // 5-8: index (MCP, PIP, DIP, TIP)
  // 9-12: middle (MCP, PIP, DIP, TIP)
  // 13-16: ring (MCP, PIP, DIP, TIP)
  // 17-20: pinky (MCP, PIP, DIP, TIP)
  points: Point2D[];
  activeTips?: number[];
  motionPath?: string;
  motionArrow?: Point2D;
  viewLabel?: string;
}

// Anatomical base palm anchors (centered in 160x160)
const BASE_WRIST: Point2D = [80, 134];
const BASE_CMC: Point2D = [60, 118];
const BASE_I_MCP: Point2D = [56, 86];
const BASE_M_MCP: Point2D = [74, 82];
const BASE_R_MCP: Point2D = [92, 85];
const BASE_P_MCP: Point2D = [108, 92];

function buildStandardPose(
  thumb: [Point2D, Point2D, Point2D],
  index: [Point2D, Point2D, Point2D],
  middle: [Point2D, Point2D, Point2D],
  ring: [Point2D, Point2D, Point2D],
  pinky: [Point2D, Point2D, Point2D],
  options: {
    wrist?: Point2D;
    cmc?: Point2D;
    palm?: [Point2D, Point2D, Point2D, Point2D];
    activeTips?: number[];
    motionPath?: string;
    motionArrow?: Point2D;
    viewLabel?: string;
  } = {}
): HandRigPose {
  const wrist = options.wrist ?? BASE_WRIST;
  const cmc = options.cmc ?? BASE_CMC;
  const [iMcp, mMcp, rMcp, pMcp] = options.palm ?? [
    BASE_I_MCP,
    BASE_M_MCP,
    BASE_R_MCP,
    BASE_P_MCP,
  ];

  return {
    points: [
      wrist,
      cmc,
      ...thumb,
      iMcp,
      ...index,
      mMcp,
      ...middle,
      rMcp,
      ...ring,
      pMcp,
      ...pinky,
    ],
    activeTips: options.activeTips,
    motionPath: options.motionPath,
    motionArrow: options.motionArrow,
    viewLabel: options.viewLabel,
  };
}

const HAND_RIG_POSES: Record<GestureKey, HandRigPose> = {
  // Open 5-hand spread facing outward
  hello: buildStandardPose(
    [[45, 102], [35, 86], [28, 70]],
    [[50, 62], [47, 43], [44, 26]],
    [[74, 54], [74, 34], [74, 17]],
    [[97, 59], [100, 40], [103, 24]],
    [[118, 72], [125, 56], [131, 41]],
    {
      activeTips: [4, 8, 12, 16, 20],
      motionPath: 'M 122 28 Q 138 38 140 56',
      motionArrow: [140, 56],
      viewLabel: 'Open 5 · Shoulder',
    }
  ),

  // Flat closed-finger polite palm (chin outward)
  thank_you: buildStandardPose(
    [[49, 100], [45, 84], [46, 68]],
    [[57, 63], [59, 44], [61, 27]],
    [[75, 58], [76, 38], [77, 20]],
    [[92, 61], [93, 43], [94, 26]],
    [[107, 70], [108, 55], [109, 40]],
    {
      activeTips: [8, 12, 16, 20],
      motionPath: 'M 42 42 Q 34 62 42 82',
      motionArrow: [42, 82],
      viewLabel: 'Flat · Chin Arc',
    }
  ),

  // EthSL "W": index, middle, ring upright; thumb & pinky curled inward
  water: buildStandardPose(
    [[55, 104], [67, 97], [79, 98]],
    [[51, 63], [47, 45], [44, 28]],
    [[74, 55], [74, 36], [74, 19]],
    [[96, 61], [100, 44], [103, 28]],
    [[106, 101], [99, 109], [92, 111]],
    {
      activeTips: [8, 12, 16],
      motionPath: 'M 124 38 L 124 58',
      motionArrow: [124, 58],
      viewLabel: 'W-Shape · Chin',
    }
  ),

  // Closed supportive fist ("A"/"S" handshape)
  help: buildStandardPose(
    [[55, 100], [68, 92], [82, 92]],
    [[57, 94], [60, 106], [62, 113]],
    [[74, 92], [75, 105], [75, 113]],
    [[91, 94], [90, 106], [89, 114]],
    [[106, 98], [103, 109], [100, 115]],
    {
      activeTips: [4, 8, 12],
      motionPath: 'M 130 96 L 130 62',
      motionArrow: [130, 62],
      viewLabel: 'Fist · Upright',
    }
  ),

  // Flat hand together (chest circular motion)
  please: buildStandardPose(
    [[48, 101], [48, 86], [51, 72]],
    [[58, 63], [60, 45], [62, 28]],
    [[74, 58], [75, 39], [76, 22]],
    [[90, 61], [91, 44], [91, 28]],
    [[104, 70], [104, 56], [104, 42]],
    {
      activeTips: [4, 8, 12, 16, 20],
      motionPath: 'M 125 60 A 14 14 0 1 1 114 78',
      motionArrow: [114, 78],
      viewLabel: 'Flat · Chest',
    }
  ),

  // Thumbs Up
  yes: buildStandardPose(
    [[53, 86], [49, 63], [48, 40]],
    [[64, 92], [74, 98], [70, 108]],
    [[78, 90], [88, 98], [82, 109]],
    [[93, 93], [100, 101], [93, 111]],
    [[106, 98], [108, 106], [102, 114]],
    {
      wrist: [84, 134],
      cmc: [62, 114],
      palm: [
        [62, 88],
        [78, 86],
        [93, 89],
        [106, 95],
      ],
      activeTips: [4],
      motionPath: 'M 33 52 Q 28 38 38 28',
      motionArrow: [38, 28],
      viewLabel: 'Thumb Up · Nod',
    }
  ),

  // Thumbs Down
  no: buildStandardPose(
    [[52, 82], [46, 106], [44, 128]],
    [[65, 68], [76, 62], [70, 52]],
    [[79, 71], [89, 65], [82, 54]],
    [[93, 75], [101, 69], [93, 58]],
    [[106, 80], [109, 73], [101, 64]],
    {
      wrist: [84, 34],
      cmc: [63, 54],
      palm: [
        [63, 74],
        [79, 76],
        [93, 73],
        [106, 68],
      ],
      activeTips: [4],
      motionPath: 'M 28 112 L 56 112',
      motionArrow: [56, 112],
      viewLabel: 'Thumb Down',
    }
  ),

  // Peace / Victory V-sign
  peace: buildStandardPose(
    [[54, 103], [67, 96], [80, 96]],
    [[51, 61], [45, 42], [40, 23]],
    [[78, 57], [83, 38], [88, 20]],
    [[93, 95], [91, 107], [88, 113]],
    [[107, 100], [103, 110], [98, 116]],
    {
      activeTips: [8, 12],
      viewLabel: 'V-Shape · Dual',
    }
  ),

  // I Love You (thumb + index + pinky extended)
  love: buildStandardPose(
    [[44, 104], [32, 91], [23, 78]],
    [[54, 62], [53, 42], [52, 24]],
    [[75, 93], [75, 106], [75, 113]],
    [[92, 95], [91, 107], [89, 114]],
    [[116, 72], [123, 55], [129, 39]],
    {
      activeTips: [4, 8, 20],
      viewLabel: 'ILY · Triad',
    }
  ),

  // Okay / O circle pinch + 3 extended outer fingers
  ok: buildStandardPose(
    [[48, 98], [52, 79], [60, 68]],
    [[51, 69], [57, 62], [62, 68]],
    [[78, 56], [81, 37], [84, 20]],
    [[97, 61], [102, 43], [106, 26]],
    [[116, 73], [123, 57], [129, 42]],
    {
      activeTips: [4, 8, 12, 16, 20],
      viewLabel: 'O-Pinch · Open',
    }
  ),

  // Call / Phone (thumb + pinky extended)
  call: buildStandardPose(
    [[44, 100], [33, 84], [26, 68]],
    [[58, 94], [61, 106], [62, 113]],
    [[74, 92], [75, 105], [75, 113]],
    [[91, 94], [90, 106], [89, 114]],
    [[118, 86], [129, 78], [139, 70]],
    {
      activeTips: [4, 20],
      motionPath: 'M 25 56 Q 18 68 25 80',
      motionArrow: [25, 80],
      viewLabel: 'Thumb + Pinky',
    }
  ),

  // Stop / Wait upright hand
  stop: buildStandardPose(
    [[47, 101], [43, 84], [43, 66]],
    [[57, 61], [58, 41], [59, 22]],
    [[74, 55], [74, 34], [74, 16]],
    [[91, 59], [92, 39], [92, 22]],
    [[108, 69], [110, 52], [111, 37]],
    {
      activeTips: [4, 8, 12, 16, 20],
      viewLabel: 'Flat · Hold',
    }
  ),
};

// MediaPipe 21-point skeletal bone connections
const HAND_CONNECTIONS: [number, number][] = [
  // Palm structure
  [0, 1],
  [0, 5],
  [0, 17],
  [5, 9],
  [9, 13],
  [13, 17],
  // Thumb
  [1, 2],
  [2, 3],
  [3, 4],
  // Index
  [5, 6],
  [6, 7],
  [7, 8],
  // Middle
  [9, 10],
  [10, 11],
  [11, 12],
  // Ring
  [13, 14],
  [14, 15],
  [15, 16],
  // Pinky
  [17, 18],
  [18, 19],
  [19, 20],
];

export const HandPoseDiagram: React.FC<HandPoseDiagramProps> = ({
  gestureKey,
  variant = 'stage',
  className = '',
}) => {
  const rig = HAND_RIG_POSES[gestureKey] || HAND_RIG_POSES.hello;
  const pts = rig.points;
  const activeTipSet = new Set(rig.activeTips ?? [4, 8, 12, 16, 20]);

  // Palm contour polygon path for anatomical silhouette
  const palmContour = [pts[0], pts[1], pts[2], pts[5], pts[9], pts[13], pts[17]]
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`)
    .join(' ') + ' Z';

  if (variant === 'compact') {
    return (
      <svg
        viewBox="0 0 160 160"
        className={`w-8 h-8 shrink-0 ${className}`}
        aria-hidden="true"
      >
        {/* Subtle palm silhouette */}
        <path
          d={palmContour}
          className="fill-[#0E7490]/12 dark:fill-[#43D9E9]/14 stroke-[#0E7490]/35 dark:stroke-[#43D9E9]/40"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {/* Skeletal bones */}
        {HAND_CONNECTIONS.map(([a, b], idx) => (
          <line
            key={idx}
            x1={pts[a][0]}
            y1={pts[a][1]}
            x2={pts[b][0]}
            y2={pts[b][1]}
            className="stroke-[#0E7490] dark:stroke-[#43D9E9]"
            strokeWidth="4.2"
            strokeLinecap="round"
          />
        ))}
        {/* Highlighted key joints */}
        {pts.map(([x, y], idx) => {
          const isTip = idx === 4 || idx === 8 || idx === 12 || idx === 16 || idx === 20;
          if (!isTip && idx !== 0) return null;
          const isActiveTip = activeTipSet.has(idx);
          return (
            <circle
              key={idx}
              cx={x}
              cy={y}
              r={isActiveTip ? 5.2 : 3.6}
              className={
                isActiveTip
                  ? 'fill-[#4F46E5] dark:fill-[#F4F7FB] stroke-[#0E7490] dark:stroke-[#43D9E9]'
                  : 'fill-[#0E7490]/60 dark:fill-[#43D9E9]/60'
              }
              strokeWidth={isActiveTip ? 2.2 : 0}
            />
          );
        })}
      </svg>
    );
  }

  return (
    <div
      className={`relative w-full aspect-[4/3] max-h-[196px] pt-2 pb-7 px-3 rounded-[12px] overflow-hidden border border-slate-200 dark:border-[#253448] bg-slate-50 dark:bg-[#080D18] flex items-center justify-center ${className}`}
    >
      {/* Subtle architectural coordinate backdrop */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(8,145,178,0.12),transparent_68%)] dark:bg-[radial-gradient(circle_at_50%_42%,rgba(67,217,233,0.14),transparent_68%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.35] dark:opacity-[0.22] bg-[linear-gradient(to_right,rgba(148,163,184,0.15)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.15)_1px,transparent_1px)] bg-[size:24px_24px]"
      />

      {/* Optical tracking registration corners */}
      <span aria-hidden="true" className="absolute top-2.5 left-2.5 w-2.5 h-2.5 border-t border-l border-[#0E7490]/60 dark:border-[#43D9E9]/60" />
      <span aria-hidden="true" className="absolute top-2.5 right-2.5 w-2.5 h-2.5 border-t border-r border-[#0E7490]/60 dark:border-[#43D9E9]/60" />
      <span aria-hidden="true" className="absolute bottom-7 left-2.5 w-2.5 h-2.5 border-b border-l border-[#0E7490]/45 dark:border-[#43D9E9]/45" />
      <span aria-hidden="true" className="absolute bottom-7 right-2.5 w-2.5 h-2.5 border-b border-r border-[#0E7490]/45 dark:border-[#43D9E9]/45" />

      {/* Anatomical 21-Landmark Hand Rig SVG */}
      <svg
        viewBox="0 0 160 160"
        className="relative z-10 w-32 h-32 sm:w-36 sm:h-36 select-none"
        role="img"
        aria-label={`21-point anatomical hand rig diagram for ${gestureKey.replace('_', ' ')}`}
      >
        <defs>
          <filter id="ejji-node-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="2.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Soft wrist anchor ring */}
        <circle
          cx={pts[0][0]}
          cy={pts[0][1]}
          r="9"
          className="fill-none stroke-[#4F46E5]/35 dark:stroke-[#8585FF]/40"
          strokeWidth="1.2"
          strokeDasharray="3 3"
        />

        {/* Palm anatomical contour */}
        <path
          d={palmContour}
          className="fill-[#0E7490]/10 dark:fill-[#43D9E9]/10 stroke-[#4F46E5]/45 dark:stroke-[#8585FF]/45 transition-all duration-200 ease-out motion-reduce:transition-none"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />

        {/* EthSL Directional Motion Cue */}
        {rig.motionPath && (
          <path
            d={rig.motionPath}
            fill="none"
            className="stroke-[#4F46E5] dark:stroke-[#8585FF]"
            strokeWidth="1.7"
            strokeDasharray="3.5 3"
            strokeLinecap="round"
          />
        )}
        {rig.motionArrow && (
          <circle
            cx={rig.motionArrow[0]}
            cy={rig.motionArrow[1]}
            r="2.6"
            className="fill-[#4F46E5] dark:fill-[#8585FF]"
          />
        )}

        {/* Skeletal bone segments */}
        {HAND_CONNECTIONS.map(([a, b], idx) => {
          const isPalmStrut = idx < 6;
          return (
            <line
              key={idx}
              x1={pts[a][0]}
              y1={pts[a][1]}
              x2={pts[b][0]}
              y2={pts[b][1]}
              className={
                isPalmStrut
                  ? 'stroke-[#4F46E5]/70 dark:stroke-[#8585FF]/70 transition-all duration-200 ease-out motion-reduce:transition-none'
                  : 'stroke-[#0E7490] dark:stroke-[#43D9E9] transition-all duration-200 ease-out motion-reduce:transition-none'
              }
              strokeWidth={isPalmStrut ? '2.1' : '2.7'}
              strokeLinecap="round"
            />
          );
        })}

        {/* 21 Landmark joint nodes */}
        {pts.map(([x, y], idx) => {
          const isTip = idx === 4 || idx === 8 || idx === 12 || idx === 16 || idx === 20;
          const isWrist = idx === 0;
          const isActiveTip = isTip && activeTipSet.has(idx);

          return (
            <g key={idx} filter={isActiveTip ? 'url(#ejji-node-glow)' : undefined}>
              {isActiveTip && (
                <circle
                  cx={x}
                  cy={y}
                  r="5.6"
                  className="fill-[#0E7490]/18 dark:fill-[#43D9E9]/20 transition-all duration-200 ease-out motion-reduce:transition-none"
                />
              )}
              <circle
                cx={x}
                cy={y}
                r={isActiveTip ? 3.2 : isWrist ? 3.3 : 2.1}
                className={
                  isActiveTip
                    ? 'fill-white dark:fill-[#F4F7FB] stroke-[#0E7490] dark:stroke-[#43D9E9] transition-all duration-200 ease-out motion-reduce:transition-none'
                    : isWrist
                    ? 'fill-[#4F46E5] dark:fill-[#8585FF] stroke-white dark:stroke-[#080D18] transition-all duration-200 ease-out motion-reduce:transition-none'
                    : 'fill-white dark:fill-[#080D18] stroke-[#0E7490] dark:stroke-[#43D9E9] transition-all duration-200 ease-out motion-reduce:transition-none'
                }
                strokeWidth={isActiveTip ? 1.8 : 1.3}
              />
            </g>
          );
        })}
      </svg>

      {/* Subtle Bottom Technical Caption */}
      {rig.viewLabel && (
        <div className="absolute bottom-1.5 left-3 right-3 flex items-center justify-between gap-2 text-[10px] font-mono text-slate-600 dark:text-[#A0AEC0] pointer-events-none">
          <span className="whitespace-nowrap shrink-0">21-PT RIG</span>
          <span className="whitespace-nowrap text-right">{rig.viewLabel}</span>
        </div>
      )}
    </div>
  );
};
