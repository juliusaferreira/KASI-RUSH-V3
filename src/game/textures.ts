import * as THREE from 'three';

/**
 * Procedural Comic Book Pop-Art Ballast Texture with Halftone Ben-Day Dots & Inking
 */
export function createBallastTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // 1. Comic newsprint / dark ink bed base
  ctx.fillStyle = '#1e2430';
  ctx.fillRect(0, 0, 512, 512);

  // 2. Comic Halftone / Ben-Day dot screen pattern
  const dotSpacing = 16;
  const dotRadius = 3.5;
  for (let x = 0; x < 512; x += dotSpacing) {
    for (let y = 0; y < 512; y += dotSpacing) {
      // Offset alternate rows for comic Ben-Day screen
      const offsetX = (Math.floor(y / dotSpacing) % 2) * (dotSpacing / 2);
      ctx.fillStyle = '#2d3748';
      ctx.beginPath();
      ctx.arc(x + offsetX, y, dotRadius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 3. Stylized comic gravel stipples
  for (let i = 0; i < 800; i++) {
    const rx = Math.random() * 512;
    const ry = Math.random() * 512;
    const size = 1.2 + Math.random() * 2.2;
    ctx.fillStyle = Math.random() > 0.5 ? '#475569' : '#0f172a';
    ctx.beginPath();
    ctx.arc(rx, ry, size, 0, Math.PI * 2);
    ctx.fill();
  }

  // 4. Center oil rail track runner with comic contrast
  const grad = ctx.createLinearGradient(0, 0, 512, 0);
  grad.addColorStop(0, 'rgba(15, 23, 42, 0.4)');
  grad.addColorStop(0.2, 'rgba(15, 23, 42, 0.15)');
  grad.addColorStop(0.5, 'rgba(10, 15, 24, 0.85)'); // central dark comic inking
  grad.addColorStop(0.8, 'rgba(15, 23, 42, 0.15)');
  grad.addColorStop(1, 'rgba(15, 23, 42, 0.4)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 40);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Creates pop-art comic billboard texture with iconic action sound-effects
 */
export function createComicBillboardTexture(phrase: string = 'POW!'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // 1. Comic panel frame (thick black border with newsprint yellow background)
  ctx.fillStyle = '#fffdf0';
  ctx.fillRect(0, 0, 512, 256);

  // 2. Ben-Day dot pattern background in cyan/magenta
  for (let x = 8; x < 504; x += 12) {
    for (let y = 8; y < 248; y += 12) {
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 3. Comic Starburst explosion shape behind text
  ctx.save();
  ctx.translate(256, 128);
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  const points = 16;
  const outerR = 100;
  const innerR = 60;
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const a = (i / (points * 2)) * Math.PI * 2;
    const px = Math.cos(a) * r;
    const py = Math.sin(a) * (r * 0.7);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#000000';
  ctx.stroke();

  // Inner yellow starburst
  ctx.fillStyle = '#facc15';
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = (i % 2 === 0 ? outerR : innerR) * 0.78;
    const a = (i / (points * 2)) * Math.PI * 2;
    const px = Math.cos(a) * r;
    const py = Math.sin(a) * (r * 0.7);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // 4. Action Text with 3D comic shadow
  ctx.font = '900 68px "Impact", "Titan One", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Black block shadow
  ctx.fillStyle = '#000000';
  ctx.fillText(phrase, 260, 134);

  // Black thick outline
  ctx.lineWidth = 12;
  ctx.strokeStyle = '#000000';
  ctx.strokeText(phrase, 256, 128);

  // Gradient text fill
  const textGrad = ctx.createLinearGradient(0, 80, 0, 160);
  textGrad.addColorStop(0, '#ffffff');
  textGrad.addColorStop(0.5, '#fef08a');
  textGrad.addColorStop(1, '#f97316');
  ctx.fillStyle = textGrad;
  ctx.fillText(phrase, 256, 128);

  // 5. Outer thick comic panel border
  ctx.lineWidth = 10;
  ctx.strokeStyle = '#000000';
  ctx.strokeRect(5, 5, 502, 246);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Procedural South African Street Art Graffiti Texture for Trackside Sound Walls
 */
export function createGraffitiTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Concrete wall base with subtle panel joints
  ctx.fillStyle = '#475569';
  ctx.fillRect(0, 0, 1024, 256);

  // Concrete expansion joint lines
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 4;
  for (let x = 0; x <= 1024; x += 128) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 256);
    ctx.stroke();
  }

  // Vibrant Kasi Street Art Graffiti
  // South African colors: green, gold, red, blue, black, white

  // Wildstyle Tag: "KASI RUSH"
  ctx.font = '900 86px Impact, sans-serif';
  ctx.textAlign = 'center';

  // 3D Shadow drop
  ctx.fillStyle = '#0f172a';
  ctx.fillText('KASI RUSH', 260, 150);

  // Outline glow
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 14;
  ctx.strokeText('KASI RUSH', 256, 142);

  // Main fill with cyan/yellow gradient
  const textGrad = ctx.createLinearGradient(0, 60, 0, 150);
  textGrad.addColorStop(0, '#fef08a');
  textGrad.addColorStop(0.5, '#eab308');
  textGrad.addColorStop(1, '#ef4444');
  ctx.fillStyle = textGrad;
  ctx.fillText('KASI RUSH', 256, 142);

  // Wildstyle Tag: "MZANSI SURF"
  ctx.font = '900 80px Impact, sans-serif';
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 14;
  ctx.strokeText('MZANSI SURF', 760, 142);

  const textGrad2 = ctx.createLinearGradient(0, 60, 0, 150);
  textGrad2.addColorStop(0, '#67e8f9');
  textGrad2.addColorStop(0.5, '#06b6d4');
  textGrad2.addColorStop(1, '#2563eb');
  ctx.fillStyle = textGrad2;
  ctx.fillText('MZANSI SURF', 760, 142);

  // African Geometric Pattern Band along bottom
  const colors = ['#eab308', '#059669', '#dc2626', '#2563eb', '#000000'];
  for (let x = 0; x < 1024; x += 32) {
    ctx.fillStyle = colors[(x / 32) % colors.length];
    ctx.beginPath();
    ctx.moveTo(x, 256);
    ctx.lineTo(x + 16, 220);
    ctx.lineTo(x + 32, 256);
    ctx.closePath();
    ctx.fill();
  }

  // Spray paint splatters
  for (let s = 0; s < 120; s++) {
    const rx = Math.random() * 1024;
    const ry = Math.random() * 256;
    const r = Math.random() * 6;
    ctx.fillStyle = ['#38bdf8', '#f43f5e', '#a855f7', '#facc15', '#ffffff'][s % 5];
    ctx.beginPath();
    ctx.arc(rx, ry, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.repeat.set(4, 1);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Procedural Train Front Route Display (Destination sign & warning chevron)
 */
export function createTrainFaceTexture(destinationText: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Dark cab windshield background
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 512, 512);

  // Electronic LED Destination Board
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(60, 40, 392, 90);
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 6;
  ctx.strokeRect(60, 40, 392, 90);

  // Glowing Amber LED destination text
  ctx.font = '900 36px "Courier New", monospace';
  ctx.fillStyle = '#f59e0b';
  ctx.textAlign = 'center';
  ctx.shadowColor = '#f59e0b';
  ctx.shadowBlur = 12;
  ctx.fillText(destinationText.toUpperCase(), 256, 100);
  ctx.shadowBlur = 0;

  // Driver cabin windshield glass reflection
  const glassGrad = ctx.createLinearGradient(0, 150, 512, 340);
  glassGrad.addColorStop(0, 'rgba(56, 189, 248, 0.4)');
  glassGrad.addColorStop(0.4, 'rgba(15, 23, 42, 0.85)');
  glassGrad.addColorStop(0.6, 'rgba(30, 41, 59, 0.9)');
  glassGrad.addColorStop(1, 'rgba(56, 189, 248, 0.2)');
  ctx.fillStyle = glassGrad;
  ctx.fillRect(40, 160, 432, 180);

  // Cab center divider
  ctx.fillStyle = '#334155';
  ctx.fillRect(248, 160, 16, 180);

  // PRASA Cowcatcher yellow hazard stripes on lower apron
  ctx.fillStyle = '#eab308';
  ctx.fillRect(0, 380, 512, 132);
  ctx.fillStyle = '#0f172a';
  for (let x = -80; x < 600; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x, 380);
    ctx.lineTo(x + 36, 380);
    ctx.lineTo(x - 10, 512);
    ctx.lineTo(x - 46, 512);
    ctx.closePath();
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Procedural Orlando Cooling Tower Mural Texture
 */
export function createOrlandoTowerTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Base sky blue
  ctx.fillStyle = '#0284c7';
  ctx.fillRect(0, 0, 512, 512);

  // Colorful South African mural stripes
  const bands = [
    { y: 0, h: 80, c: '#eab308' },
    { y: 80, h: 40, c: '#0f172a' },
    { y: 120, h: 100, c: '#dc2626' },
    { y: 220, h: 60, c: '#10b981' },
    { y: 280, h: 120, c: '#0284c7' },
    { y: 400, h: 112, c: '#eab308' },
  ];

  bands.forEach((b) => {
    ctx.fillStyle = b.c;
    ctx.fillRect(0, b.y, 512, b.h);
  });

  // Large Soweto silhouette graphic
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 64px Impact, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SOWETO', 256, 190);

  // African sunburst rays
  ctx.strokeStyle = '#fef08a';
  ctx.lineWidth = 6;
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
    ctx.beginPath();
    ctx.moveTo(256, 340);
    ctx.lineTo(256 + Math.cos(a) * 120, 340 + Math.sin(a) * 60);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.repeat.set(1, 1);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
