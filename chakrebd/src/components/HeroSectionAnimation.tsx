'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from './ThemeContext';

export default function HeroSectionAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const [themeReady, setThemeReady] = useState(false);

  useEffect(() => {
    if (theme) setThemeReady(true);
  }, [theme]);

  useEffect(() => {
    if (!themeReady || !containerRef.current) return;

    let scene: any, camera: any, renderer: any, labelRenderer: any, controls: any;
    let earth: any, clouds: any, ring1: any, ring2: any, ring3: any, dotRing: any;
    let particles: any, stars: any, dustParticles: any, earthRim: any, fillLight: any;
    let orbitingItems: any[] = [];
    let animationId: number;
    let resizeObserver: ResizeObserver;

    const init = async () => {
      const THREE = await import('three');
      const { OrbitControls } = await import('three/addons/controls/OrbitControls.js');
      const { CSS2DRenderer, CSS2DObject } = await import('three/addons/renderers/CSS2DRenderer.js');

      const container = containerRef.current!;
      const width = container.clientWidth;
      const height = container.clientHeight;

      const isDark = theme === 'dark';

      // 🤩 Make scene background transparent
      const bgColor = null;      // transparent
      const fogColor = null;     // no fog
      const ringColor1 = isDark ? 0x5a6e8a : 0x8aaccf;
      const ringColor2 = isDark ? 0x6a7f9e : 0x9abbdd;
      const ringColor3 = isDark ? 0x7c8fb0 : 0xacc9e8;

      // Particles and stars – keep dark in light mode, light in dark mode
      const particleColor = isDark ? 0x7c8aa5 : 0x2a2a2a;      // dark gray
      const starColor = isDark ? 0xaab4cc : 0x3a3a3a;         // darker gray
      const dustColor = isDark ? 0x8a9bc5 : 0x333333;
      const dotColor = isDark ? 0x6c85b0 : 0x444444;

      const ambientLightColor = isDark ? 0x2a3344 : 0xeef4ff;
      const fillLightColor = isDark ? 0x5577aa : 0xbbddff;
      const backLightColor = isDark ? 0xffaa77 : 0xffddbb;
      const labelBg = isDark ? 'rgba(25, 32, 45, 0.8)' : 'rgba(255, 255, 255, 0.85)';
      const labelTextColor = isDark ? '#f0f3fc' : '#1e293b';
      const labelBorderGlow = isDark ? '0 8px 20px rgba(0,0,0,0.3)' : '0 8px 15px rgba(0,0,0,0.05)';

      scene = new THREE.Scene();
      scene.background = null;               // transparent
      scene.fog = null;                      // no fog

      camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
      camera.position.set(4.5, 2.2, 7.5);
      camera.lookAt(0, 0, 0);

      // WebGL renderer with alpha: true for transparency
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(width, height);
      renderer.setClearColor(0x000000, 0);   // fully transparent
      renderer.shadowMap.enabled = false;
      container.appendChild(renderer.domElement);

      labelRenderer = new CSS2DRenderer();
      labelRenderer.setSize(width, height);
      labelRenderer.domElement.style.position = 'absolute';
      labelRenderer.domElement.style.top = '0px';
      labelRenderer.domElement.style.left = '0px';
      labelRenderer.domElement.style.pointerEvents = 'auto';
      container.appendChild(labelRenderer.domElement);

      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.06;
      controls.autoRotate = false;
      controls.enableZoom = true;
      controls.target.set(0, 0, 0);

      const ambient = new THREE.AmbientLight(ambientLightColor);
      scene.add(ambient);
      const mainLight = new THREE.DirectionalLight(0xffffff, 1.1);
      mainLight.position.set(4, 5, 3);
      scene.add(mainLight);
      fillLight = new THREE.PointLight(fillLightColor, 0.6);
      fillLight.position.set(-2, 1.5, 3);
      scene.add(fillLight);
      const backLight = new THREE.PointLight(backLightColor, 0.4);
      backLight.position.set(0, 1, -4);
      scene.add(backLight);
      earthRim = new THREE.PointLight(0x4488ff, 0.7);
      earthRim.position.set(1, 0.5, 1.8);
      scene.add(earthRim);

      // Particles – larger in light mode
      const particleCount = 1800;
      const particleGeo = new THREE.BufferGeometry();
      const particlePositions = new Float32Array(particleCount * 3);
      for (let i = 0; i < particleCount; i++) {
        particlePositions[i * 3] = (Math.random() - 0.5) * 80;
        particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 40;
        particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 60 - 20;
      }
      particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
      const particleSize = isDark ? 0.08 : 0.14;
      particles = new THREE.Points(particleGeo, new THREE.PointsMaterial({ color: particleColor, size: particleSize, transparent: true, opacity: isDark ? 0.4 : 0.7 }));
      scene.add(particles);

      // Stars – larger in light mode
      const starGeo = new THREE.BufferGeometry();
      const starPos = new Float32Array(2500 * 3);
      for (let i = 0; i < 2500; i++) {
        starPos[i * 3] = (Math.random() - 0.5) * 300;
        starPos[i * 3 + 1] = (Math.random() - 0.5) * 150;
        starPos[i * 3 + 2] = (Math.random() - 0.5) * 120 - 50;
      }
      starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
      const starSize = isDark ? 0.05 : 0.09;
      stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: starColor, size: starSize, transparent: true, opacity: isDark ? 0.5 : 0.8 }));
      scene.add(stars);

      const textureLoader = new THREE.TextureLoader();
      const earthMap = textureLoader.load('https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg');
      const earthSpecularMap = textureLoader.load('https://threejs.org/examples/textures/planets/earth_specular_2048.jpg');
      const cloudMap = textureLoader.load('https://threejs.org/examples/textures/planets/earth_clouds_1024.png');
      const earthMaterial = new THREE.MeshPhongMaterial({ map: earthMap, specularMap: earthSpecularMap, specular: new THREE.Color('grey'), shininess: 5 });
      earth = new THREE.Mesh(new THREE.SphereGeometry(1.25, 128, 128), earthMaterial);
      scene.add(earth);
      const cloudMaterial = new THREE.MeshPhongMaterial({ map: cloudMap, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending });
      clouds = new THREE.Mesh(new THREE.SphereGeometry(1.26, 128, 128), cloudMaterial);
      scene.add(clouds);

      // Rings
      const ringGeoMain = new THREE.TorusGeometry(2.3, 0.02, 128, 400);
      ring1 = new THREE.Mesh(ringGeoMain, new THREE.MeshStandardMaterial({ color: ringColor1, emissive: isDark ? 0x2a3a55 : 0xbbddff, emissiveIntensity: isDark ? 0.3 : 0.15 }));
      ring1.rotation.x = Math.PI / 2;
      ring1.position.y = 0.05;
      scene.add(ring1);

      const ringGeo2 = new THREE.TorusGeometry(2.9, 0.015, 128, 500);
      ring2 = new THREE.Mesh(ringGeo2, new THREE.MeshStandardMaterial({ color: ringColor2, emissive: isDark ? 0x3a4a6a : 0xccddff, emissiveIntensity: isDark ? 0.2 : 0.1 }));
      ring2.rotation.x = Math.PI / 2 + 0.15;
      ring2.rotation.z = 0.25;
      scene.add(ring2);

      const ringGeo3 = new THREE.TorusGeometry(3.5, 0.018, 128, 600);
      ring3 = new THREE.Mesh(ringGeo3, new THREE.MeshStandardMaterial({ color: ringColor3, emissive: isDark ? 0x4a5a7a : 0xddddff, emissiveIntensity: isDark ? 0.2 : 0.08 }));
      ring3.rotation.x = Math.PI / 2 - 0.1;
      ring3.rotation.z = -0.2;
      scene.add(ring3);

      // Orbiting modules
      const modules = [
        { name: 'Jobs', emoji: '💼', color: 0x4c9aff, radius: 2.5, speed: 0.65, yOffset: 0.1 },
        { name: 'Exam Preparation', emoji: '📚', color: 0xf59e0b, radius: 2.8, speed: -0.55, yOffset: 0.4 },
        { name: 'Community', emoji: '👥', color: 0xec4899, radius: 3.1, speed: 0.75, yOffset: -0.2 },
        { name: 'Suggestions', emoji: '💡', color: 0x8b5cf6, radius: 2.4, speed: -0.7, yOffset: 0.6 },
        { name: 'Question Bank', emoji: '❓', color: 0x06b6d4, radius: 3.3, speed: 0.6, yOffset: -0.1 },
        { name: 'CV Builder', emoji: '📄', color: 0xef4444, radius: 2.7, speed: -0.8, yOffset: 0.3 },
      ];
      orbitingItems = [];
      modules.forEach((mod, idx) => {
        const sphereMat = new THREE.MeshStandardMaterial({ color: mod.color, emissive: mod.color, emissiveIntensity: isDark ? 0.4 : 0.2 });
        const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.17, 32, 32), sphereMat);
        scene.add(sphere);
        const div = document.createElement('div');
        div.innerHTML = `${mod.emoji} <strong>${mod.name}</strong>`;
        div.style.cssText = `background: ${labelBg}; backdrop-filter: blur(12px); border-radius: 60px; padding: 8px 22px; font-size: 14px; font-weight: 600; color: ${labelTextColor}; border: 1px solid rgba(${(mod.color >> 16) & 255}, ${(mod.color >> 8) & 255}, ${mod.color & 255}, 0.5); box-shadow: ${labelBorderGlow}; font-family: 'Inter', system-ui; letter-spacing: 0.3px; transition: all 0.2s ease; white-space: nowrap; cursor: pointer; text-shadow: none;`;
        div.addEventListener('mouseenter', () => { div.style.transform = 'scale(1.05)'; div.style.background = isDark ? 'rgba(40, 52, 72, 0.9)' : 'rgba(255, 255, 255, 1)'; });
        div.addEventListener('mouseleave', () => { div.style.transform = 'scale(1)'; div.style.background = labelBg; });
        div.addEventListener('click', () => alert(`✨ Opening ${mod.name} section`));
        const label = new CSS2DObject(div);
        scene.add(label);
        orbitingItems.push({ mesh: sphere, label, radius: mod.radius, speed: mod.speed, yOffset: mod.yOffset, angle: (idx / modules.length) * Math.PI * 2 });
      });

      // Dust particles
      const dustCount = 800;
      const dustGeo = new THREE.BufferGeometry();
      const dustPos = new Float32Array(dustCount * 3);
      for (let i = 0; i < dustCount; i++) {
        const rad = 1.4 + Math.random() * 2.2;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        dustPos[i * 3] = rad * Math.sin(phi) * Math.cos(theta);
        dustPos[i * 3 + 1] = rad * Math.sin(phi) * Math.sin(theta) * 0.6;
        dustPos[i * 3 + 2] = rad * Math.cos(phi);
      }
      dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
      const dustSize = isDark ? 0.03 : 0.05;
      dustParticles = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: dustColor, size: dustSize, transparent: true, blending: THREE.AdditiveBlending, opacity: isDark ? 0.6 : 0.8 }));
      scene.add(dustParticles);

      // Dot ring
      const dotCount = 400;
      const dotGeo = new THREE.BufferGeometry();
      const dotPositions = new Float32Array(dotCount * 3);
      for (let i = 0; i < dotCount; i++) {
        const angle = (i / dotCount) * Math.PI * 2;
        const rad = 2.2;
        dotPositions[i * 3] = Math.cos(angle) * rad;
        dotPositions[i * 3 + 1] = Math.sin(angle) * rad * 0.15;
        dotPositions[i * 3 + 2] = Math.sin(angle) * rad;
      }
      dotGeo.setAttribute('position', new THREE.BufferAttribute(dotPositions, 3));
      const dotRingSize = isDark ? 0.045 : 0.07;
      dotRing = new THREE.Points(dotGeo, new THREE.PointsMaterial({ color: dotColor, size: dotRingSize }));
      scene.add(dotRing);

      const aura = new THREE.Mesh(new THREE.SphereGeometry(1.32, 32, 32), new THREE.MeshBasicMaterial({ color: 0x2266aa, transparent: true, opacity: 0.05, side: THREE.BackSide }));
      scene.add(aura);

      let time = 0;
      const animate = () => {
        animationId = requestAnimationFrame(animate);
        time += 0.012;
        earth.rotation.y += 0.002;
        clouds.rotation.y += 0.0026;
        ring1.rotation.z += 0.0008;
        ring2.rotation.x += 0.001;
        ring2.rotation.y += 0.0005;
        ring3.rotation.z += 0.0004;
        ring3.rotation.x += 0.0007;
        dotRing.rotation.y += 0.003;
        dotRing.rotation.x = Math.sin(time * 0.5) * 0.05;
        orbitingItems.forEach((item) => {
          item.angle += item.speed * 0.007;
          const x = Math.cos(item.angle) * item.radius;
          const z = Math.sin(item.angle) * item.radius;
          const y = item.yOffset + Math.sin(time * 1.2 + item.radius) * 0.08;
          item.mesh.position.set(x, y, z);
          item.label.position.set(x, y + 0.28, z);
        });
        particles.rotation.y += 0.0002;
        stars.rotation.x += 0.0001;
        stars.rotation.y -= 0.00015;
        dustParticles.rotation.y += 0.0005;
        dustParticles.rotation.x = Math.sin(time * 0.2) * 0.05;
        earthRim.intensity = 0.6 + Math.sin(time * 1.8) * 0.15;
        fillLight.intensity = 0.55 + Math.sin(time * 1.2) * 0.1;
        controls.update();
        renderer.render(scene, camera);
        labelRenderer.render(scene, camera);
      };
      animate();

      resizeObserver = new ResizeObserver(() => {
        if (!containerRef.current) return;
        const w = containerRef.current.clientWidth;
        const h = containerRef.current.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
        labelRenderer.setSize(w, h);
      });
      resizeObserver.observe(container);
    };

    init().catch(console.error);

    return () => {
      if (resizeObserver) resizeObserver.disconnect();
      if (animationId) cancelAnimationFrame(animationId);
      if (renderer) {
        renderer.dispose();
        if (renderer.domElement && containerRef.current?.contains(renderer.domElement))
          containerRef.current.removeChild(renderer.domElement);
      }
      if (labelRenderer && labelRenderer.domElement && containerRef.current?.contains(labelRenderer.domElement))
        containerRef.current.removeChild(labelRenderer.domElement);
    };
  }, [theme, themeReady]);

  // Prevent flash before theme is known – show transparent to let parent gradient show
  if (!themeReady) {
    return <div className="absolute inset-0 w-full h-full" />;
  }

  return <div ref={containerRef} className="absolute inset-0 w-full h-full" />;
}