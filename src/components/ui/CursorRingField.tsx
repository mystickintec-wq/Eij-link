import React, { useEffect, useRef } from 'react';

export interface CursorRingFieldProps {
  /** Disables rendering and animation completely (for reduced motion or user settings). */
  disabled?: boolean;
  /** Spacing in CSS pixels between capsule nodes in the lattice. */
  spacing?: number;
  /** Radius in CSS pixels of the primary cursor displacement ring. */
  ringRadius?: number;
  /** Thickness in CSS pixels of the ring wave falloff. */
  ringWidth?: number;
  /** Maximum radial displacement of capsules near the ring crest. */
  pushIntensity?: number;
  className?: string;
}

interface RippleWave {
  x: number;
  y: number;
  startTime: number;
  duration: number;
  maxRadius: number;
}

const INTERACTIVE_SELECTOR =
  'a, button, input, select, textarea, summary, [role="button"], [role="tab"], [role="switch"], [tabindex]:not([tabindex="-1"])';

export const CursorRingField: React.FC<CursorRingFieldProps> = ({
  disabled = false,
  spacing = 36,
  ringRadius = 112,
  ringWidth = 58,
  pushIntensity = 12,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (disabled || typeof window === 'undefined') return;

    const coarseQuery = window.matchMedia('(pointer: coarse)');
    const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (coarseQuery.matches || reducedQuery.matches) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const configureSize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    configureSize();

    let isDark = document.documentElement.classList.contains('dark');
    const themeObserver = new MutationObserver(() => {
      isDark = document.documentElement.classList.contains('dark');
      wake();
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    const pointer = {
      x: width * 0.5,
      y: height * 0.35,
      targetX: width * 0.5,
      targetY: height * 0.35,
      active: false,
      energy: 0,
      targetEnergy: 0,
      radiusScale: 1,
      targetRadiusScale: 1,
    };

    const ripples: RippleWave[] = [];
    let rafId: number | null = null;
    let lastDrawTime = performance.now();

    const drawFrame = () => {
      rafId = null;
      if (document.hidden) return;

      const clockNow = performance.now();
      const dt = Math.min(0.05, Math.max(0.001, (clockNow - lastDrawTime) / 1000));
      lastDrawTime = clockNow;

      const lerpFactor = 1 - Math.exp(-14 * dt);
      pointer.x += (pointer.targetX - pointer.x) * lerpFactor;
      pointer.y += (pointer.targetY - pointer.y) * lerpFactor;
      pointer.energy += (pointer.targetEnergy - pointer.energy) * (1 - Math.exp(-9 * dt));
      pointer.radiusScale +=
        (pointer.targetRadiusScale - pointer.radiusScale) * (1 - Math.exp(-10 * dt));

      // Prune finished ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        if (clockNow - ripples[i].startTime >= ripples[i].duration) {
          ripples.splice(i, 1);
        }
      }

      ctx.clearRect(0, 0, width, height);

      const step = width < 768 ? Math.max(42, spacing + 6) : spacing;
      const offsetX = ((width % step) + step) * 0.5;
      const offsetY = ((height % step) + step) * 0.5;
      const currentRingRadius = Math.max(1, ringRadius * pointer.radiusScale);
      const maxInfluenceDist = currentRingRadius + ringWidth * 1.45;

      // Ambient base lattice capsule opacity stays restrained for 4.5:1+ card legibility
      const baseFill = isDark
        ? 'rgba(148, 163, 184, 0.09)'
        : 'rgba(14, 116, 144, 0.13)';

      // Subtle trailing ring aura directly under pointer
      if (pointer.energy > 0.02) {
        const innerAuraR = Math.max(1, currentRingRadius * 0.25);
        const outerAuraR = Math.max(innerAuraR + 1, currentRingRadius * 1.35);
        const aura = ctx.createRadialGradient(
          pointer.x,
          pointer.y,
          innerAuraR,
          pointer.x,
          pointer.y,
          outerAuraR
        );
        if (isDark) {
          aura.addColorStop(0, `rgba(67, 217, 233, ${0.02 * pointer.energy})`);
          aura.addColorStop(0.62, `rgba(67, 217, 233, ${0.075 * pointer.energy})`);
          aura.addColorStop(0.85, `rgba(133, 133, 255, ${0.045 * pointer.energy})`);
          aura.addColorStop(1, 'rgba(67, 217, 233, 0)');
        } else {
          aura.addColorStop(0, `rgba(6, 182, 212, ${0.03 * pointer.energy})`);
          aura.addColorStop(0.58, `rgba(8, 145, 178, ${0.095 * pointer.energy})`);
          aura.addColorStop(0.84, `rgba(79, 70, 229, ${0.065 * pointer.energy})`);
          aura.addColorStop(1, 'rgba(16, 185, 129, 0)');
        }
        ctx.fillStyle = aura;
        ctx.beginPath();
        ctx.arc(pointer.x, pointer.y, outerAuraR, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw expanding click ripples (subtle halo ring)
      for (let rIdx = 0; rIdx < ripples.length; rIdx++) {
        const rp = ripples[rIdx];
        const progress = Math.min(1, Math.max(0, (clockNow - rp.startTime) / rp.duration));
        const eased = 1 - Math.pow(1 - progress, 3);
        const rad = Math.max(1, 18 + rp.maxRadius * eased);
        const alpha = (1 - progress) * (isDark ? 0.22 : 0.28);
        ctx.strokeStyle = isDark
          ? `rgba(67, 217, 233, ${alpha})`
          : `rgba(8, 145, 178, ${alpha})`;
        ctx.lineWidth = isDark ? 1.5 : 1.75;
        ctx.beginPath();
        ctx.arc(rp.x, rp.y, rad, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Render responsive capsule grid
      for (let gx = offsetX; gx < width; gx += step) {
        for (let gy = offsetY; gy < height; gy += step) {
          let totalInfluence = 0;
          let pushX = 0;
          let pushY = 0;
          let angle = Math.PI * 0.25;

          if (pointer.energy > 0.01) {
            const dx = gx - pointer.x;
            const dy = gy - pointer.y;
            if (Math.abs(dx) <= maxInfluenceDist && Math.abs(dy) <= maxInfluenceDist) {
              const dist = Math.hypot(dx, dy);
              const delta = Math.abs(dist - currentRingRadius);
              if (delta < ringWidth && dist > 0.001) {
                const wave = Math.cos((delta / ringWidth) * Math.PI * 0.5);
                const strength = wave * wave * pointer.energy;
                totalInfluence += strength;
                const nx = dx / dist;
                const ny = dy / dist;
                pushX += nx * pushIntensity * strength;
                pushY += ny * pushIntensity * strength;
                angle = Math.atan2(dy, dx) + Math.PI * 0.5;
              }
            }
          }

          for (let rIdx = 0; rIdx < ripples.length; rIdx++) {
            const rp = ripples[rIdx];
            const progress = Math.min(1, Math.max(0, (clockNow - rp.startTime) / rp.duration));
            const eased = 1 - Math.pow(1 - progress, 3);
            const rRadius = Math.max(1, 18 + rp.maxRadius * eased);
            const dx = gx - rp.x;
            const dy = gy - rp.y;
            const dist = Math.hypot(dx, dy);
            const band = 56;
            const delta = Math.abs(dist - rRadius);
            if (delta < band && dist > 0.001) {
              const wave = Math.cos((delta / band) * Math.PI * 0.5) * (1 - progress);
              const strength = wave * wave * 0.95;
              totalInfluence = Math.min(1.25, totalInfluence + strength);
              pushX += (dx / dist) * (pushIntensity * 0.85) * strength;
              pushY += (dy / dist) * (pushIntensity * 0.85) * strength;
              angle = Math.atan2(dy, dx) + Math.PI * 0.5;
            }
          }

          if (totalInfluence <= 0.015) {
            // Crisp minimal dot when untouched
            ctx.fillStyle = baseFill;
            ctx.beginPath();
            ctx.arc(gx, gy, 1.35, 0, Math.PI * 2);
            ctx.fill();
          } else {
            const clamped = Math.min(1, totalInfluence);
            const rx = gx + pushX;
            const ry = gy + pushY;
            const capLen = 3.2 + clamped * 8.5;
            const capRad = Math.max(0.5, 1.3 + clamped * 0.95);

            ctx.save();
            ctx.translate(rx, ry);
            ctx.rotate(angle);

            // Blend cyan, indigo, and emerald subtly across screen coordinates
            const hueMix = ((gx + gy) * 0.002 + clockNow * 0.0004) % 1;
            const blend = 0.5 + 0.5 * Math.sin(hueMix * Math.PI * 2);
            if (isDark) {
              const r = Math.round(67 + (133 - 67) * blend * 0.65);
              const g = Math.round(217 + (133 - 217) * blend * 0.65);
              const b = Math.round(233 + (255 - 233) * blend * 0.65);
              ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.14 + clamped * 0.56})`;
            } else {
              const r = Math.round(8 + (79 - 8) * blend * 0.72);
              const g = Math.round(145 + (70 - 145) * blend * 0.55);
              const b = Math.round(178 + (229 - 178) * blend * 0.72);
              ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.18 + clamped * 0.56})`;
            }

            const half = capLen * 0.5;
            ctx.beginPath();
            ctx.roundRect(-half, -capRad, capLen, capRad * 2, capRad);
            ctx.fill();
            ctx.restore();
          }
        }
      }

      const settled =
        !pointer.active &&
        pointer.energy < 0.01 &&
        ripples.length === 0;
      const pointerStillSettling =
        Math.abs(pointer.targetX - pointer.x) > 0.35 ||
        Math.abs(pointer.targetY - pointer.y) > 0.35 ||
        Math.abs(pointer.targetEnergy - pointer.energy) > 0.01 ||
        Math.abs(pointer.targetRadiusScale - pointer.radiusScale) > 0.01;

      if (!settled || pointerStillSettling || ripples.length > 0) {
        rafId = window.requestAnimationFrame(drawFrame);
      }
    };

    const wake = () => {
      if (rafId === null && !document.hidden) {
        lastDrawTime = performance.now();
        rafId = window.requestAnimationFrame(drawFrame);
      }
    };

    // Paint an initial idle frame cleanly
    wake();

    const handlePointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      pointer.targetX = e.clientX;
      pointer.targetY = e.clientY;
      pointer.active = true;
      pointer.targetEnergy = 1;

      const target = e.target as HTMLElement | null;
      const onInteractive = Boolean(target && target.closest(INTERACTIVE_SELECTOR));
      pointer.targetRadiusScale = onInteractive ? 1.24 : 1;
      wake();
    };

    const handlePointerLeave = () => {
      pointer.active = false;
      pointer.targetEnergy = 0;
      pointer.targetRadiusScale = 1;
      wake();
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      pointer.targetX = e.clientX;
      pointer.targetY = e.clientY;
      pointer.active = true;
      pointer.targetEnergy = 1;
      ripples.push({
        x: e.clientX,
        y: e.clientY,
        startTime: performance.now(),
        duration: 620,
        maxRadius: 230,
      });
      if (ripples.length > 4) ripples.shift();
      wake();
    };

    const handleResize = () => {
      configureSize();
      wake();
    };

    const handleVisibility = () => {
      if (!document.hidden) {
        wake();
      } else if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
        rafId = null;
      }
    };

    const handleMediaChange = () => {
      if (coarseQuery.matches || reducedQuery.matches) {
        ctx.clearRect(0, 0, width, height);
        if (rafId !== null) {
          window.cancelAnimationFrame(rafId);
          rafId = null;
        }
      } else {
        wake();
      }
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    document.addEventListener('pointerleave', handlePointerLeave);
    window.addEventListener('blur', handlePointerLeave);
    window.addEventListener('resize', handleResize);
    document.addEventListener('visibilitychange', handleVisibility);
    coarseQuery.addEventListener('change', handleMediaChange);
    reducedQuery.addEventListener('change', handleMediaChange);

    return () => {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      themeObserver.disconnect();
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('pointerleave', handlePointerLeave);
      window.removeEventListener('blur', handlePointerLeave);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibility);
      coarseQuery.removeEventListener('change', handleMediaChange);
      reducedQuery.removeEventListener('change', handleMediaChange);
    };
  }, [disabled, spacing, ringRadius, ringWidth, pushIntensity]);

  if (disabled) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 z-[1] ${className}`}
    />
  );
};
