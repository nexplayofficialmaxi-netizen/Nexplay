import * as THREE from 'three';
import { DoorStyle, LiveryPattern, WheelStyle } from '../types/game';

export interface CarBuildConfig {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  number: string;
  pattern: LiveryPattern;
  doorStyle?: DoorStyle;
  wheelStyle?: WheelStyle;
  customImageUrl?: string | null;
  sponsor?: string;
}

export interface CarMeshRig {
  root: THREE.Group;
  bodyGroup: THREE.Group;
  frontLeftSteer: THREE.Group;
  frontRightSteer: THREE.Group;
  wheels: THREE.Mesh[];
  rimMeshes: THREE.Mesh[];
  hubMeshes: THREE.Mesh[];
  tailLightMat: THREE.MeshStandardMaterial;
  headLightMat: THREE.MeshStandardMaterial;
  paintMat: THREE.MeshPhysicalMaterial;
  rimMat: THREE.MeshStandardMaterial;
  hubMat: THREE.MeshStandardMaterial;
  tireSidewallMat: THREE.MeshStandardMaterial;
  liveryTex: THREE.CanvasTexture;
  applyConfig: (cfg: CarBuildConfig) => void;
  setDamageVisual: (damage01: number) => void;
  dispose: () => void;
}

let sharedGeos: {
  chassis: THREE.BufferGeometry;
  cabin: THREE.BufferGeometry;
  windshield: THREE.BufferGeometry;
  splitter: THREE.BufferGeometry;
  spoilerBlade: THREE.BufferGeometry;
  spoilerFin: THREE.BufferGeometry;
  tire: THREE.BufferGeometry;
  tireSidewallRing: THREE.BufferGeometry;
  rim: THREE.BufferGeometry;
  hub: THREE.BufferGeometry;
  exhaust: THREE.BufferGeometry;
  grille: THREE.BufferGeometry;
  headlight: THREE.BufferGeometry;
  taillight: THREE.BufferGeometry;
  shadow: THREE.BufferGeometry;
  roofPlate: THREE.BufferGeometry;
  hoodPlate: THREE.BufferGeometry;
  doorPlate: THREE.BufferGeometry;
} | null = null;

let sharedShadowTex: THREE.CanvasTexture | null = null;

function getSharedShadowTexture(): THREE.CanvasTexture {
  if (sharedShadowTex) return sharedShadowTex;
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext('2d')!;
  const grad = ctx.createRadialGradient(64, 64, 14, 64, 64, 62);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.72)');
  grad.addColorStop(0.55, 'rgba(0, 0, 0, 0.35)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  sharedShadowTex = tex;
  return tex;
}

function getSharedGeometries() {
  if (sharedGeos) return sharedGeos;

  const bodyShape = new THREE.Shape();
  bodyShape.moveTo(-2.42, 0.18);
  bodyShape.lineTo(2.38, 0.16);
  bodyShape.lineTo(2.44, 0.42);
  bodyShape.lineTo(2.26, 0.66);
  bodyShape.lineTo(1.05, 0.76);
  bodyShape.lineTo(-1.15, 0.78);
  bodyShape.lineTo(-2.36, 0.74);
  bodyShape.lineTo(-2.45, 0.46);
  bodyShape.closePath();

  const chassis = new THREE.ExtrudeGeometry(bodyShape, {
    depth: 1.88,
    bevelEnabled: true,
    bevelThickness: 0.08,
    bevelSize: 0.07,
    bevelSegments: 2,
    steps: 1,
  });
  chassis.translate(0, 0, -0.94);
  chassis.rotateY(-Math.PI / 2);
  chassis.computeVertexNormals();

  const cabinShape = new THREE.Shape();
  cabinShape.moveTo(-1.28, 0.72);
  cabinShape.lineTo(1.12, 0.72);
  cabinShape.lineTo(0.45, 1.24);
  cabinShape.lineTo(-0.78, 1.24);
  cabinShape.closePath();

  const cabin = new THREE.ExtrudeGeometry(cabinShape, {
    depth: 1.44,
    bevelEnabled: true,
    bevelThickness: 0.06,
    bevelSize: 0.05,
    bevelSegments: 2,
  });
  cabin.translate(0, 0, -0.72);
  cabin.rotateY(-Math.PI / 2);
  cabin.computeVertexNormals();

  const glassShape = new THREE.Shape();
  glassShape.moveTo(-1.14, 0.78);
  glassShape.lineTo(1.02, 0.78);
  glassShape.lineTo(0.42, 1.18);
  glassShape.lineTo(-0.74, 1.18);
  glassShape.closePath();

  const windshield = new THREE.ExtrudeGeometry(glassShape, {
    depth: 1.5,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: 1,
  });
  windshield.translate(0, 0, -0.75);
  windshield.rotateY(-Math.PI / 2);
  windshield.computeVertexNormals();

  const splitter = new THREE.BoxGeometry(2.02, 0.06, 0.34);
  const spoilerBlade = new THREE.BoxGeometry(1.88, 0.24, 0.05);
  const spoilerFin = new THREE.BoxGeometry(0.04, 0.28, 0.28);

  const tire = new THREE.CylinderGeometry(0.35, 0.35, 0.28, 18);
  tire.rotateZ(Math.PI / 2);

  const tireSidewallRing = new THREE.CylinderGeometry(0.29, 0.29, 0.29, 18);
  tireSidewallRing.rotateZ(Math.PI / 2);

  const rim = new THREE.CylinderGeometry(0.22, 0.22, 0.305, 12);
  rim.rotateZ(Math.PI / 2);

  const hub = new THREE.CylinderGeometry(0.09, 0.09, 0.32, 8);
  hub.rotateZ(Math.PI / 2);

  const exhaust = new THREE.CylinderGeometry(0.045, 0.045, 0.28, 10);
  exhaust.rotateZ(Math.PI / 2);

  const grille = new THREE.BoxGeometry(1.32, 0.22, 0.05);
  const headlight = new THREE.BoxGeometry(0.32, 0.13, 0.05);
  const taillight = new THREE.BoxGeometry(0.42, 0.13, 0.05);
  const shadow = new THREE.PlaneGeometry(2.8, 5.7);
  shadow.rotateX(-Math.PI / 2);

  const roofPlate = new THREE.PlaneGeometry(1.15, 0.98);
  roofPlate.rotateX(-Math.PI / 2);

  const hoodPlate = new THREE.PlaneGeometry(1.42, 1.25);
  hoodPlate.rotateX(-Math.PI / 2);

  const doorPlate = new THREE.PlaneGeometry(1.32, 0.48);

  sharedGeos = {
    chassis,
    cabin,
    windshield,
    splitter,
    spoilerBlade,
    spoilerFin,
    tire,
    tireSidewallRing,
    rim,
    hub,
    exhaust,
    grille,
    headlight,
    taillight,
    shadow,
    roofPlate,
    hoodPlate,
    doorPlate,
  };
  return sharedGeos;
}

export function drawLiveryCanvas(
  canvas: HTMLCanvasElement,
  cfg: CarBuildConfig,
  loadedCustomImg?: HTMLImageElement | null,
) {
  const ctx = canvas.getContext('2d')!;
  const w = canvas.width;
  const h = canvas.height;

  ctx.fillStyle = cfg.primaryColor;
  ctx.fillRect(0, 0, w, h);

  if (loadedCustomImg) {
    // Draw user's pasted/uploaded Google image full-bleed across body livery
    ctx.drawImage(loadedCustomImg, 0, 0, w, h);
    // Subtle dark vignette at bottom for sponsor legibility
    ctx.fillStyle = 'rgba(9,11,16,0.35)';
    ctx.fillRect(0, h * 0.82, w, h * 0.18);
  } else {
    ctx.fillStyle = cfg.secondaryColor;
    if (cfg.pattern === 'stripes') {
      ctx.fillRect(w * 0.36, 0, w * 0.1, h);
      ctx.fillRect(w * 0.54, 0, w * 0.1, h);
      ctx.fillStyle = cfg.accentColor;
      ctx.fillRect(w * 0.47, 0, w * 0.06, h);
    } else if (cfg.pattern === 'chevron') {
      ctx.beginPath();
      ctx.moveTo(0, h * 0.65);
      ctx.lineTo(w * 0.5, h * 0.18);
      ctx.lineTo(w, h * 0.65);
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = cfg.accentColor;
      ctx.lineWidth = 16;
      ctx.beginPath();
      ctx.moveTo(0, h * 0.63);
      ctx.lineTo(w * 0.5, h * 0.16);
      ctx.lineTo(w, h * 0.63);
      ctx.stroke();
    } else if (cfg.pattern === 'dual') {
      ctx.fillRect(0, h * 0.55, w, h * 0.45);
      ctx.fillStyle = cfg.accentColor;
      ctx.fillRect(0, h * 0.51, w, h * 0.05);
    } else if (cfg.pattern === 'flames') {
      ctx.fillStyle = cfg.secondaryColor;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(w, 0);
      ctx.lineTo(w, h * 0.48);
      ctx.quadraticCurveTo(w * 0.78, h * 0.72, w * 0.62, h * 0.42);
      ctx.quadraticCurveTo(w * 0.5, h * 0.78, w * 0.36, h * 0.44);
      ctx.quadraticCurveTo(w * 0.2, h * 0.72, 0, h * 0.46);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = cfg.accentColor;
      ctx.lineWidth = 8;
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(w * 0.15, 0);
      ctx.lineTo(w * 0.85, 0);
      ctx.lineTo(w * 0.65, h);
      ctx.lineTo(w * 0.35, h);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = cfg.accentColor;
      ctx.fillRect(w * 0.48, 0, w * 0.04, h);
    }
  }

  // Door / Number Plate styling
  const doorStyle = cfg.doorStyle || 'classic';
  if (doorStyle !== 'clean') {
    ctx.save();
    if (doorStyle === 'carbon') {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
      ctx.beginPath();
      ctx.roundRect(w * 0.25, h * 0.25, w * 0.5, h * 0.5, 16);
      ctx.fill();
      ctx.strokeStyle = cfg.accentColor;
      ctx.lineWidth = 10;
      ctx.stroke();
    } else if (doorStyle === 'angled') {
      ctx.transform(1, 0, -0.22, 1, w * 0.11, 0);
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.fillRect(w * 0.26, h * 0.27, w * 0.48, h * 0.46);
      ctx.strokeStyle = cfg.accentColor;
      ctx.lineWidth = 9;
      ctx.strokeRect(w * 0.26, h * 0.27, w * 0.48, h * 0.46);
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.96)';
      ctx.beginPath();
      ctx.roundRect(w * 0.27, h * 0.27, w * 0.46, h * 0.46, 22);
      ctx.fill();
      ctx.strokeStyle = cfg.accentColor;
      ctx.lineWidth = 8;
      ctx.stroke();
    }

    ctx.fillStyle = doorStyle === 'carbon' ? '#F8FAFC' : '#090B10';
    ctx.font = '900 128px "Barlow Condensed", Impact, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(cfg.number || '07', w * 0.5, h * 0.52);
    ctx.restore();
  }

  // Sponsor strip
  if (!loadedCustomImg) {
    ctx.fillStyle = 'rgba(9,11,16,0.88)';
    ctx.fillRect(0, h * 0.82, w, h * 0.14);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 30px "Barlow Condensed", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(cfg.sponsor || 'NEXPLAY', w * 0.5, h * 0.89);
  }
}

export function applyWheelAppearance(
  wheelStyle: WheelStyle,
  accentColor: string,
  rimMat: THREE.MeshStandardMaterial,
  hubMat: THREE.MeshStandardMaterial,
  tireSidewallMat: THREE.MeshStandardMaterial,
) {
  if (wheelStyle === 'bbs-mesh') {
    rimMat.color.setHex(0xd97706); // Racing Gold BBS
    rimMat.metalness = 0.9;
    rimMat.roughness = 0.18;
    hubMat.color.setHex(0x111827);
    tireSidewallMat.color.setHex(0xfacc15); // Goodyear Eagle yellow ring
  } else if (wheelStyle === '5-spoke') {
    rimMat.color.setHex(0xe2e8f0); // Chrome silver
    rimMat.metalness = 0.92;
    rimMat.roughness = 0.15;
    hubMat.color.set(accentColor);
    tireSidewallMat.color.setHex(0xf8fafc);
  } else if (wheelStyle === 'carbon-lip') {
    rimMat.color.setHex(0x111827); // Matte carbon
    rimMat.metalness = 0.45;
    rimMat.roughness = 0.42;
    hubMat.color.set(accentColor);
    tireSidewallMat.color.set(accentColor);
  } else {
    // 'steel-nascar' classic black Aero steelies with yellow Goodyear sidewall
    rimMat.color.setHex(0x1e293b);
    rimMat.metalness = 0.65;
    rimMat.roughness = 0.35;
    hubMat.color.setHex(0xef4444);
    tireSidewallMat.color.setHex(0xfacc15);
  }
}

export function createStockCarMesh(
  cfg: CarBuildConfig,
  maxAnisotropy = 4,
): CarMeshRig {
  const geos = getSharedGeometries();
  const root = new THREE.Group();
  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  const shadowMat = new THREE.MeshBasicMaterial({
    map: getSharedShadowTexture(),
    transparent: true,
    depthWrite: false,
    opacity: 0.65,
  });
  const shadowPlane = new THREE.Mesh(geos.shadow, shadowMat);
  shadowPlane.position.y = 0.025;
  root.add(shadowPlane);

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  drawLiveryCanvas(canvas, cfg);

  const liveryTex = new THREE.CanvasTexture(canvas);
  liveryTex.colorSpace = THREE.SRGBColorSpace;
  liveryTex.anisotropy = maxAnisotropy;

  const paintMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(cfg.primaryColor),
    metalness: 0.35,
    roughness: 0.24,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
  });
  const chassisMesh = new THREE.Mesh(geos.chassis, paintMat);
  chassisMesh.castShadow = true;
  chassisMesh.receiveShadow = true;
  bodyGroup.add(chassisMesh);

  const decalMat = new THREE.MeshStandardMaterial({
    map: liveryTex,
    roughness: 0.25,
    metalness: 0.2,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });

  const roofPlate = new THREE.Mesh(geos.roofPlate, decalMat);
  roofPlate.position.set(0, 1.305, -0.16);
  bodyGroup.add(roofPlate);

  const hoodPlate = new THREE.Mesh(geos.hoodPlate, decalMat);
  hoodPlate.position.set(0, 0.77, 1.62);
  hoodPlate.rotation.x = 0.08;
  bodyGroup.add(hoodPlate);

  const leftDoor = new THREE.Mesh(geos.doorPlate, decalMat);
  leftDoor.position.set(1.015, 0.48, 0.02);
  leftDoor.rotation.y = Math.PI / 2;
  bodyGroup.add(leftDoor);

  const rightDoor = new THREE.Mesh(geos.doorPlate, decalMat);
  rightDoor.position.set(-1.015, 0.48, 0.02);
  rightDoor.rotation.y = -Math.PI / 2;
  bodyGroup.add(rightDoor);

  const cabinMesh = new THREE.Mesh(geos.cabin, paintMat);
  cabinMesh.castShadow = true;
  bodyGroup.add(cabinMesh);

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x0b1220,
    metalness: 0.15,
    roughness: 0.08,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
  });
  const glassMesh = new THREE.Mesh(geos.windshield, glassMat);
  bodyGroup.add(glassMesh);

  const carbonMat = new THREE.MeshStandardMaterial({
    color: 0x161a23,
    roughness: 0.62,
    metalness: 0.25,
  });
  const splitter = new THREE.Mesh(geos.splitter, carbonMat);
  splitter.position.set(0, 0.15, 2.34);
  bodyGroup.add(splitter);

  const spoilerMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(cfg.accentColor),
    roughness: 0.3,
    metalness: 0.4,
  });
  const spoiler = new THREE.Mesh(geos.spoilerBlade, spoilerMat);
  spoiler.position.set(0, 0.88, -2.35);
  spoiler.rotation.x = -0.35;
  spoiler.castShadow = true;
  bodyGroup.add(spoiler);

  const finL = new THREE.Mesh(geos.spoilerFin, carbonMat);
  finL.position.set(0.94, 0.85, -2.32);
  bodyGroup.add(finL);
  const finR = new THREE.Mesh(geos.spoilerFin, carbonMat);
  finR.position.set(-0.94, 0.85, -2.32);
  bodyGroup.add(finR);

  const grilleMesh = new THREE.Mesh(geos.grille, carbonMat);
  grilleMesh.position.set(0, 0.37, 2.47);
  bodyGroup.add(grilleMesh);

  const headLightMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    emissive: 0xe2e8f0,
    emissiveIntensity: 0.7,
    roughness: 0.15,
  });
  const hlL = new THREE.Mesh(geos.headlight, headLightMat);
  hlL.position.set(0.68, 0.49, 2.45);
  bodyGroup.add(hlL);
  const hlR = new THREE.Mesh(geos.headlight, headLightMat);
  hlR.position.set(-0.68, 0.49, 2.45);
  bodyGroup.add(hlR);

  const tailLightMat = new THREE.MeshStandardMaterial({
    color: 0x991b1b,
    emissive: 0xef4444,
    emissiveIntensity: 0.4,
    roughness: 0.2,
  });
  const tlL = new THREE.Mesh(geos.taillight, tailLightMat);
  tlL.position.set(0.64, 0.56, -2.47);
  bodyGroup.add(tlL);
  const tlR = new THREE.Mesh(geos.taillight, tailLightMat);
  tlR.position.set(-0.64, 0.56, -2.47);
  bodyGroup.add(tlR);

  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xd1d5db,
    metalness: 0.92,
    roughness: 0.18,
  });
  const exL = new THREE.Mesh(geos.exhaust, chromeMat);
  exL.position.set(0.95, 0.18, -0.65);
  bodyGroup.add(exL);
  const exR = new THREE.Mesh(geos.exhaust, chromeMat);
  exR.position.set(-0.95, 0.18, -0.65);
  bodyGroup.add(exR);

  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x17191f,
    roughness: 0.88,
    metalness: 0.05,
  });
  const tireSidewallMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    roughness: 0.6,
    metalness: 0.1,
  });
  const rimMat = new THREE.MeshStandardMaterial({
    color: 0xcbd5e1,
    metalness: 0.85,
    roughness: 0.22,
  });
  const hubMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(cfg.accentColor),
    metalness: 0.6,
    roughness: 0.3,
  });

  applyWheelAppearance(
    cfg.wheelStyle || 'steel-nascar',
    cfg.accentColor,
    rimMat,
    hubMat,
    tireSidewallMat,
  );

  const wheels: THREE.Mesh[] = [];
  const rimMeshes: THREE.Mesh[] = [];
  const hubMeshes: THREE.Mesh[] = [];

  const makeWheel = (x: number, z: number, steerGroup?: THREE.Group) => {
    const tireMesh = new THREE.Mesh(geos.tire, tireMat);
    const sidewall = new THREE.Mesh(geos.tireSidewallRing, tireSidewallMat);
    const rimMesh = new THREE.Mesh(geos.rim, rimMat);
    const hubMesh = new THREE.Mesh(geos.hub, hubMat);
    tireMesh.add(sidewall);
    tireMesh.add(rimMesh);
    tireMesh.add(hubMesh);
    tireMesh.castShadow = true;
    wheels.push(tireMesh);
    rimMeshes.push(rimMesh);
    hubMeshes.push(hubMesh);

    if (steerGroup) {
      steerGroup.position.set(x, 0.35, z);
      steerGroup.add(tireMesh);
      root.add(steerGroup);
    } else {
      tireMesh.position.set(x, 0.35, z);
      root.add(tireMesh);
    }
  };

  const frontLeftSteer = new THREE.Group();
  const frontRightSteer = new THREE.Group();
  makeWheel(0.96, 1.46, frontLeftSteer);
  makeWheel(-0.96, 1.46, frontRightSteer);
  makeWheel(0.96, -1.42);
  makeWheel(-0.96, -1.42);

  let loadToken = 0;
  const applyConfig = (nextCfg: CarBuildConfig) => {
    const token = ++loadToken;
    paintMat.color.set(nextCfg.primaryColor);
    spoilerMat.color.set(nextCfg.accentColor);
    applyWheelAppearance(
      nextCfg.wheelStyle || 'steel-nascar',
      nextCfg.accentColor,
      rimMat,
      hubMat,
      tireSidewallMat,
    );

    if (nextCfg.customImageUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        if (token !== loadToken) return;
        drawLiveryCanvas(canvas, nextCfg, img);
        liveryTex.needsUpdate = true;
      };
      img.onerror = () => {
        if (token !== loadToken) return;
        drawLiveryCanvas(canvas, nextCfg, null);
        liveryTex.needsUpdate = true;
      };
      img.src = nextCfg.customImageUrl;
    } else {
      drawLiveryCanvas(canvas, nextCfg, null);
      liveryTex.needsUpdate = true;
    }
  };

  // Load initial custom image if provided
  if (cfg.customImageUrl) {
    applyConfig(cfg);
  }

  const setDamageVisual = (damage01: number) => {
    // Scuff paint & subtly tilt spoiler on heavy NASCAR wreck damage
    paintMat.roughness = 0.24 + damage01 * 0.55;
    spoiler.rotation.z = damage01 * 0.14;
  };

  const dispose = () => {
    loadToken++;
    liveryTex.dispose();
    paintMat.dispose();
    decalMat.dispose();
    glassMat.dispose();
    carbonMat.dispose();
    spoilerMat.dispose();
    headLightMat.dispose();
    tailLightMat.dispose();
    chromeMat.dispose();
    tireMat.dispose();
    tireSidewallMat.dispose();
    rimMat.dispose();
    hubMat.dispose();
    shadowMat.dispose();
  };

  return {
    root,
    bodyGroup,
    frontLeftSteer,
    frontRightSteer,
    wheels,
    rimMeshes,
    hubMeshes,
    tailLightMat,
    headLightMat,
    paintMat,
    rimMat,
    hubMat,
    tireSidewallMat,
    liveryTex,
    applyConfig,
    setDamageVisual,
    dispose,
  };
}
