import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface ScrollAtmosphere3DProps {
  disabled?: boolean;
}

function createSoftRadialTexture(): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
  gradient.addColorStop(0.32, 'rgba(255, 255, 255, 0.42)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export const ScrollAtmosphere3D: React.FC<ScrollAtmosphere3DProps> = ({ disabled = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (disabled) return;
    const container = containerRef.current;
    if (!container) return;

    const motionQuery =
      typeof window !== 'undefined' && window.matchMedia
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : null;
    let isReducedMotion = Boolean(motionQuery?.matches);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      55,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 95;

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'low-power',
      });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      container.appendChild(renderer.domElement);
    } catch {
      return;
    }

    // Dual-depth soft circular particle field inspired by Casberry Particles, restrained for readability
    const particleCount = 72;
    const geometry = new THREE.BufferGeometry();
    const basePositions = new Float32Array(particleCount * 3);
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const primaryCyan = new THREE.Color('#43D9E9');
    const secondaryIndigo = new THREE.Color('#8585FF');
    const lightCyan = new THREE.Color('#0891B2');
    const lightIndigo = new THREE.Color('#4F46E5');
    const lightEmerald = new THREE.Color('#059669');

    const applyThemePalette = (darkActive: boolean) => {
      const colorAttr = geometry.getAttribute('color') as THREE.BufferAttribute | undefined;
      for (let i = 0; i < particleCount; i++) {
        const chosen = darkActive
          ? i % 3 === 0
            ? secondaryIndigo
            : primaryCyan
          : i % 3 === 0
          ? lightIndigo
          : i % 3 === 1
          ? lightCyan
          : lightEmerald;
        colors[i * 3] = chosen.r;
        colors[i * 3 + 1] = chosen.g;
        colors[i * 3 + 2] = chosen.b;
      }
      if (colorAttr) {
        colorAttr.needsUpdate = true;
      }
    };

    let isDarkTheme = document.documentElement.classList.contains('dark');
    applyThemePalette(isDarkTheme);

    for (let i = 0; i < particleCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = Math.cbrt(Math.random()) * 76 + 24;

      const sinPhi = Math.sin(phi);
      const x = r * sinPhi * Math.cos(theta);
      const y = r * sinPhi * Math.sin(theta);
      const z = r * Math.cos(phi);

      basePositions[i * 3] = x;
      basePositions[i * 3 + 1] = y;
      basePositions[i * 3 + 2] = z;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const spriteTexture = createSoftRadialTexture();
    const particleMaterial = new THREE.PointsMaterial({
      size: isDarkTheme ? 2.9 : 3.2,
      map: spriteTexture || undefined,
      vertexColors: true,
      transparent: true,
      opacity: isDarkTheme ? 0.3 : 0.36,
      depthWrite: false,
      blending: isDarkTheme ? THREE.AdditiveBlending : THREE.NormalBlending,
    });

    const themeObserver = new MutationObserver(() => {
      const nextDark = document.documentElement.classList.contains('dark');
      if (nextDark !== isDarkTheme) {
        isDarkTheme = nextDark;
        applyThemePalette(nextDark);
        particleMaterial.size = nextDark ? 2.9 : 3.2;
        particleMaterial.opacity = nextDark ? 0.3 : 0.36;
        particleMaterial.blending = nextDark ? THREE.AdditiveBlending : THREE.NormalBlending;
        particleMaterial.needsUpdate = true;
        if (isReducedMotion) {
          renderer?.render(scene, camera);
        }
      }
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    const pointCloud = new THREE.Points(geometry, particleMaterial);
    scene.add(pointCloud);

    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;
    let scrollY = 0;
    let targetScrollY = 0;

    const onMouseMove = (e: MouseEvent) => {
      targetMouseX = (e.clientX / window.innerWidth - 0.5) * 2.0;
      targetMouseY = -(e.clientY / window.innerHeight - 0.5) * 2.0;
    };

    const onScroll = () => {
      targetScrollY = window.scrollY * 0.018;
    };

    const onResize = () => {
      if (!renderer) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);

    let animationFrameId = 0;
    const clock = new THREE.Clock();

    const renderFrame = () => {
      const time = clock.getElapsedTime();
      mouseX += (targetMouseX - mouseX) * 0.04;
      mouseY += (targetMouseY - mouseY) * 0.04;
      scrollY += (targetScrollY - scrollY) * 0.06;

      pointCloud.rotation.y = time * 0.016 + mouseX * 0.06;
      pointCloud.rotation.x = mouseY * 0.045 + Math.sin(time * 0.06) * 0.02;
      pointCloud.position.y = -scrollY * 0.22;

      renderer?.render(scene, camera);
    };

    const handleMotionChange = (e: MediaQueryListEvent) => {
      isReducedMotion = e.matches;
      if (isReducedMotion && animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = 0;
        renderFrame();
      } else if (!isReducedMotion && !animationFrameId) {
        const animate = () => {
          animationFrameId = requestAnimationFrame(animate);
          renderFrame();
        };
        animate();
      }
    };

    motionQuery?.addEventListener('change', handleMotionChange);

    if (isReducedMotion) {
      renderFrame();
    } else {
      const animate = () => {
        animationFrameId = requestAnimationFrame(animate);
        renderFrame();
      };
      animate();
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      themeObserver.disconnect();
      motionQuery?.removeEventListener('change', handleMotionChange);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);

      if (renderer && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
        renderer.dispose();
      }
      geometry.dispose();
      particleMaterial.dispose();
      spriteTexture?.dispose();
    };
  }, [disabled]);

  if (disabled) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-38 dark:opacity-45 transition-opacity duration-500"
      aria-hidden="true"
    />
  );
};
