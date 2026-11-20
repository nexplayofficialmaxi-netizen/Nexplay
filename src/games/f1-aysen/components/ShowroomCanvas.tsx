import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { buildF1Car, F1CarRig, getCarGeometryMetrics } from '../engine/carBuilder';
import { CarConfig } from '../types/game';
import {
  getClampedPixelRatio,
  MAX_PIXEL_RATIO_SHOWROOM,
  SHOWROOM_SHADOW_MAP_SIZE,
} from '../utils/memoryBudget';

export type ShowroomPreset = 'hero' | 'front' | 'side' | 'rear' | 'halo';

interface ShowroomCanvasProps {
  carConfig: CarConfig;
  cameraPreset?: ShowroomPreset;
  autoRotate?: boolean;
  className?: string;
}

const PRESET_ANGLES: Record<ShowroomPreset, { theta: number; phi: number; dist: number; targetY: number }> = {
  hero: { theta: 0.68, phi: 0.28, dist: 6.4, targetY: 0.45 },
  front: { theta: 0.12, phi: 0.22, dist: 5.8, targetY: 0.42 },
  side: { theta: Math.PI * 0.5, phi: 0.18, dist: 6.1, targetY: 0.45 },
  rear: { theta: Math.PI - 0.55, phi: 0.3, dist: 5.9, targetY: 0.5 },
  halo: { theta: 0.45, phi: 0.58, dist: 3.7, targetY: 0.72 },
};

function detectSoftwareWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return false;
  }
}

export default function ShowroomCanvas({
  carConfig,
  cameraPreset = 'hero',
  autoRotate = true,
  className = '',
}: ShowroomCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const rigRef = useRef<F1CarRig | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const isSoftwareGlRef = useRef(false);
  const geomSigRef = useRef<string>('');
  const presetRef = useRef<ShowroomPreset>(cameraPreset);
  const autoRotateRef = useRef<boolean>(autoRotate);
  const manualOrbitRef = useRef<{ active: boolean; theta: number; phi: number; dist: number; targetY: number }>({
    active: false,
    ...PRESET_ANGLES[cameraPreset],
  });

  useEffect(() => {
    presetRef.current = cameraPreset;
    const p = PRESET_ANGLES[cameraPreset];
    const metrics = getCarGeometryMetrics(carConfig);
    const extraDist = metrics.isLargeWheels ? 0.7 : 0;
    const extraY = Math.max(0, metrics.chassisLiftY) + (metrics.isLargeWheels ? 0.1 : 0);
    manualOrbitRef.current.theta = p.theta;
    manualOrbitRef.current.phi = p.phi;
    manualOrbitRef.current.dist = p.dist + extraDist;
    manualOrbitRef.current.targetY = p.targetY + extraY;
  }, [cameraPreset, carConfig]);

  useEffect(() => {
    autoRotateRef.current = autoRotate;
  }, [autoRotate]);

  useEffect(() => {
    const nextSig = `${carConfig.wheelSize ?? 'medium'}|${carConfig.bodyStyle ?? 'aero'}|${carConfig.suspensionStyle ?? 'standard'}|${carConfig.flagStyle ?? 'none'}`;
    if (
      rigRef.current &&
      sceneRef.current &&
      rendererRef.current &&
      geomSigRef.current !== nextSig
    ) {
      sceneRef.current.remove(rigRef.current.root);
      rigRef.current.dispose();
      const nextRig = buildF1Car(carConfig, {
        castShadow: !isSoftwareGlRef.current,
        maxAnisotropy: rendererRef.current.capabilities.getMaxAnisotropy(),
      });
      nextRig.root.position.y = 0.08;
      sceneRef.current.add(nextRig.root);
      rigRef.current = nextRig;
      geomSigRef.current = nextSig;
    } else {
      rigRef.current?.updateConfig(carConfig);
    }
  }, [carConfig]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareWebGL();
    isSoftwareGlRef.current = isSoftwareGl;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(
      getClampedPixelRatio(MAX_PIXEL_RATIO_SHOWROOM, isSoftwareGl)
    );
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color('#090D12');
    scene.fog = new THREE.FogExp2('#090D12', 0.032);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    pmrem.dispose();

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);

    // 3-point + softbox studio lighting
    const hemi = new THREE.HemisphereLight(0xdbeafe, 0x0f172a, 0.7);
    scene.add(hemi);

    const key = new THREE.DirectionalLight(0xfff1dc, 2.2);
    key.position.set(5, 8, 6);
    key.castShadow = !isSoftwareGl;
    key.shadow.mapSize.set(SHOWROOM_SHADOW_MAP_SIZE, SHOWROOM_SHADOW_MAP_SIZE);
    key.shadow.bias = -0.0005;
    scene.add(key);

    const rim = new THREE.DirectionalLight(0x38bdf8, 1.3);
    rim.position.set(-6, 4, -5);
    scene.add(rim);

    if (!isSoftwareGl) {
      RectAreaLightUniformsLib.init();
      const overheadSoftbox = new THREE.RectAreaLight(0xffffff, 4.5, 6, 2.5);
      overheadSoftbox.position.set(0, 4.5, 0);
      overheadSoftbox.lookAt(0, 0, 0);
      scene.add(overheadSoftbox);
    }

    // Polished showroom turntable plinth
    const floorGeo = new THREE.CircleGeometry(18, 48);
    floorGeo.rotateX(-Math.PI / 2);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0f141c,
      roughness: 0.35,
      metalness: 0.4,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.receiveShadow = true;
    scene.add(floor);

    const plinthGeo = new THREE.CylinderGeometry(3.5, 3.65, 0.08, 48);
    const plinthMat = new THREE.MeshStandardMaterial({
      color: 0x161e29,
      roughness: 0.25,
      metalness: 0.65,
    });
    const plinth = new THREE.Mesh(plinthGeo, plinthMat);
    plinth.position.y = 0.04;
    plinth.receiveShadow = true;
    scene.add(plinth);

    const ringGeo = new THREE.RingGeometry(3.48, 3.55, 64);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xe11d48 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.y = 0.082;
    scene.add(ring);

    const carRig = buildF1Car(carConfig, {
      castShadow: !isSoftwareGl,
      maxAnisotropy: renderer.capabilities.getMaxAnisotropy(),
    });
    carRig.root.position.y = 0.08;
    scene.add(carRig.root);
    rigRef.current = carRig;
    geomSigRef.current = `${carConfig.wheelSize ?? 'medium'}|${carConfig.bodyStyle ?? 'aero'}|${carConfig.suspensionStyle ?? 'standard'}|${carConfig.flagStyle ?? 'none'}`;

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    let curTheta = manualOrbitRef.current.theta;
    let curPhi = manualOrbitRef.current.phi;
    let curDist = manualOrbitRef.current.dist;
    let curTargetY = manualOrbitRef.current.targetY;

    // Pointer drag orbit
    let dragging = false;
    let lastX = 0;
    let lastY = 0;

    const onPointerDown = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      manualOrbitRef.current.active = true;
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      manualOrbitRef.current.theta -= dx * 0.008;
      manualOrbitRef.current.phi = THREE.MathUtils.clamp(
        manualOrbitRef.current.phi + dy * 0.006,
        0.08,
        1.15
      );
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
      const w = container.clientWidth || 800;
      const h = container.clientHeight || 500;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(
        getClampedPixelRatio(MAX_PIXEL_RATIO_SHOWROOM, isSoftwareGl)
      );
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    let frameId = 0;
    let disposed = false;
    let lastT = performance.now();

    const afterDraw = (cb: () => void) => {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (!gl || !gl.fenceSync) {
        frameId = window.setTimeout(cb, 80);
        return;
      }
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
    };

    const tick = () => {
      if (disposed) return;
      const now = performance.now();
      const dt = Math.min(0.05, Math.max(0.001, (now - lastT) / 1000));
      lastT = now;

      if (autoRotateRef.current && !dragging) {
        manualOrbitRef.current.theta += dt * 0.25;
      }

      rigRef.current?.updateVisuals({
        steerAngle: 0,
        speedMs: 0,
        dt,
        drsActive: false,
        braking: false,
        accelerating: false,
        damageLevel: 0,
      });

      curTheta = THREE.MathUtils.damp(curTheta, manualOrbitRef.current.theta, 8, dt);
      curPhi = THREE.MathUtils.damp(curPhi, manualOrbitRef.current.phi, 8, dt);
      curDist = THREE.MathUtils.damp(curDist, manualOrbitRef.current.dist, 8, dt);
      curTargetY = THREE.MathUtils.damp(curTargetY, manualOrbitRef.current.targetY, 8, dt);

      const cosPhi = Math.cos(curPhi);
      camera.position.set(
        Math.sin(curTheta) * cosPhi * curDist,
        curTargetY + Math.sin(curPhi) * curDist,
        Math.cos(curTheta) * cosPhi * curDist
      );
      camera.lookAt(0, curTargetY, 0);

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      dom.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('resize', onResize);
      rigRef.current?.dispose();
      rigRef.current = null;
      sceneRef.current = null;
      rendererRef.current = null;
      floorGeo.dispose();
      floorMat.dispose();
      plinthGeo.dispose();
      plinthMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      envTex.dispose();
      scene.clear();
      renderer.renderLists.dispose();
      renderer.dispose();
      container.innerHTML = '';
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className={`w-full h-full cursor-grab active:cursor-grabbing ${className}`}
      aria-label="Visor 3D del monoplaza de Fórmula 1"
    />
  );
}
