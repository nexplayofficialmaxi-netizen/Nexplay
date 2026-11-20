import * as THREE from 'three';

export function createAsphaltTexture(maxAnisotropy = 4): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#22262E';
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 6500; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const v = 26 + Math.floor(Math.random() * 26);
    ctx.fillStyle = `rgb(${v},${v + 2},${v + 5})`;
    ctx.fillRect(x, y, 2, 2);
  }

  const groove = ctx.createLinearGradient(0, 0, 512, 0);
  groove.addColorStop(0, 'rgba(10,12,16,0.0)');
  groove.addColorStop(0.28, 'rgba(10,12,16,0.35)');
  groove.addColorStop(0.5, 'rgba(10,12,16,0.18)');
  groove.addColorStop(0.72, 'rgba(10,12,16,0.35)');
  groove.addColorStop(1, 'rgba(10,12,16,0.0)');
  ctx.fillStyle = groove;
  ctx.fillRect(0, 0, 512, 512);

  ctx.fillStyle = '#E2E8F0';
  ctx.fillRect(14, 0, 10, 512);
  ctx.fillRect(488, 0, 10, 512);

  ctx.fillStyle = 'rgba(203, 213, 225, 0.22)';
  for (let y = 0; y < 512; y += 64) {
    ctx.fillRect(253, y, 6, 28);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}

export function createKerbTexture(
  primary = '#DC2626',
  secondary = '#F8FAFC',
  maxAnisotropy = 4
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const stripeH = 32;
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = i % 2 === 0 ? primary : secondary;
    ctx.fillRect(0, i * stripeH, 64, stripeH);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}

export function createStartLineTexture(maxAnisotropy = 4): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  const cols = 16;
  const rows = 4;
  const cw = canvas.width / cols;
  const ch = canvas.height / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      ctx.fillStyle = (r + c) % 2 === 0 ? '#F8FAFC' : '#0F172A';
      ctx.fillRect(c * cw, r * ch, cw, ch);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}

export function createCarbonTexture(maxAnisotropy = 4): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#11151C';
  ctx.fillRect(0, 0, 64, 64);
  for (let y = 0; y < 64; y += 8) {
    for (let x = 0; x < 64; x += 8) {
      ctx.fillStyle = (x + y) % 16 === 0 ? '#1C222D' : '#141922';
      ctx.fillRect(x, y, 4, 4);
      ctx.fillRect(x + 4, y + 4, 4, 4);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(8, 8);
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createRadialShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(64, 64, 12, 64, 64, 64);
  grad.addColorStop(0, 'rgba(0,0,0,0.68)');
  grad.addColorStop(0.55, 'rgba(0,0,0,0.32)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

export function createBannerTexture(
  text: string,
  bg = '#0F172A',
  accent = '#E11D48'
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 512, 128);
  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, 18, 128);
  ctx.fillRect(494, 0, 18, 128);

  ctx.fillStyle = '#F8FAFC';
  ctx.font = 'bold 42px "Chakra Petch", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 66);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export function createPitRoadTexture(maxAnisotropy = 4): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#333C4B';
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 4800; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const v = 42 + Math.floor(Math.random() * 32);
    ctx.fillStyle = `rgb(${v},${v + 5},${v + 12})`;
    ctx.fillRect(x, y, 2, 2);
  }

  const trackGrad = ctx.createLinearGradient(0, 0, 512, 0);
  trackGrad.addColorStop(0, 'rgba(15,23,42,0.0)');
  trackGrad.addColorStop(0.35, 'rgba(15,23,42,0.22)');
  trackGrad.addColorStop(0.65, 'rgba(15,23,42,0.22)');
  trackGrad.addColorStop(1, 'rgba(15,23,42,0.0)');
  ctx.fillStyle = trackGrad;
  ctx.fillRect(0, 0, 512, 512);

  ctx.fillStyle = '#FACC15';
  ctx.fillRect(10, 0, 22, 512);
  ctx.fillRect(480, 0, 22, 512);

  ctx.fillStyle = '#F8FAFC';
  ctx.fillRect(36, 0, 6, 512);
  ctx.fillRect(470, 0, 6, 512);

  ctx.fillStyle = '#FDE047';
  for (let y = 0; y < 512; y += 128) {
    ctx.fillRect(250, y + 18, 12, 46);
    ctx.beginPath();
    ctx.moveTo(256, y + 80);
    ctx.lineTo(292, y + 114);
    ctx.lineTo(276, y + 114);
    ctx.lineTo(256, y + 95);
    ctx.lineTo(236, y + 114);
    ctx.lineTo(220, y + 114);
    ctx.closePath();
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}

export function createPitEntryMarkingTexture(maxAnisotropy = 4): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 256, 512);

  ctx.fillStyle = 'rgba(250, 204, 21, 0.92)';
  for (let y = 20; y < 480; y += 56) {
    ctx.beginPath();
    ctx.moveTo(24, y);
    ctx.lineTo(90, y);
    ctx.lineTo(132, y + 28);
    ctx.lineTo(66, y + 28);
    ctx.closePath();
    ctx.fill();
  }

  ctx.save();
  ctx.translate(168, 256);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 64px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('PITS >>', 0, 0);
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}
