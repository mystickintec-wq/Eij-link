import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export const ScrollAtmosphere3D: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 80;

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(renderer.domElement);
    } catch (e) {
      console.warn('WebGL not supported for background atmosphere', e);
      return;
    }

    // Create 3D particle constellation with Axum & Neural network vibes
    const particleCount = 220;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const amberColor = new THREE.Color('#d97706'); // Ethiopian amber
    const emeraldColor = new THREE.Color('#10b981'); // Ethiopian emerald
    const goldColor = new THREE.Color('#fbbf24'); // Sun gold

    for (let i = 0; i < particleCount; i++) {
      // Distribute in a spherical/ellipsoid cloud
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = Math.cbrt(Math.random()) * 85 + 10;

      const sinPhi = Math.sin(phi);
      positions[i * 3] = r * sinPhi * Math.cos(theta);
      positions[i * 3 + 1] = r * sinPhi * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      // Color distribution: 60% amber/gold, 40% emerald
      const chosenColor = Math.random() > 0.4 ? (Math.random() > 0.5 ? amberColor : goldColor) : emeraldColor;
      colors[i * 3] = chosenColor.r;
      colors[i * 3 + 1] = chosenColor.g;
      colors[i * 3 + 2] = chosenColor.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Particle texture point material
    const particleMaterial = new THREE.PointsMaterial({
      size: 2.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
    });

    const pointCloud = new THREE.Points(geometry, particleMaterial);
    scene.add(pointCloud);

    // Dynamic interconnected lines between nearest neighbors
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0xd97706,
      transparent: true,
      opacity: 0.12,
      blending: THREE.AdditiveBlending,
    });

    const maxLineSegments = 180;
    const linePositions = new Float32Array(maxLineSegments * 6);
    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    const linesMesh = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(linesMesh);

    // Mouse & Scroll Parallax State
    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;
    let scrollY = 0;
    let targetScrollY = 0;

    const onMouseMove = (e: MouseEvent) => {
      targetMouseX = (e.clientX - window.innerWidth / 2) * 0.05;
      targetMouseY = (e.clientY - window.innerHeight / 2) * 0.05;
    };

    const onScroll = () => {
      targetScrollY = window.scrollY * 0.04;
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

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Smooth lerp for mouse and scroll
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;
      scrollY += (targetScrollY - scrollY) * 0.08;

      pointCloud.rotation.y = time * 0.05 + mouseX * 0.01;
      pointCloud.rotation.x = mouseY * 0.01 + Math.sin(time * 0.1) * 0.05;
      pointCloud.position.y = -scrollY * 0.3;

      linesMesh.rotation.y = pointCloud.rotation.y;
      linesMesh.rotation.x = pointCloud.rotation.x;
      linesMesh.position.y = pointCloud.position.y;

      // Update lines between nearby particles
      const posAttr = geometry.attributes.position.array as Float32Array;
      const linePosAttr = lineGeometry.attributes.position.array as Float32Array;
      let lineIndex = 0;

      for (let i = 0; i < particleCount && lineIndex < maxLineSegments * 6; i += 3) {
        for (let j = i + 1; j < Math.min(particleCount, i + 12); j++) {
          const dx = posAttr[i * 3] - posAttr[j * 3];
          const dy = posAttr[i * 3 + 1] - posAttr[j * 3 + 1];
          const dz = posAttr[i * 3 + 2] - posAttr[j * 3 + 2];
          const dist = Math.hypot(dx, dy, dz);

          if (dist < 22 && lineIndex < maxLineSegments * 6 - 6) {
            linePosAttr[lineIndex++] = posAttr[i * 3];
            linePosAttr[lineIndex++] = posAttr[i * 3 + 1];
            linePosAttr[lineIndex++] = posAttr[i * 3 + 2];

            linePosAttr[lineIndex++] = posAttr[j * 3];
            linePosAttr[lineIndex++] = posAttr[j * 3 + 1];
            linePosAttr[lineIndex++] = posAttr[j * 3 + 2];
          }
        }
      }

      lineGeometry.setDrawRange(0, lineIndex / 3);
      lineGeometry.attributes.position.needsUpdate = true;

      if (renderer) {
        renderer.render(scene, camera);
      }
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);

      if (renderer && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
        renderer.dispose();
      }
      geometry.dispose();
      particleMaterial.dispose();
      lineGeometry.dispose();
      lineMaterial.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-40 dark:opacity-35 transition-opacity duration-700"
      aria-hidden="true"
    />
  );
};
