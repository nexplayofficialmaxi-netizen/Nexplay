import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { CarCustomization, StockCarSpec } from '../types/game';
import { createStockCarMesh, CarMeshRig } from '../engine/carFactory';

interface GarageShowroomProps {
  carSpec: StockCarSpec;
  customization: CarCustomization;
}

export const GarageShowroom: React.FC<GarageShowroomProps> = ({
  carSpec,
  customization,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rigRef = useRef<CarMeshRig | null>(null);
  const cfgRef = useRef({ carSpec, customization });
  cfgRef.current = { carSpec, customization };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b0f18);
    scene.fog = new THREE.Fog(0x0b0f18, 14, 34);

    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    const camera = new THREE.PerspectiveCamera(
      42,
      Math.max(1, container.clientWidth) / Math.max(1, container.clientHeight),
      0.1,
      80,
    );

    const hemi = new THREE.HemisphereLight(0x93c5fd, 0x1e293b, 0.7);
    scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xfffbeb, 2.2);
    keyLight.position.set(6, 9, 7);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.1);
    rimLight.position.set(-7, 4, -6);
    scene.add(rimLight);

    const floorGeo = new THREE.PlaneGeometry(50, 50);
    floorGeo.rotateX(-Math.PI / 2);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0e131e,
      roughness: 0.4,
      metalness: 0.3,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.receiveShadow = true;
    scene.add(floor);

    const discGeo = new THREE.CylinderGeometry(3.6, 3.8, 0.14, 48);
    const discMat = new THREE.MeshStandardMaterial({
      color: 0x161d2b,
      roughness: 0.35,
      metalness: 0.55,
    });
    const disc = new THREE.Mesh(discGeo, discMat);
    disc.position.y = 0.07;
    disc.receiveShadow = true;
    scene.add(disc);

    const ringGeo = new THREE.RingGeometry(3.52, 3.64, 48);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xe11d48 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.y = 0.145;
    scene.add(ring);

    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const cur = cfgRef.current;
    const rig = createStockCarMesh(
      {
        primaryColor: cur.customization.primaryColor,
        secondaryColor: cur.customization.secondaryColor,
        accentColor: cur.customization.accentColor,
        number: cur.customization.number,
        pattern: cur.customization.pattern,
        doorStyle: cur.customization.doorStyle,
        wheelStyle: cur.customization.wheelStyle,
        customImageUrl: cur.customization.customImageUrl,
        sponsor: cur.carSpec.sponsor,
      },
      maxAniso,
    );
    rig.root.position.y = 0.14;
    scene.add(rig.root);
    rigRef.current = rig;

    let orbitAngle = 0.65;
    let orbitPitch = 0.32;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    let autoSpin = true;

    const onPointerDown = (e: PointerEvent) => {
      dragging = true;
      autoSpin = false;
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      orbitAngle -= dx * 0.008;
      orbitPitch = THREE.MathUtils.clamp(orbitPitch + dy * 0.005, 0.12, 0.72);
    };
    const onPointerUp = () => {
      dragging = false;
    };

    const dom = renderer.domElement;
    dom.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    const onResize = () => {
      if (!container) return;
      const w = Math.max(1, container.clientWidth);
      const h = Math.max(1, container.clientHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(container);

    const clock = new THREE.Clock();
    let frameId = 0;
    let disposed = false;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      if (disposed) return;
      const dt = Math.min(0.05, clock.getDelta());
      if (autoSpin) {
        orbitAngle += dt * 0.38;
      }

      const dist = 6.6;
      camera.position.set(
        Math.sin(orbitAngle) * Math.cos(orbitPitch) * dist,
        0.9 + Math.sin(orbitPitch) * dist,
        Math.cos(orbitAngle) * Math.cos(orbitPitch) * dist,
      );
      camera.lookAt(0, 0.65, 0);

      renderer.render(scene, camera);
      if (isSoftwareGl) afterDraw(tick);
      else frameId = requestAnimationFrame(tick);
    }

    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      ro.disconnect();
      dom.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      rig.dispose();
      floorGeo.dispose();
      floorMat.dispose();
      discGeo.dispose();
      discMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      renderer.dispose();
      if (dom.parentNode === container) container.removeChild(dom);
    };
  }, []);

  useEffect(() => {
    const rig = rigRef.current;
    if (!rig) return;
    rig.applyConfig({
      primaryColor: customization.primaryColor,
      secondaryColor: customization.secondaryColor,
      accentColor: customization.accentColor,
      number: customization.number,
      pattern: customization.pattern,
      doorStyle: customization.doorStyle,
      wheelStyle: customization.wheelStyle,
      customImageUrl: customization.customImageUrl,
      sponsor: carSpec.sponsor,
    });
  }, [carSpec, customization]);

  return (
    <div className="relative w-full h-full min-h-[380px] rounded-xl overflow-hidden bg-[#0B0F18] border border-white/10">
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
      <div className="pointer-events-none absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs text-slate-400">
        <span>Arrastra para rotar el Stock Car 360°</span>
        <span className="font-mono-tabular text-slate-300">
          #{customization.number || '07'} · {carSpec.team}
        </span>
      </div>
    </div>
  );
};
