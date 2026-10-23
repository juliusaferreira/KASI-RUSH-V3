import * as THREE from 'three';
import { SouthAfricanCity, CharacterId } from '../types/game';
import { CITIES, TRAIN_HEIGHT, TRAIN_LENGTH } from './constants';
import { createTrainFaceTexture, createOrlandoTowerTexture, createComicBillboardTexture } from './textures';
import { assetManager } from './assetLoader';

/**
 * Creates procedural canvas textures for trains, barriers, and coins
 */
function createHazardTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#eab308';
  ctx.fillRect(0, 0, 256, 64);

  ctx.fillStyle = '#0f172a';
  for (let x = -64; x < 320; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 20, 0);
    ctx.lineTo(x - 10, 64);
    ctx.lineTo(x - 30, 64);
    ctx.closePath();
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

const hazardTexture = createHazardTexture();

export interface PlayerModelRig {
  group: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  hoverboardMesh: THREE.Group;
  jetpackMesh: THREE.Group;
  sneakersGroup: THREE.Group;
  capeMesh?: THREE.Mesh;
  saberBlade?: THREE.Mesh;
  mixer?: THREE.AnimationMixer;
  isCustomGltf?: boolean;
}

/**
 * Creates standard attachments for any character (Hoverboard, Jetpack, Sneakers, Shadow)
 */
function attachStandardGear(group: THREE.Group, isToxicSkull: boolean = false): {
  hoverboardMesh: THREE.Group;
  jetpackMesh: THREE.Group;
  sneakersGroup: THREE.Group;
} {
  // 1. Hoverboard
  const hoverboardMesh = new THREE.Group();
  const deckColor = isToxicSkull ? 0x18181b : 0x059669;
  const rimColor = isToxicSkull ? 0x84cc16 : 0x34d399; // Acid lime green rim for Toxic Skull
  const deck = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.08, 1.8),
    new THREE.MeshStandardMaterial({
      color: deckColor,
      roughness: 0.25,
      metalness: isToxicSkull ? 0.4 : 0.6,
    })
  );
  const neonRim = new THREE.Mesh(
    new THREE.TorusGeometry(0.5, 0.04, 8, 24),
    new THREE.MeshBasicMaterial({ color: rimColor })
  );
  neonRim.rotation.x = Math.PI / 2;
  neonRim.position.y = -0.02;

  // Toxic Skull Deck Graphic Decal & Lime Bumper Strips (matching user reference art)
  if (isToxicSkull) {
    const skullDecal = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.24, 0.02, 16),
      new THREE.MeshBasicMaterial({ color: 0xf8fafc })
    );
    skullDecal.position.y = 0.045;

    const eyeL = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 0.022, 8),
      new THREE.MeshBasicMaterial({ color: 0x090b10 })
    );
    eyeL.position.set(-0.07, 0.046, -0.04);
    const eyeR = eyeL.clone();
    eyeR.position.x = 0.07;
    skullDecal.add(eyeL, eyeR);

    // Toxic Acid-Green Rails
    const railL = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.09, 1.82),
      new THREE.MeshBasicMaterial({ color: 0x84cc16 })
    );
    railL.position.x = -0.44;
    const railR = railL.clone();
    railR.position.x = 0.44;

    hoverboardMesh.add(skullDecal, railL, railR);
  }

  const thrusterL = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.14, 0.25, 12),
    new THREE.MeshStandardMaterial({ color: isToxicSkull ? 0x1f2937 : 0x334155, metalness: 0.8 })
  );
  thrusterL.rotation.x = Math.PI / 2;
  thrusterL.position.set(-0.3, -0.08, -0.75);

  const thrusterR = thrusterL.clone();
  thrusterR.position.x = 0.3;

  hoverboardMesh.add(deck, neonRim, thrusterL, thrusterR);
  hoverboardMesh.position.y = 0.05;
  hoverboardMesh.visible = false;
  group.add(hoverboardMesh);

  // 2. Jetpack
  const jetpackMesh = new THREE.Group();
  const tankL = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.12, 0.7, 12),
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.85, roughness: 0.2 })
  );
  tankL.position.set(-0.18, 1.25, -0.45);
  const tankR = tankL.clone();
  tankR.position.x = 0.18;

  const rocketNozzleL = new THREE.Mesh(
    new THREE.ConeGeometry(0.14, 0.22, 12),
    new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 0.6 })
  );
  rocketNozzleL.position.set(-0.18, 0.8, -0.45);
  const rocketNozzleR = rocketNozzleL.clone();
  rocketNozzleR.position.x = 0.18;

  jetpackMesh.add(tankL, tankR, rocketNozzleL, rocketNozzleR);
  jetpackMesh.visible = false;
  group.add(jetpackMesh);

  // 3. Super Sneakers
  const sneakersGroup = new THREE.Group();
  const springL = new THREE.Mesh(
    new THREE.TorusGeometry(0.12, 0.04, 8, 16),
    new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.7 })
  );
  springL.rotation.x = Math.PI / 2;
  springL.position.set(-0.2, 0.08, 0);
  const springR = springL.clone();
  springR.position.x = 0.2;
  sneakersGroup.add(springL, springR);
  sneakersGroup.visible = false;
  group.add(sneakersGroup);

  // 4. Contact shadow disc
  const shadowGeo = new THREE.CircleGeometry(0.65, 16);
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
  });
  const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.y = 0.02;
  group.add(shadowMesh);

  return { hoverboardMesh, jetpackMesh, sneakersGroup };
}

/**
 * Creates modular limb groups with shoulder/hip pivot standards
 */
function createStandardLimbs(
  armMat: THREE.Material,
  handMat: THREE.Material,
  legMat: THREE.Material,
  shoeMat: THREE.Material,
  shoeScale: [number, number, number] = [0.24, 0.18, 0.42]
): {
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
} {
  // Arms (Pivot at shoulder y = 1.45)
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.46, 1.45, 0);
  const leftArmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.6, 0.18), armMat);
  leftArmMesh.position.y = -0.25;
  const leftHand = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 10), handMat);
  leftHand.position.y = -0.55;
  leftArm.add(leftArmMesh, leftHand);

  const rightArm = new THREE.Group();
  rightArm.position.set(0.46, 1.45, 0);
  const rightArmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.6, 0.18), armMat);
  rightArmMesh.position.y = -0.25;
  const rightHand = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 10), handMat);
  rightHand.position.y = -0.55;
  rightArm.add(rightArmMesh, rightHand);

  // Legs (Pivot at hip y = 0.75)
  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.2, 0.75, 0);
  const leftLegMesh = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.65, 0.22), legMat);
  leftLegMesh.position.y = -0.3;
  const leftShoe = new THREE.Mesh(new THREE.BoxGeometry(...shoeScale), shoeMat);
  leftShoe.position.set(0, -0.65, 0.08);
  leftLeg.add(leftLegMesh, leftShoe);

  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.2, 0.75, 0);
  const rightLegMesh = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.65, 0.22), legMat);
  rightLegMesh.position.y = -0.3;
  const rightShoe = new THREE.Mesh(new THREE.BoxGeometry(...shoeScale), shoeMat);
  rightShoe.position.set(0, -0.65, 0.08);
  rightLeg.add(rightLegMesh, rightShoe);

  return { leftArm, rightArm, leftLeg, rightLeg };
}

/**
 * Helper to add expressive comic eyes with white sclera and black pupils
 */
function addComicEyes(
  headGroup: THREE.Group,
  eyeY: number = 0.04,
  eyeZ: number = 0.24,
  eyeSpacing: number = 0.1,
  eyeScale: number = 0.075
) {
  const whiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const pupilMat = new THREE.MeshBasicMaterial({ color: 0x09090b });

  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(eyeScale, 10, 10), whiteMat);
  eyeL.position.set(-eyeSpacing, eyeY, eyeZ);
  eyeL.scale.set(1.0, 1.25, 0.4);
  const pupilL = new THREE.Mesh(new THREE.SphereGeometry(eyeScale * 0.45, 8, 8), pupilMat);
  pupilL.position.set(-eyeSpacing, eyeY, eyeZ + eyeScale * 0.35);

  const eyeR = new THREE.Mesh(new THREE.SphereGeometry(eyeScale, 10, 10), whiteMat);
  eyeR.position.set(eyeSpacing, eyeY, eyeZ);
  eyeR.scale.set(1.0, 1.25, 0.4);
  const pupilR = new THREE.Mesh(new THREE.SphereGeometry(eyeScale * 0.45, 8, 8), pupilMat);
  pupilR.position.set(eyeSpacing, eyeY, eyeZ + eyeScale * 0.35);

  headGroup.add(eyeL, pupilL, eyeR, pupilR);
}

/**
 * 1. THABO: Black male with backwards red cap, spray-can backpack, headphones, and red hoodie
 */
function createThaboCharacter(outfitColor: string): PlayerModelRig {
  const group = new THREE.Group();
  const skinMat = new THREE.MeshStandardMaterial({ color: 0x6b4226, roughness: 0.6 });
  const hoodieMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(outfitColor), roughness: 0.7 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 }); // Dark denim
  const capMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.5 }); // Red cap
  const sneakerMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 }); // White sneakers
  const redTrimMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });

  // Red Hoodie Torso
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.82, 0.46), hoodieMat);
  torso.position.y = 1.15;
  torso.castShadow = true;
  group.add(torso);

  // Kangaroo pouch pocket on front
  const pouch = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.22, 0.06), redTrimMat);
  pouch.position.set(0, 0.95, 0.24);
  // Hoodie drawstrings hanging down
  const stringL = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.22, 6), sneakerMat);
  stringL.position.set(-0.08, 1.28, 0.25);
  const stringR = stringL.clone();
  stringR.position.x = 0.08;
  group.add(pouch, stringL, stringR);

  // Streetwear Backpack on the back
  const backpackGroup = new THREE.Group();
  backpackGroup.position.set(0, 1.18, -0.32);
  const backpackBody = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.62, 0.26), darkMat);
  const backpackPocket = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.32, 0.08), redTrimMat);
  backpackPocket.position.set(0, -0.1, -0.16);

  // Spray-can mounted in backpack side holster
  const sprayCan = new THREE.Group();
  sprayCan.position.set(0.32, -0.05, 0);
  const canBody = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.3, 12), new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.85, roughness: 0.2 }));
  const canCap = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.062, 0.09, 12), capMat);
  canCap.position.y = 0.16;
  const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.04, 8), new THREE.MeshStandardMaterial({ color: 0xffffff }));
  nozzle.position.set(0, 0.22, 0.02);
  sprayCan.add(canBody, canCap, nozzle);

  // Dual backpack shoulder straps
  const strapL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.65, 0.04), darkMat);
  strapL.position.set(-0.22, 0, 0.28);
  const strapR = strapL.clone();
  strapR.position.x = 0.22;

  backpackGroup.add(backpackBody, backpackPocket, sprayCan, strapL, strapR);
  group.add(backpackGroup);

  // Head with Backwards Red Cap & DJ Headphones
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.75, 0);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 16), skinMat);
  headGroup.add(head);

  addComicEyes(headGroup, 0.02, 0.24, 0.09, 0.07);

  // Friendly smile
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.012, 6, 12, Math.PI), new THREE.MeshBasicMaterial({ color: 0x18181b }));
  smile.rotation.x = Math.PI;
  smile.position.set(0, -0.11, 0.23);
  headGroup.add(smile);

  // Backwards Red Cap: Dome + visor facing BACKWARD
  const capDome = new THREE.Mesh(new THREE.SphereGeometry(0.27, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), capMat);
  capDome.position.y = 0.05;
  capDome.rotation.x = 0.12;
  const capButton = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), sneakerMat);
  capButton.position.set(0, 0.32, -0.02);
  const capVisor = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.035, 0.28), capMat);
  capVisor.position.set(0, 0.09, -0.34);
  capVisor.rotation.x = -0.22;
  headGroup.add(capDome, capButton, capVisor);

  // Over-Ear DJ Headphones
  const phoneMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.3, metalness: 0.2 });
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.29, 0.03, 8, 20, Math.PI * 1.1), phoneMat);
  band.rotation.z = -Math.PI * 0.55;
  band.position.set(0, 0.06, 0);
  const cupL = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.08, 12), phoneMat);
  cupL.rotation.z = Math.PI / 2;
  cupL.position.set(-0.28, 0.02, 0);
  const cupR = cupL.clone();
  cupR.position.x = 0.28;
  headGroup.add(band, cupL, cupR);
  group.add(headGroup);

  // Limbs with Red & White high-top comic sneakers
  const limbs = createStandardLimbs(hoodieMat, skinMat, pantsMat, sneakerMat);
  // Red sneaker toe caps
  [-0.2, 0.2].forEach((x, i) => {
    const parentLeg = i === 0 ? limbs.leftLeg : limbs.rightLeg;
    const toeCap = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.1, 0.16), redTrimMat);
    toeCap.position.set(0, -0.68, 0.22);
    parentLeg.add(toeCap);
  });

  group.add(limbs.leftArm, limbs.rightArm, limbs.leftLeg, limbs.rightLeg);
  const gear = attachStandardGear(group);

  return { group, ...limbs, ...gear };
}

/**
 * 2. PIETER: White male with horn-rimmed glasses (cyan tinted glare), pocket protector with red pen, and khakis
 */
function createPieterCharacter(outfitColor: string): PlayerModelRig {
  const group = new THREE.Group();
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xffe0bd, roughness: 0.5 });
  const sweaterMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(outfitColor), roughness: 0.7 });
  const shirtWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: 0xd4a373, roughness: 0.8 }); // Khakis
  const shoeMat = new THREE.MeshStandardMaterial({ color: 0x5c3a21, roughness: 0.4 }); // Brown oxfords
  const beltMat = new THREE.MeshStandardMaterial({ color: 0x3d2314, roughness: 0.5 });

  // Blue Sweater Torso with white collared shirt underneath
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.8, 0.44), sweaterMat);
  torso.position.y = 1.15;
  group.add(torso);

  // White shirt collar peeking out
  const collarL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 0.04), shirtWhiteMat);
  collarL.position.set(-0.1, 1.54, 0.22);
  collarL.rotation.z = 0.25;
  const collarR = collarL.clone();
  collarR.position.x = 0.1;
  collarR.rotation.z = -0.25;
  group.add(collarL, collarR);

  // White Pocket Protector with red ballpoint pen and blue pencil!
  const pocketProtector = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.22, 0.04), shirtWhiteMat);
  pocketProtector.position.set(0.18, 1.28, 0.23);
  const redPen = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.14, 8), new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.3 }));
  redPen.position.set(0.15, 1.38, 0.26);
  const redPenClip = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.08, 0.02), new THREE.MeshStandardMaterial({ color: 0xc0c0c0, metalness: 0.9 }));
  redPenClip.position.set(0.15, 1.38, 0.28);
  const bluePen = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.13, 8), new THREE.MeshStandardMaterial({ color: 0x2563eb, metalness: 0.3 }));
  bluePen.position.set(0.21, 1.36, 0.26);
  group.add(pocketProtector, redPen, redPenClip, bluePen);

  // Brown Belt with brass buckle
  const belt = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.08, 0.46), beltMat);
  belt.position.set(0, 0.77, 0);
  const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.1, 0.04), new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.85 }));
  buckle.position.set(0, 0.77, 0.24);
  group.add(belt, buckle);

  // Head with neatly parted brown hair & horn-rimmed glasses
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.75, 0);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 16), skinMat);
  headGroup.add(head);

  addComicEyes(headGroup, 0.03, 0.23, 0.09, 0.07);

  // Neat side-parted brown hair
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x45220c, roughness: 0.6 });
  const hairDome = new THREE.Mesh(new THREE.SphereGeometry(0.27, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.52), hairMat);
  hairDome.position.set(0, 0.07, -0.02);
  const bangs = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.08, 0.1), hairMat);
  bangs.position.set(-0.06, 0.18, 0.22);
  bangs.rotation.z = -0.15;
  headGroup.add(hairDome, bangs);

  // Horn-Rimmed Glasses with CYAN TINTED GLARE & white highlight glint!
  const glasses = new THREE.Group();
  glasses.position.set(0, 0.03, 0.25);
  const frameMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
  const lensCyanMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.7 });
  const glintMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

  [-0.1, 0.1].forEach((gx) => {
    // Outer black rim frame
    const rim = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.13, 0.03), frameMat);
    rim.position.x = gx;
    // Cyan tinted glare lens
    const lens = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.1, 0.035), lensCyanMat);
    lens.position.x = gx;
    // Comic white glare glint diagonal stripe
    const glint = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.09, 0.038), glintMat);
    glint.position.set(gx + 0.02, 0.01, 0);
    glint.rotation.z = -Math.PI / 4;
    glasses.add(rim, lens, glint);
  });
  // Glasses bridge & side temples
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.03, 0.03), frameMat);
  const templeL = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, 0.24), frameMat);
  templeL.position.set(-0.2, 0.02, -0.1);
  const templeR = templeL.clone();
  templeR.position.x = 0.2;
  glasses.add(bridge, templeL, templeR);
  headGroup.add(glasses);
  group.add(headGroup);

  // Limbs: rolled sweater sleeves, brown leather wristwatch, Khaki trousers & brown oxfords
  const limbs = createStandardLimbs(sweaterMat, skinMat, pantsMat, shoeMat);

  // Wristwatch on left wrist
  const watch = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.04, 10), new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8 }));
  watch.position.set(0, -0.48, 0);
  limbs.leftArm.add(watch);

  group.add(limbs.leftArm, limbs.rightArm, limbs.leftLeg, limbs.rightLeg);
  const gear = attachStandardGear(group);

  return { group, ...limbs, ...gear };
}

/**
 * 3. MELANIE: White female with high heels and blonde hair, runner tights
 */
function createMelanieCharacter(outfitColor: string): PlayerModelRig {
  const group = new THREE.Group();
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xffeedd, roughness: 0.45 });
  const topMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(outfitColor), roughness: 0.5 }); // Fuchsia / Rose
  const tightsMat = new THREE.MeshStandardMaterial({ color: 0x1e1b4b, roughness: 0.7 }); // Navy runner tights
  const heelMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.2, metalness: 0.4 }); // Ruby Red stilettos
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.85, roughness: 0.2 });

  // Slender Athletic Crop Jacket / Tank
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.74, 0.38), topMat);
  torso.position.y = 1.15;
  // White racing piping stripes on sides
  const stripeL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.74, 0.4), new THREE.MeshStandardMaterial({ color: 0xffffff }));
  stripeL.position.x = -0.3;
  const stripeR = stripeL.clone();
  stripeR.position.x = 0.3;
  group.add(torso, stripeL, stripeR);

  // Head with Glamorous High Blonde Ponytail & Eyelashes
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.75, 0);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 16), skinMat);
  headGroup.add(head);

  addComicEyes(headGroup, 0.03, 0.23, 0.08, 0.065);

  // Ruby lipstick smile
  const lips = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.025, 0.04), new THREE.MeshBasicMaterial({ color: 0xe11d48 }));
  lips.position.set(0, -0.09, 0.23);
  headGroup.add(lips);

  // Gold ear studs
  const studL = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), goldMat);
  studL.position.set(-0.25, 0.01, 0);
  const studR = studL.clone();
  studR.position.x = 0.25;
  headGroup.add(studL, studR);

  // Golden Blonde Hair with swept-high ponytail
  const blondeMat = new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.4 });
  const hairDome = new THREE.Mesh(new THREE.SphereGeometry(0.26, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), blondeMat);
  hairDome.position.y = 0.04;

  // High Ponytail swept backwards
  const ponyGroup = new THREE.Group();
  ponyGroup.position.set(0, 0.2, -0.18);
  const scrunchie = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.035, 8, 16), new THREE.MeshBasicMaterial({ color: 0xf43f5e }));
  scrunchie.rotation.x = 0.5;
  const ponytailTail = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.18, 0.55, 12), blondeMat);
  ponytailTail.rotation.x = -0.65;
  ponytailTail.position.set(0, -0.08, -0.18);
  ponyGroup.add(scrunchie, ponytailTail);
  headGroup.add(hairDome, ponyGroup);
  group.add(headGroup);

  // Limbs with Slender High Heels & Stilettos
  const limbs = createStandardLimbs(topMat, skinMat, tightsMat, heelMat, [0.18, 0.18, 0.38]);

  // Pointed Ruby Stiletto Heels & Gold Ankle Straps
  [-0.2, 0.2].forEach((x, i) => {
    const parentLeg = i === 0 ? limbs.leftLeg : limbs.rightLeg;

    // Slender pointed stiletto heel post extending down
    const stilettoSpike = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.035, 0.2, 8), heelMat);
    stilettoSpike.position.set(0, -0.74, -0.06);

    // Gold ankle strap
    const ankleStrap = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.04, 0.24), goldMat);
    ankleStrap.position.set(0, -0.56, 0.04);

    // Arched pointed red sole
    const toePoint = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.18, 8), heelMat);
    toePoint.rotation.x = Math.PI / 2;
    toePoint.position.set(0, -0.66, 0.28);

    parentLeg.add(stilettoSpike, ankleStrap, toePoint);
  });

  group.add(limbs.leftArm, limbs.rightArm, limbs.leftLeg, limbs.rightLeg);
  const gear = attachStandardGear(group);

  return { group, ...limbs, ...gear };
}

/**
 * 4. KARABO: Black female with African box braids, golden cuffs, gold hoop earrings, and bead necklace
 */
function createKaraboCharacter(outfitColor: string): PlayerModelRig {
  const group = new THREE.Group();
  const skinMat = new THREE.MeshStandardMaterial({ color: 0x3d2314, roughness: 0.5 });
  const topMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(outfitColor), roughness: 0.6 }); // Purple runner top
  const tightsMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.7 }); // Electric cyan tights
  const shoeMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3 }); // Gold sneakers
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.9, roughness: 0.15 });

  // Vibrant African Pattern Top
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.74, 0.4), topMat);
  torso.position.y = 1.15;
  // Gold geometric border sash
  const sash = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.12, 0.42), goldMat);
  sash.position.set(0, 0.85, 0);
  group.add(torso, sash);

  // Multi-Tiered Traditional African Beaded Collar Necklace
  const beadColors = [0xf59e0b, 0x10b981, 0xef4444, 0xfacc15];
  beadColors.forEach((color, idx) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.22 + idx * 0.03, 0.022, 6, 18),
      new THREE.MeshStandardMaterial({ color, roughness: 0.3 })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.set(0, 1.48 - idx * 0.05, 0.04);
    group.add(ring);
  });

  // Head with Box Braids, Gold Cuffs, and Gold Hoop Earrings
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.75, 0);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 16), skinMat);
  headGroup.add(head);

  addComicEyes(headGroup, 0.02, 0.24, 0.085, 0.07);

  // Large Gold Hoop Earrings
  [-0.28, 0.28].forEach((gx) => {
    const hoop = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.016, 8, 16), goldMat);
    hoop.position.set(gx, -0.06, 0);
    hoop.rotation.y = Math.PI / 2;
    headGroup.add(hoop);
  });

  // African Box Braids cascading with metallic golden cuffs
  const braidMat = new THREE.MeshStandardMaterial({ color: 0x111118, roughness: 0.75 });
  // Dome base of braided hair
  const hairBase = new THREE.Mesh(new THREE.SphereGeometry(0.27, 14, 12, 0, Math.PI * 2, 0, Math.PI * 0.52), braidMat);
  hairBase.position.y = 0.04;
  headGroup.add(hairBase);

  // 14 individual cascading box braids with gold cuffs!
  for (let b = -3; b <= 3; b++) {
    const xPos = b * 0.07;
    // Front/side braids
    const braidF = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.02, 0.7, 8), braidMat);
    braidF.position.set(xPos, -0.22, -0.16 - Math.abs(b) * 0.03);
    braidF.rotation.x = 0.22;
    braidF.rotation.z = b * 0.05;

    // Golden cuffs clamped on the braids at two intervals!
    const cuff1 = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.034, 0.05, 8), goldMat);
    cuff1.position.y = -0.12;
    const cuff2 = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.05, 8), goldMat);
    cuff2.position.y = -0.26;
    braidF.add(cuff1, cuff2);
    headGroup.add(braidF);

    // Back braids
    const braidB = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.02, 0.65, 8), braidMat);
    braidB.position.set(xPos * 0.9, -0.2, -0.24);
    braidB.rotation.x = -0.15;
    const cuffB = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.034, 0.05, 8), goldMat);
    cuffB.position.y = -0.18;
    braidB.add(cuffB);
    headGroup.add(braidB);
  }
  group.add(headGroup);

  // Limbs with cyan runner tights and golden sneakers
  const limbs = createStandardLimbs(topMat, skinMat, tightsMat, shoeMat);

  // Gold bangles on right wrist
  const bangle = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.015, 6, 12), goldMat);
  bangle.rotation.x = Math.PI / 2;
  bangle.position.set(0, -0.48, 0);
  limbs.rightArm.add(bangle);

  group.add(limbs.leftArm, limbs.rightArm, limbs.leftLeg, limbs.rightLeg);
  const gear = attachStandardGear(group);

  return { group, ...limbs, ...gear };
}

/**
 * 5. SKELETON: Comic skeleton with animated skull, eye sockets, 3D ribcage, spine, and pelvis
 */
function createSkeletonCharacter(): PlayerModelRig {
  const group = new THREE.Group();
  const boneMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.35 });
  const darkCavityMat = new THREE.MeshBasicMaterial({ color: 0x05070e });
  const eerieGlowMat = new THREE.MeshBasicMaterial({ color: 0x22c55e }); // Eerie green comic eye glow

  // Central Spinal Vertebrae Column
  const spine = new THREE.Group();
  spine.position.y = 1.15;
  for (let v = 0; v < 6; v++) {
    const vert = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.08, 8), boneMat);
    vert.position.y = -0.3 + v * 0.12;
    spine.add(vert);
  }
  group.add(spine);

  // 3D Ribcage: 5 curved 3D rib pairs wrapping around torso from spine to sternum!
  for (let r = 0; r < 5; r++) {
    const ribL = new THREE.Mesh(new THREE.TorusGeometry(0.24 - r * 0.015, 0.026, 6, 16, Math.PI * 0.85), boneMat);
    ribL.rotation.z = Math.PI * 0.55;
    ribL.rotation.x = Math.PI / 2 + 0.1;
    ribL.position.set(-0.06, 1.38 - r * 0.11, 0.02);

    const ribR = new THREE.Mesh(new THREE.TorusGeometry(0.24 - r * 0.015, 0.026, 6, 16, Math.PI * 0.85), boneMat);
    ribR.rotation.z = -Math.PI * 0.55;
    ribR.rotation.x = Math.PI / 2 + 0.1;
    ribR.position.set(0.06, 1.38 - r * 0.11, 0.02);

    group.add(ribL, ribR);
  }

  // Sternum chest bone
  const sternum = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.52, 0.04), boneMat);
  sternum.position.set(0, 1.18, 0.22);
  // Clavicle collarbones
  const clavicle = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.72, 8), boneMat);
  clavicle.rotation.z = Math.PI / 2;
  clavicle.position.set(0, 1.45, 0.05);
  // Broad Pelvic Girdle Bone
  const pelvis = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.2, 0.3), boneMat);
  pelvis.position.y = 0.76;
  const pelvisHoleL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.32), darkCavityMat);
  pelvisHoleL.position.set(-0.14, 0.76, 0);
  const pelvisHoleR = pelvisHoleL.clone();
  pelvisHoleR.position.x = 0.14;
  group.add(sternum, clavicle, pelvis, pelvisHoleL, pelvisHoleR);

  // 3D Comic Skull with hollow eye sockets and smiling jaw with teeth
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.76, 0);
  const cranium = new THREE.Mesh(new THREE.SphereGeometry(0.26, 16, 16), boneMat);
  cranium.scale.set(1.0, 1.15, 1.05);
  headGroup.add(cranium);

  // Hollow Orbital Eye Sockets with eerie glowing green pupils
  [-0.1, 0.1].forEach((gx) => {
    const socket = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 10), darkCavityMat);
    socket.position.set(gx, 0.05, 0.23);
    socket.scale.set(1.0, 1.1, 0.5);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), eerieGlowMat);
    pupil.position.set(gx, 0.05, 0.26);
    headGroup.add(socket, pupil);
  });

  // Triangular Nasal Cavity
  const nasal = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.09, 4), darkCavityMat);
  nasal.rotation.x = Math.PI;
  nasal.position.set(0, -0.05, 0.26);
  headGroup.add(nasal);

  // Skeletal smiling jaw with teeth
  const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.1, 0.16), boneMat);
  jaw.position.set(0, -0.18, 0.16);
  // Individual teeth row
  const teeth = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.04, 0.18), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  teeth.position.set(0, -0.13, 0.17);
  headGroup.add(jaw, teeth);
  group.add(headGroup);

  // Skeletal Boney Limbs with phalanges
  const limbs = createStandardLimbs(boneMat, boneMat, boneMat, boneMat, [0.18, 0.1, 0.36]);
  group.add(limbs.leftArm, limbs.rightArm, limbs.leftLeg, limbs.rightLeg);
  const gear = attachStandardGear(group);

  return { group, ...limbs, ...gear };
}

/**
 * 6. SUPERHERO: Caped male hero matching the user reference image with tapered blue suit, golden chest shield, domino mask, and a flowing crimson cape
 */
function createSuperheroCharacter(outfitColor: string): PlayerModelRig {
  const group = new THREE.Group();
  const suitMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(outfitColor), roughness: 0.5 }); // Royal Blue
  const capeMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.6, side: THREE.DoubleSide }); // Crimson
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.8, roughness: 0.25 }); // Gold
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xffe0bd, roughness: 0.5 });
  const redMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 }); // Hero Trunks & Boots

  // Heroic Muscular Torso with broad chest & tapered waist
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.86, 0.5), suitMat);
  torso.position.y = 1.18;
  group.add(torso);

  // Golden Chest Shield Crest with Crimson Emblem inside (Matches user reference!)
  const shieldCrest = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.36, 0.06), goldMat);
  shieldCrest.rotation.z = Math.PI / 4;
  shieldCrest.position.set(0, 1.32, 0.26);
  const innerEmblem = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.07), redMat);
  innerEmblem.rotation.z = Math.PI / 4;
  innerEmblem.position.set(0, 1.32, 0.265);
  group.add(shieldCrest, innerEmblem);

  // Red Hero Trunks & Gold Utility Belt
  const trunks = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.22, 0.48), redMat);
  trunks.position.set(0, 0.74, 0);
  const belt = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.1, 0.52), goldMat);
  belt.position.set(0, 0.8, 0);
  const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.04), new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.9 }));
  buckle.position.set(0, 0.8, 0.27);
  group.add(trunks, belt, buckle);

  // Head with Black Domino Hero Mask & Glowing White Eyes
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.82, 0);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 16, 16), skinMat);
  headGroup.add(head);

  // Hero Black Hair with stylized front wave
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5), new THREE.MeshStandardMaterial({ color: 0x09090b }));
  hair.position.set(0, 0.06, -0.02);
  const hairCurl = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), new THREE.MeshStandardMaterial({ color: 0x09090b }));
  hairCurl.position.set(0.02, 0.2, 0.24);
  headGroup.add(hair, hairCurl);

  // Black Domino Mask with Glowing White Eyes
  const maskMat = new THREE.MeshBasicMaterial({ color: 0x05070e });
  const eyeGlowMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const mask = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.13, 0.06), maskMat);
  mask.position.set(0, 0.05, 0.25);
  const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.04, 0.07), eyeGlowMat);
  eyeL.position.set(-0.1, 0.05, 0.255);
  const eyeR = eyeL.clone();
  eyeR.position.x = 0.1;
  headGroup.add(mask, eyeL, eyeR);
  group.add(headGroup);

  // Flowing Crimson Superhero Cape!
  const capeGeo = new THREE.PlaneGeometry(0.9, 1.45, 8, 8);
  const capeMesh = new THREE.Mesh(capeGeo, capeMat);
  capeMesh.position.set(0, 1.45, -0.28);
  capeMesh.rotation.x = 0.25;

  // Gold cape clasps on shoulders
  const claspL = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), goldMat);
  claspL.position.set(-0.35, 1.55, -0.05);
  const claspR = claspL.clone();
  claspR.position.x = 0.35;
  group.add(capeMesh, claspL, claspR);

  // Limbs with Tall Red Hero Boots
  const limbs = createStandardLimbs(suitMat, skinMat, suitMat, redMat, [0.26, 0.32, 0.46]);
  // Gold boot trim cuffs
  [-0.2, 0.2].forEach((x, i) => {
    const parentLeg = i === 0 ? limbs.leftLeg : limbs.rightLeg;
    const bootCuff = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.06, 0.28), goldMat);
    bootCuff.position.set(0, -0.46, 0);
    parentLeg.add(bootCuff);
  });

  group.add(limbs.leftArm, limbs.rightArm, limbs.leftLeg, limbs.rightLeg);
  const gear = attachStandardGear(group);

  return { group, ...limbs, ...gear, capeMesh };
}

/**
 * 7. PICKLE: Remake of the famous Pickle Rick with cylindrical warty green pickle body, mad scientist grin with teeth, and cartoon brow
 */
function createPickleCharacter(): PlayerModelRig {
  const group = new THREE.Group();
  const pickleGreen = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.65 });
  const wartMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8 });
  const darkMouthMat = new THREE.MeshBasicMaterial({ color: 0x090d16 });
  const teethMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const tongueMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e });
  const strapMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 }); // Leather wraps

  // Cylindrical Pickle Body with hemispherical top and bottom
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.38, 1.35, 18), pickleGreen);
  body.position.y = 1.15;
  const topCap = new THREE.Mesh(new THREE.SphereGeometry(0.36, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.5), pickleGreen);
  topCap.position.y = 1.82;
  const bottomCap = new THREE.Mesh(new THREE.SphereGeometry(0.38, 18, 12, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.5), pickleGreen);
  bottomCap.position.y = 0.48;
  group.add(body, topCap, bottomCap);

  // 16 Raised Bumpy Warts/Nodules scattered around pickle body
  for (let w = 0; w < 16; w++) {
    const wart = new THREE.Mesh(new THREE.SphereGeometry(0.045 + (w % 3) * 0.02, 8, 8), wartMat);
    const angle = (w / 16) * Math.PI * 2;
    const wy = 0.65 + (w % 8) * 0.15;
    wart.position.set(Math.cos(angle) * 0.38, wy, Math.sin(angle) * 0.38);
    group.add(wart);
  }

  // Giant Unhinged Mad Scientist Grin with teeth and pink tongue
  const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.18, 0.1), darkMouthMat);
  mouth.position.set(0, 1.45, 0.35);
  // Upper teeth row
  const topTeeth = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.045, 0.11), teethMat);
  topTeeth.position.set(0, 1.51, 0.35);
  // Lower teeth row
  const bottomTeeth = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.045, 0.11), teethMat);
  bottomTeeth.position.set(0, 1.39, 0.35);
  // Tongue inside
  const tongue = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.04, 0.08), tongueMat);
  tongue.position.set(0, 1.41, 0.36);
  group.add(mouth, topTeeth, bottomTeeth, tongue);

  // Bulging Crazy Cartoon Eyeballs with tiny black pupils
  const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const pupilMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
  [-0.14, 0.14].forEach((gx) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 12), eyeWhiteMat);
    eye.position.set(gx, 1.66, 0.34);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), pupilMat);
    pupil.position.set(gx, 1.66, 0.44);
    group.add(eye, pupil);
  });

  // Furrowed Mad Genius Unibrow
  const browMat = new THREE.MeshBasicMaterial({ color: 0x14532d });
  const browL = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.06, 0.08), browMat);
  browL.position.set(-0.11, 1.77, 0.36);
  browL.rotation.z = -0.22;
  const browR = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.06, 0.08), browMat);
  browR.position.set(0.11, 1.77, 0.36);
  browR.rotation.z = 0.22;
  group.add(browL, browR);

  // Renegade strapped limbs
  const limbMat = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.7 });
  const limbs = createStandardLimbs(limbMat, pickleGreen, limbMat, limbMat);

  // Leather wraps on wrists and ankles
  [limbs.leftArm, limbs.rightArm, limbs.leftLeg, limbs.rightLeg].forEach((limb) => {
    const strap = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 10), strapMat);
    strap.position.y = -0.45;
    limb.add(strap);
  });

  group.add(limbs.leftArm, limbs.rightArm, limbs.leftLeg, limbs.rightLeg);
  const gear = attachStandardGear(group);

  return { group, ...limbs, ...gear };
}

/**
 * 8. ARMY MAN: Camo tactical vest, ammo pouches, dog tags, and Kevlar helmet with chin strap
 */
function createArmyCharacter(outfitColor: string): PlayerModelRig {
  const group = new THREE.Group();
  const camoVestMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(outfitColor), roughness: 0.8 }); // Olive camo
  const camoFatigueMat = new THREE.MeshStandardMaterial({ color: 0x3f6212, roughness: 0.8 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xcaa382, roughness: 0.6 });
  const bootMat = new THREE.MeshStandardMaterial({ color: 0x171717, roughness: 0.5 }); // Black assault boots
  const helmetMat = new THREE.MeshStandardMaterial({ color: 0x365314, roughness: 0.6 }); // Dark olive helmet
  const pouchMat = new THREE.MeshStandardMaterial({ color: 0x1a2e05, roughness: 0.8 });
  const silverMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.1 });

  // Heavy Tactical MOLLE Plate Carrier Vest
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.82, 0.48), camoVestMat);
  torso.position.y = 1.15;
  group.add(torso);

  // 3 Ammo Magazine Pouches on front
  [-0.2, 0, 0.2].forEach((px) => {
    const pouch = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.22, 0.08), pouchMat);
    pouch.position.set(px, 1.05, 0.27);
    const flap = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.06, 0.09), new THREE.MeshStandardMaterial({ color: 0x14532d }));
    flap.position.set(px, 1.18, 0.27);
    group.add(pouch, flap);
  });

  // Dual Shiny Silver Dog Tags hanging on ball-chain around neck
  const chain = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.012, 6, 16), silverMat);
  chain.rotation.x = Math.PI / 2;
  chain.position.set(0, 1.48, 0.12);
  const tag1 = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.11, 0.015), silverMat);
  tag1.position.set(-0.02, 1.34, 0.25);
  const tag2 = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.11, 0.015), silverMat);
  tag2.position.set(0.03, 1.32, 0.26);
  tag2.rotation.z = -0.15;
  group.add(chain, tag1, tag2);

  // Head with Military Combat Kevlar Helmet & Chin Strap
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.75, 0);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 16), skinMat);
  headGroup.add(head);

  addComicEyes(headGroup, 0.02, 0.23, 0.085, 0.065);

  // Camo war-paint marks on cheeks
  const paintMat = new THREE.MeshBasicMaterial({ color: 0x14532d });
  const paintL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.03, 0.02), paintMat);
  paintL.position.set(-0.16, -0.04, 0.22);
  const paintR = paintL.clone();
  paintR.position.x = 0.16;
  headGroup.add(paintL, paintR);

  // Kevlar Helmet with rim and chin strap
  const helmetDome = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.6), helmetMat);
  helmetDome.position.y = 0.05;
  const helmetRim = new THREE.Mesh(new THREE.TorusGeometry(0.29, 0.035, 6, 20), helmetMat);
  helmetRim.rotation.x = Math.PI / 2;
  helmetRim.position.y = -0.06;

  // Chin strap buckled under the jaw
  const strapMat = new THREE.MeshBasicMaterial({ color: 0x171717 });
  const strapL = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.24, 6), strapMat);
  strapL.position.set(-0.25, -0.12, 0.05);
  strapL.rotation.z = -0.25;
  const strapR = strapL.clone();
  strapR.position.x = 0.25;
  strapR.rotation.z = 0.25;
  const chinCup = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 0.08), strapMat);
  chinCup.position.set(0, -0.22, 0.15);
  headGroup.add(helmetDome, helmetRim, strapL, strapR, chinCup);
  group.add(headGroup);

  // Limbs with camo fatigues, kneepads, and heavy combat boots
  const limbs = createStandardLimbs(camoFatigueMat, skinMat, camoFatigueMat, bootMat, [0.26, 0.28, 0.48]);
  // Tactical black knee pads
  [-0.2, 0.2].forEach((x, i) => {
    const parentLeg = i === 0 ? limbs.leftLeg : limbs.rightLeg;
    const kneepad = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.16, 0.1), new THREE.MeshStandardMaterial({ color: 0x171717 }));
    kneepad.position.set(0, -0.32, 0.14);
    parentLeg.add(kneepad);
  });

  group.add(limbs.leftArm, limbs.rightArm, limbs.leftLeg, limbs.rightLeg);
  const gear = attachStandardGear(group);

  return { group, ...limbs, ...gear };
}

/**
 * 9. BARBIE: Blonde fashion doll with hot pink crop top, gold star belt, cat-eye sunglasses, and platform heels
 */
function createBarbieCharacter(outfitColor: string): PlayerModelRig {
  const group = new THREE.Group();
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xffdfd3, roughness: 0.4 });
  const pinkMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(outfitColor), roughness: 0.35 }); // Hot Pink
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.85, roughness: 0.2 }); // Gold star
  const platformMat = new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.3 }); // Platform pink

  // Glamorous Hot Pink Crop Top showing midriff
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.72, 0.38), pinkMat);
  torso.position.y = 1.15;
  // Midriff skin zone
  const midriff = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.12, 0.36), skinMat);
  midriff.position.set(0, 0.86, 0);
  group.add(torso, midriff);

  // Metallic Gold Belt with 3D Golden Star Buckle
  const belt = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.08, 0.4), goldMat);
  belt.position.set(0, 0.78, 0);
  // 3D 5-Point Golden Star Buckle
  const starCenter = new THREE.Mesh(new THREE.DodecahedronGeometry(0.08, 0), goldMat);
  starCenter.position.set(0, 0.78, 0.22);
  const starPoint1 = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.12, 4), goldMat);
  starPoint1.position.set(0, 0.85, 0.22);
  const starPoint2 = starPoint1.clone();
  starPoint2.rotation.z = Math.PI;
  starPoint2.position.y = 0.71;
  group.add(belt, starCenter, starPoint1, starPoint2);

  // Head with Platinum Blonde Ponytail and Cat-Eye Shades
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.75, 0);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 16), skinMat);
  headGroup.add(head);

  // Doll Smile
  const lips = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.025, 0.03), new THREE.MeshBasicMaterial({ color: 0xec4899 }));
  lips.position.set(0, -0.09, 0.23);
  headGroup.add(lips);

  // Platinum Blonde Hair with high ponytail
  const blondeMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.35 });
  const hairDome = new THREE.Mesh(new THREE.SphereGeometry(0.26, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), blondeMat);
  hairDome.position.y = 0.04;
  const ponyGroup = new THREE.Group();
  ponyGroup.position.set(0, 0.18, -0.16);
  const bow = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.03, 6, 12), pinkMat);
  const ponyTail = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.18, 0.52, 10), blondeMat);
  ponyTail.rotation.x = -0.6;
  ponyTail.position.set(0, -0.08, -0.18);
  ponyGroup.add(bow, ponyTail);
  headGroup.add(hairDome, ponyGroup);

  // Retro Hot-Pink Cat-Eye Sunglasses
  const shadesMat = new THREE.MeshBasicMaterial({ color: 0xec4899 });
  const lensDarkMat = new THREE.MeshBasicMaterial({ color: 0x1f2937 });
  const shades = new THREE.Group();
  shades.position.set(0, 0.04, 0.24);
  [-0.1, 0.1].forEach((sx) => {
    // Cat-eye wing shape
    const wing = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.09, 0.04), shadesMat);
    wing.position.x = sx;
    wing.rotation.z = sx > 0 ? -0.18 : 0.18;
    const lens = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.045), lensDarkMat);
    lens.position.x = sx;
    shades.add(wing, lens);
  });
  const shadeBridge = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.03, 0.03), shadesMat);
  shades.add(shadeBridge);
  headGroup.add(shades);
  group.add(headGroup);

  // Limbs with Hot Pink Leggings and Platform Heels
  const limbs = createStandardLimbs(pinkMat, skinMat, pinkMat, platformMat, [0.22, 0.28, 0.4]);

  // Chunky Platform elevated soles & elevated block heels
  [-0.2, 0.2].forEach((x, i) => {
    const parentLeg = i === 0 ? limbs.leftLeg : limbs.rightLeg;
    // Front platform sole
    const platSole = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.12, 0.22), platformMat);
    platSole.position.set(0, -0.72, 0.14);
    // Elevated block heel behind
    const blockHeel = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.16), platformMat);
    blockHeel.position.set(0, -0.74, -0.06);
    parentLeg.add(platSole, blockHeel);
  });

  group.add(limbs.leftArm, limbs.rightArm, limbs.leftLeg, limbs.rightLeg);
  const gear = attachStandardGear(group);

  return { group, ...limbs, ...gear };
}

/**
 * 10. JEDI: Jedi Master in hooded brown cowl robes, beige undertunic, utility belt, and an ignited glowing cyan lightsaber
 */
function createJediCharacter(outfitColor: string): PlayerModelRig {
  const group = new THREE.Group();
  const robeMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(outfitColor), roughness: 0.8 }); // Earthy brown robes
  const tunicMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.7 }); // Beige undertunic
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xffe0bd, roughness: 0.5 });
  const beltMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.6 }); // Leather utility belt
  const bootMat = new THREE.MeshStandardMaterial({ color: 0x3d2314, roughness: 0.6 }); // Tall brown Jedi boots
  const silverMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9 });

  // Jedi Outer Robe & Undertunic Torso
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.86, 0.48), robeMat);
  torso.position.y = 1.15;
  group.add(torso);

  // Crossed Beige V-Neck Undertunic
  const tunicL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.55, 0.05), tunicMat);
  tunicL.position.set(-0.08, 1.25, 0.25);
  tunicL.rotation.z = -0.15;
  const tunicR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.55, 0.05), tunicMat);
  tunicR.position.set(0.08, 1.25, 0.25);
  tunicR.rotation.z = 0.15;
  group.add(tunicL, tunicR);

  // Jedi Leather Utility Belt with metal capsules
  const belt = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.14, 0.52), beltMat);
  belt.position.set(0, 0.76, 0);
  const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 0.05), silverMat);
  buckle.position.set(0, 0.76, 0.27);
  // Energy capsules on belt
  [-0.22, 0.22].forEach((cx) => {
    const capsule = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.1, 8), silverMat);
    capsule.position.set(cx, 0.76, 0.27);
    group.add(capsule);
  });
  group.add(belt, buckle);

  // Head with Draped Jedi Hood / Cowl
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.75, 0);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 16), skinMat);
  headGroup.add(head);

  addComicEyes(headGroup, 0.02, 0.22, 0.085, 0.065);

  // Draped Jedi Cowl / Hood over head and shoulders
  const hood = new THREE.Mesh(new THREE.SphereGeometry(0.33, 16, 14, 0, Math.PI * 2, 0, Math.PI * 0.68), robeMat);
  hood.position.set(0, 0.04, -0.06);
  // Cowl peak over forehead
  const hoodPeak = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.06, 0.16), robeMat);
  hoodPeak.position.set(0, 0.22, 0.18);
  hoodPeak.rotation.x = 0.35;
  headGroup.add(hood, hoodPeak);
  group.add(headGroup);

  // Limbs with flowing sleeves and tall Jedi boots
  const limbs = createStandardLimbs(robeMat, skinMat, tunicMat, bootMat, [0.24, 0.28, 0.44]);

  // IN RIGHT HAND: IGNITED GLOWING CYAN LIGHTSABER!
  const lightsaber = new THREE.Group();
  // Lightsaber Hilt: Metallic silver & black emitter
  const saberHilt = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.34, 12), silverMat);
  const emitterRim = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.06, 12), new THREE.MeshStandardMaterial({ color: 0x0f172a }));
  emitterRim.position.y = 0.18;
  const switchBox = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.06, 0.03), new THREE.MeshStandardMaterial({ color: 0xef4444 }));
  switchBox.position.set(0.04, 0, 0);
  lightsaber.add(saberHilt, emitterRim, switchBox);

  // IGNITED GLOWING CYAN PLASMA BLADE: Double layer (outer glow + inner hot core)
  const saberBlade = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 1.85, 14),
    new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00f0ff,
      emissiveIntensity: 2.5,
      roughness: 0.1,
    })
  );
  saberBlade.position.y = 1.15;
  // Inner white-hot plasma core
  const innerBlade = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, 1.83, 10),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  saberBlade.add(innerBlade);
  lightsaber.add(saberBlade);

  // Position lightsaber firmly in the right hand pointing forward/upward!
  lightsaber.rotation.x = Math.PI / 2;
  lightsaber.position.set(0, -0.65, 0.15);
  limbs.rightArm.add(lightsaber);

  group.add(limbs.leftArm, limbs.rightArm, limbs.leftLeg, limbs.rightLeg);
  const gear = attachStandardGear(group);

  return { group, ...limbs, ...gear, saberBlade };
}

/**
 * 11. SKULLFACE: Streetwear skate legend with oversized black hoodie, 3D bone relief on chest & back,
 * snapback cap with white sandwich brim & graffiti logo, silver brim clip, chunky skate sneakers with skull emblems,
 * and the Toxic Skull deck! Faithfully recreated from user concept reference art.
 */
function createSkullfaceCharacter(outfitColor: string = '#18181b'): PlayerModelRig {
  const group = new THREE.Group();
  const hoodieColor = new THREE.Color(outfitColor);
  const hoodieMat = new THREE.MeshStandardMaterial({ color: hoodieColor, roughness: 0.65 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1e1e24, roughness: 0.7 });
  const boneMat = new THREE.MeshStandardMaterial({ color: 0xf6f0e2, roughness: 0.35 }); // Warm ivory bone
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25 });
  const darkCavityMat = new THREE.MeshBasicMaterial({ color: 0x090b10 });
  const silverMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.85, roughness: 0.2 });

  // 1. Torso: Oversized streetwear zip hoodie
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.88, 0.48), hoodieMat);
  torso.position.y = 1.18;
  torso.castShadow = true;
  group.add(torso);

  // Silver zipper track down center front
  const zipper = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.86, 0.02), silverMat);
  zipper.position.set(0, 1.18, 0.25);
  const zipperPull = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.08, 0.03), silverMat);
  zipperPull.position.set(0.03, 1.48, 0.26);
  group.add(zipper, zipperPull);

  // Front kangaroo pouch pockets
  const pocketL = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.22, 0.04), hoodieMat);
  pocketL.position.set(-0.16, 0.95, 0.25);
  const pocketR = pocketL.clone();
  pocketR.position.x = 0.16;
  group.add(pocketL, pocketR);

  // Front 3D Ribcage relief: 4 curved bone pairs on front of chest
  for (let r = 0; r < 4; r++) {
    const y = 1.4 - r * 0.09;
    const ribW = 0.22 - r * 0.015;
    const ribFL = new THREE.Mesh(new THREE.BoxGeometry(ribW, 0.04, 0.02), boneMat);
    ribFL.position.set(-ribW / 2 - 0.04, y, 0.255);
    ribFL.rotation.z = 0.08;

    const ribFR = new THREE.Mesh(new THREE.BoxGeometry(ribW, 0.04, 0.02), boneMat);
    ribFR.position.set(ribW / 2 + 0.04, y, 0.255);
    ribFR.rotation.z = -0.08;

    group.add(ribFL, ribFR);
  }

  // Clavicle collarbone prints on front shoulders
  const clavicleFL = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.04, 0.02), boneMat);
  clavicleFL.position.set(-0.2, 1.48, 0.25);
  clavicleFL.rotation.z = -0.12;
  const clavicleFR = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.04, 0.02), boneMat);
  clavicleFR.position.set(0.2, 1.48, 0.25);
  clavicleFR.rotation.z = 0.12;
  group.add(clavicleFL, clavicleFR);

  // BACK DESIGN: Vertebral spine column and upper back rib arches (matching turnaround_back_reference_7a4eacff.png)
  const spineGroup = new THREE.Group();
  spineGroup.position.set(0, 1.18, -0.25);
  for (let v = 0; v < 6; v++) {
    const vert = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.06, 0.02), boneMat);
    vert.position.y = 0.26 - v * 0.1;
    spineGroup.add(vert);
  }
  for (let b = 0; b < 3; b++) {
    const by = 0.22 - b * 0.09;
    const archL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.035, 0.02), boneMat);
    archL.position.set(-0.16, by, 0);
    archL.rotation.z = -0.1;
    const archR = archL.clone();
    archR.position.x = 0.16;
    archR.rotation.z = 0.1;
    spineGroup.add(archL, archR);
  }
  group.add(spineGroup);

  // Hoodie collar & hanging drawstrings with silver aglets
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.07, 8, 16), hoodieMat);
  collar.rotation.x = Math.PI / 2;
  collar.position.set(0, 1.62, 0);
  group.add(collar);

  const stringL = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.35, 6), whiteMat);
  stringL.position.set(-0.12, 1.38, 0.27);
  const agletL = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.06, 6), silverMat);
  agletL.position.set(-0.12, 1.18, 0.27);
  const stringR = stringL.clone();
  stringR.position.x = 0.12;
  const agletR = agletL.clone();
  agletR.position.x = 0.12;
  group.add(stringL, agletL, stringR, agletR);

  // 2. Head: Skull Face + Pulled-up Hoodie + Snapback Cap
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.78, 0);

  // Ivory skull cranium
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.27, 16, 16), boneMat);
  skull.scale.set(0.95, 1.05, 1.0);
  headGroup.add(skull);

  // Oversized hoodie hood surrounding head from behind and sides
  const hoodBack = new THREE.Mesh(
    new THREE.SphereGeometry(0.35, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.75),
    hoodieMat
  );
  hoodBack.position.set(0, 0.02, -0.06);
  hoodBack.scale.set(1.02, 1.08, 1.1);
  headGroup.add(hoodBack);

  // Hollow Orbital Eye Sockets
  [-0.1, 0.1].forEach((gx) => {
    const socket = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.06, 12), darkCavityMat);
    socket.rotation.x = Math.PI / 2;
    socket.position.set(gx, 0.03, 0.23);
    headGroup.add(socket);
  });

  // Triangular Nasal Cavity
  const nasal = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.07, 3), darkCavityMat);
  nasal.rotation.x = Math.PI;
  nasal.position.set(0, -0.05, 0.26);
  headGroup.add(nasal);

  // Smiling Skeletal Jaw with teeth
  const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.09, 0.16), boneMat);
  jaw.position.set(0, -0.16, 0.16);
  const teethRow = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.045, 0.165), whiteMat);
  teethRow.position.set(0, -0.12, 0.17);
  const teethSep = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.046, 0.168), darkCavityMat);
  teethSep.position.set(-0.05, -0.12, 0.17);
  const teethSep2 = teethSep.clone();
  teethSep2.position.x = 0.05;
  headGroup.add(jaw, teethRow, teethSep, teethSep2);

  // Black Snapback Cap: Crown + White Sandwich Brim Edge + Silver Brim Clip + Front White Graffiti Logo
  const capCrown = new THREE.Mesh(
    new THREE.CylinderGeometry(0.31, 0.3, 0.18, 16),
    new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.6 })
  );
  capCrown.position.set(0, 0.21, 0.03);

  // Cap Visor with White Sandwich Edge (from cap_reference_69db3764.png)
  const brimTop = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.03, 0.32),
    new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.5 })
  );
  brimTop.position.set(0, 0.14, 0.34);
  brimTop.rotation.x = 0.08;

  // Crisp White Sandwich Brim Edge
  const brimWhiteEdge = new THREE.Mesh(
    new THREE.BoxGeometry(0.43, 0.015, 0.33),
    whiteMat
  );
  brimWhiteEdge.position.set(0, 0.14, 0.34);
  brimWhiteEdge.rotation.x = 0.08;

  // Front White Graffiti Logo Patch on Cap Crown
  const logoPatch = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 0.1, 0.02),
    whiteMat
  );
  logoPatch.position.set(0, 0.23, 0.32);

  // Metallic Silver Clip on left side of brim (distinctive detail from reference!)
  const brimClip = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, 0.05, 0.08),
    silverMat
  );
  brimClip.position.set(-0.16, 0.14, 0.35);

  headGroup.add(capCrown, brimTop, brimWhiteEdge, logoPatch, brimClip);
  group.add(headGroup);

  // 3. Limbs: Arms with bone prints + Ivory skeletal hands, Legs with bone prints + Chunky Skate Sneakers
  const limbs = createStandardLimbs(
    hoodieMat,
    boneMat,
    pantsMat,
    new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.5 }), // Black skate shoe body
    [0.28, 0.22, 0.5] // Chunky skate silhouette
  );

  // Add 3D white arm bone prints to both sleeves
  [limbs.leftArm, limbs.rightArm].forEach((arm) => {
    const boneUpper = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.2, 0.02), whiteMat);
    boneUpper.position.set(0, -0.18, 0.1);
    const boneLowerL = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.18, 0.02), whiteMat);
    boneLowerL.position.set(-0.03, -0.38, 0.1);
    const boneLowerR = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.18, 0.02), whiteMat);
    boneLowerR.position.set(0.03, -0.38, 0.1);
    arm.add(boneUpper, boneLowerL, boneLowerR);
  });

  // Add 3D white leg bone prints to both pants legs
  [limbs.leftLeg, limbs.rightLeg].forEach((leg) => {
    const femur = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.24, 0.02), whiteMat);
    femur.position.set(0, -0.18, 0.12);
    const tibia = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.22, 0.02), whiteMat);
    tibia.position.set(0, -0.42, 0.12);
    leg.add(femur, tibia);
  });

  // Customize Chunky Skate Sneakers with White Soles, Skate Laces, and Outer Skull Badge (matching shoe_reference_7c750b96.png)
  [
    { leg: limbs.leftLeg, isLeft: true },
    { leg: limbs.rightLeg, isLeft: false },
  ].forEach(({ leg, isLeft }) => {
    // White thick cupsole welt
    const sole = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.07, 0.52),
      whiteMat
    );
    sole.position.set(0, -0.68, 0.08);

    // White skate laces criss-cross
    const laces = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.04, 0.2),
      whiteMat
    );
    laces.position.set(0, -0.55, 0.14);

    // Outer side skull logo badge
    const badgeX = isLeft ? -0.15 : 0.15;
    const skullBadge = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 0.02, 12),
      whiteMat
    );
    skullBadge.rotation.z = Math.PI / 2;
    skullBadge.position.set(badgeX, -0.6, 0.05);

    leg.add(sole, laces, skullBadge);
  });

  group.add(limbs.leftArm, limbs.rightArm, limbs.leftLeg, limbs.rightLeg);
  const gear = attachStandardGear(group, true); // equipped with Toxic Skull hoverboard!

  return { group, ...limbs, ...gear };
}

/**
 * Main Character Factory: Instantiates any of the comic characters
 */
export function createCharacterModel(
  characterId: CharacterId | string = 'skeleton',
  outfitColor?: string
): PlayerModelRig {
  switch (characterId) {
    case 'skullface':
      return createSkullfaceCharacter(outfitColor || '#18181b');
    case 'skeleton':
    case 'mr.bones':
    case 'mr_bones':
    default:
      return createSkeletonCharacter();
  }
}

/**
 * Wraps any imported 3D .glb / .gltf model into a player rig with auto-scaling,
 * grounding, standard gear attachments, and skeletal animation playback.
 */
export function createCustomGltfCharacter(
  gltfScene: THREE.Group,
  animations: THREE.AnimationClip[] = []
): PlayerModelRig {
  const group = new THREE.Group();

  // 1. Calculate bounding box to normalize scale to standard runner scale (height ~ 1.9 units)
  const bbox = new THREE.Box3().setFromObject(gltfScene);
  const size = new THREE.Vector3();
  bbox.getSize(size);
  const maxDim = Math.max(size.y, 0.001);
  const targetHeight = 1.9;
  const scale = targetHeight / maxDim;
  gltfScene.scale.setScalar(scale);

  // Recalculate after scaling to find exact bottom and center
  const scaledBbox = new THREE.Box3().setFromObject(gltfScene);
  const center = new THREE.Vector3();
  scaledBbox.getCenter(center);
  // Ground model flush with bottom y = 0
  gltfScene.position.set(-center.x, -scaledBbox.min.y, -center.z);

  // Enable shadows on all imported meshes
  gltfScene.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  const modelWrapper = new THREE.Group();
  modelWrapper.add(gltfScene);
  group.add(modelWrapper);

  // 2. Setup AnimationMixer if animations exist
  let mixer: THREE.AnimationMixer | undefined;
  if (animations && animations.length > 0) {
    mixer = new THREE.AnimationMixer(gltfScene);
    const runAnim =
      animations.find((a) => /run|sprint|walk|jog/i.test(a.name)) ||
      animations[0];
    const action = mixer.clipAction(runAnim);
    action.play();
  }

  // 3. Create dummy limb groups so existing runner physics/stance code runs safely
  const dummyLimb = () => new THREE.Group();
  const leftArm = dummyLimb();
  const rightArm = dummyLimb();
  const leftLeg = dummyLimb();
  const rightLeg = dummyLimb();

  const gear = attachStandardGear(group);

  return {
    group,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    ...gear,
    mixer,
    isCustomGltf: true,
  };
}

/**
 * Creates the Kasi Rush Inspector & Guard Dog Chasing Duo!
 */
export function createInspectorModel(): {
  group: THREE.Group;
  dogGroup: THREE.Group;
  inspectorLegL: THREE.Group;
  inspectorLegR: THREE.Group;
} {
  const group = new THREE.Group();

  // Inspector
  const inspector = new THREE.Group();
  const uniformMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.6 }); // dark blue police uniform
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xa16207, roughness: 0.6 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.8, roughness: 0.2 });

  // Body (Stout/Brawny)
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.6), uniformMat);
  body.position.y = 1.2;
  body.castShadow = true;

  // Gold Badge
  const badge = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 0.05), goldMat);
  badge.position.set(0.2, 1.35, 0.32);

  // Head & Peaked Officer Cap
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 16), skinMat);
  head.position.set(0, 1.85, 0);

  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.32, 0.18, 16), uniformMat);
  cap.position.set(0, 2.05, 0);
  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.04, 0.2), new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.2 }));
  visor.position.set(0, 1.98, 0.24);

  // Inspector legs
  const inspectorLegL = new THREE.Group();
  inspectorLegL.position.set(-0.25, 0.75, 0);
  const legMeshL = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.7, 0.26), uniformMat);
  legMeshL.position.y = -0.35;
  inspectorLegL.add(legMeshL);

  const inspectorLegR = new THREE.Group();
  inspectorLegR.position.set(0.25, 0.75, 0);
  const legMeshR = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.7, 0.26), uniformMat);
  legMeshR.position.y = -0.35;
  inspectorLegR.add(legMeshR);

  inspector.add(body, badge, head, cap, visor, inspectorLegL, inspectorLegR);
  group.add(inspector);

  // Pitbull / Guard Dog running right beside him!
  const dogGroup = new THREE.Group();
  dogGroup.position.set(0.85, 0, 0.2);

  const dogMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.7 });
  const dogBody = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.35, 0.65), dogMat);
  dogBody.position.y = 0.35;

  const dogHead = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.35), dogMat);
  dogHead.position.set(0, 0.52, 0.35);

  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.08, 12), new THREE.MeshStandardMaterial({ color: 0xef4444 }));
  collar.position.set(0, 0.45, 0.22);

  dogGroup.add(dogBody, dogHead, collar);
  group.add(dogGroup);

  return {
    group,
    dogGroup,
    inspectorLegL,
    inspectorLegR,
  };
}

/**
 * Creates PRASA / Metrorail Passenger Train Carriage (Yellow/Grey or Coastal Blue) with high-detail bogies, headlights, and route display.
 */
export function createTrainMesh(_city: SouthAfricanCity): THREE.Group {
  const trainGroup = new THREE.Group();
  // Two properly positioned carriages preserve the 28m gameplay/collision footprint.
  for (const z of [-6.8, 6.8]) {
    const fallback = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(2.3, TRAIN_HEIGHT, 13.3),
      new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.45 }),
    );
    body.position.y = TRAIN_HEIGHT / 2;
    fallback.add(body);
    const carriage = assetManager.instantiate('sa_commuter_train', {
      targetDimensions: [2.3, TRAIN_HEIGHT, 13.3],
    }, fallback);
    carriage.position.z = z;
    trainGroup.add(carriage);
  }
  return trainGroup;
}

/**
 * Creates low jump barrier (Kasi Rush hurdle)
 */
export function createBarrierLow(): THREE.Group {
  const choices = ['road_barrier', 'crates', 'tyre_stack', 'concrete_barrier', 'construction_cone', 'dumpster'] as const;
  const chosen = choices[Math.floor(Math.random() * choices.length)];
  const placeholder = new THREE.Group();
  const bar = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 1.25, 0.5),
    new THREE.MeshStandardMaterial({ map: hazardTexture, roughness: 0.45 }),
  );
  bar.position.y = 0.625;
  placeholder.add(bar);
  // Visual footprint is kept inside the existing low-obstacle hitbox.
  return assetManager.instantiate(chosen, { targetDimensions: [2.15, 1.25, 0.6] }, placeholder);
}

/**
 * Creates high barrier (Slide under warning sign)
 */
export function createBarrierHigh(): THREE.Group {
  const group = new THREE.Group();

  const gantryMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    metalness: 0.6,
  });

  const signMat = new THREE.MeshStandardMaterial({
    map: hazardTexture,
    roughness: 0.3,
  });

  // Left & Right tall posts
  const postL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.5, 0.12), gantryMat);
  postL.position.set(-1.1, 1.25, 0);

  const postR = postL.clone();
  postR.position.x = 1.1;

  // Overhead warning bar / sign (at y = 1.8 to 2.4, leaves 1.3m clearance to slide under)
  const sign = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.8, 0.15), signMat);
  sign.position.y = 2.0;

  group.add(postL, postR, sign);
  return group;
}

/**
 * Creates 3D Gold Coin with rim, center emblem, and rotating animation
 */
export function createCoinMesh(): THREE.Group {
  return assetManager.instantiate('rand_r1_coin', {
    targetDimensions: [0.88, 0.88, 0.12], ground: false,
  }, createProceduralCoinMesh());
}

function createProceduralCoinMesh(): THREE.Group {
  const group = new THREE.Group();

  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    metalness: 0.9,
    roughness: 0.2,
    emissive: 0xd97706,
    emissiveIntensity: 0.35,
  });

  const rimMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    metalness: 0.95,
    roughness: 0.15,
    emissive: 0xb45309,
    emissiveIntensity: 0.25,
  });

  const reliefMat = new THREE.MeshStandardMaterial({
    color: 0xffedd5,
    metalness: 0.92,
    roughness: 0.18,
  });

  // Main coin disc: Standing upright vertically facing Z so spinning around Y shows the full coin face!
  const coin = new THREE.Mesh(
    new THREE.CylinderGeometry(0.44, 0.44, 0.08, 24),
    goldMat
  );
  coin.rotation.x = Math.PI / 2;
  coin.castShadow = true;
  group.add(coin);

  // Outer raised rims on both front and back
  [-0.042, 0.042].forEach((zPos) => {
    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(0.41, 0.035, 8, 24),
      rimMat
    );
    rim.position.z = zPos;
    group.add(rim);

    // Inner beaded ring
    const innerRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.35, 0.015, 6, 24),
      rimMat
    );
    innerRing.position.z = zPos;
    group.add(innerRing);
  });

  // FRONT RELIEF: Iconic South African "R1" embossed on front face (+Z)
  const frontRelief = new THREE.Group();
  frontRelief.position.z = 0.048;

  // Letter "R" on left
  const rStem = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.26, 0.02), reliefMat);
  rStem.position.set(-0.16, 0, 0);
  const rLoop = new THREE.Mesh(new THREE.TorusGeometry(0.065, 0.022, 6, 12, Math.PI), reliefMat);
  rLoop.rotation.z = -Math.PI / 2;
  rLoop.position.set(-0.13, 0.065, 0);
  const rLeg = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.14, 0.02), reliefMat);
  rLeg.rotation.z = -0.6;
  rLeg.position.set(-0.09, -0.06, 0);
  frontRelief.add(rStem, rLoop, rLeg);

  // Number "1" on right
  const oneStem = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.3, 0.02), reliefMat);
  oneStem.position.set(0.12, 0, 0);
  const oneSerif = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.035, 0.02), reliefMat);
  oneSerif.rotation.z = 0.55;
  oneSerif.position.set(0.08, 0.12, 0);
  const oneBase = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.035, 0.02), reliefMat);
  oneBase.position.set(0.12, -0.13, 0);
  frontRelief.add(oneStem, oneSerif, oneBase);

  group.add(frontRelief);

  // BACK RELIEF: Springbok head profile on rear face (-Z)
  const backRelief = new THREE.Group();
  backRelief.position.z = -0.048;

  const springbokHead = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.22, 0.02), reliefMat);
  springbokHead.rotation.z = 0.25;
  springbokHead.position.set(0, 0, 0);

  const hornL = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.22, 6), reliefMat);
  hornL.rotation.z = -0.4;
  hornL.position.set(-0.06, 0.14, 0);
  const hornR = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.22, 6), reliefMat);
  hornR.rotation.z = -0.25;
  hornR.position.set(0.04, 0.15, 0);

  backRelief.add(springbokHead, hornL, hornR);
  group.add(backRelief);

  return group;
}

/**
 * Creates 3D Powerup Pickups
 */
export function createPowerupMesh(type: string): THREE.Group {
  const modeled = type === 'sneakers' ? 'fresh_kicks'
    : type === 'multiplier' ? 'multiplier_2x' : type;
  return assetManager.instantiate(modeled, {
    targetDimensions: [0.9, 0.9, 0.55], ground: false,
  }, createProceduralPowerupMesh(type));
}

function createProceduralPowerupMesh(type: string): THREE.Group {
  const group = new THREE.Group();

  if (type === 'magnet') {
    // Red & Blue Horseshoe Magnet
    const magnetGeo = new THREE.TorusGeometry(0.35, 0.1, 8, 16, Math.PI);
    const redMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 });
    const blueMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.3 });
    const silverMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.9 });

    const arc = new THREE.Mesh(magnetGeo, redMat);
    arc.rotation.z = Math.PI;

    const tipL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), silverMat);
    tipL.position.set(-0.35, -0.1, 0);

    const tipR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), blueMat);
    tipR.position.set(0.35, -0.1, 0);

    group.add(arc, tipL, tipR);
  } else if (type === 'jetpack') {
    // Twin Rockets
    const rocketMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.8 });
    const rocketL = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.6, 12), rocketMat);
    rocketL.position.x = -0.18;
    const rocketR = rocketL.clone();
    rocketR.position.x = 0.18;

    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.2, 12), new THREE.MeshStandardMaterial({ color: 0xef4444 }));
    cone.position.set(-0.18, 0.4, 0);
    const coneR = cone.clone();
    coneR.position.x = 0.18;

    group.add(rocketL, rocketR, cone, coneR);
  } else if (type === 'sneakers') {
    // Use authentic 3D Fresh Kicks sneaker model if loaded!
    const glbKicks = assetManager.get('fresh_kicks');
    if (glbKicks) {
      glbKicks.scale.setScalar(1.6);
      glbKicks.position.y = 0.2;
      group.add(glbKicks);
      const halo = new THREE.Mesh(
        new THREE.TorusGeometry(0.55, 0.03, 8, 24),
        new THREE.MeshBasicMaterial({ color: 0x22c55e, transparent: true, opacity: 0.6 })
      );
      halo.rotation.x = Math.PI / 2;
      group.add(halo);
      return group;
    }

    // Spring Boot
    const boot = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.3, 0.6),
      new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.3 })
    );
    const wing = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.25, 0.4),
      new THREE.MeshStandardMaterial({ color: 0xffffff })
    );
    wing.position.set(-0.22, 0.15, 0);
    group.add(boot, wing);
  } else {
    // 2X Multiplier Star
    const star = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.35),
      new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        emissive: 0xd97706,
        emissiveIntensity: 0.5,
        roughness: 0.2,
      })
    );
    group.add(star);
  }

  // Floating outer halo
  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(0.55, 0.03, 8, 24),
    new THREE.MeshBasicMaterial({ color: 0xfef08a, transparent: true, opacity: 0.6 })
  );
  halo.rotation.x = Math.PI / 2;
  group.add(halo);

  return group;
}

/**
 * Creates 3D stylized low-poly fluffy clouds drifting across the sky.
 */
export function createClouds(): THREE.Group {
  const clouds = new THREE.Group();
  const cloudMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.9,
    metalness: 0.05,
    flatShading: true,
  });

  const cloudPuffs = [
    { x: -30, y: 35, z: -80, scale: 1.4 },
    { x: 18, y: 42, z: -110, scale: 1.8 },
    { x: -10, y: 38, z: -140, scale: 1.5 },
    { x: 35, y: 32, z: -60, scale: 1.2 },
    { x: -45, y: 40, z: -130, scale: 1.6 },
  ];

  cloudPuffs.forEach((p) => {
    const puffGroup = new THREE.Group();
    // Composite 4-5 overlapping spheres
    for (let i = 0; i < 5; i++) {
      const puff = new THREE.Mesh(
        new THREE.DodecahedronGeometry(3.2 + Math.random() * 2.0, 1),
        cloudMat
      );
      puff.position.set((i - 2) * 2.8, (i % 2) * 1.5, Math.sin(i) * 2.0);
      puffGroup.add(puff);
    }
    puffGroup.position.set(p.x, p.y, p.z);
    puffGroup.scale.setScalar(p.scale);
    clouds.add(puffGroup);
  });

  return clouds;
}

/**
 * Helpers for Environment-Specific Bespoke 3D Assets
 */

// 1. Minibus Taxi (Toyota Quantum style South African commuter taxi)
export function createMinibusTaxi(): THREE.Group {
  const glbTaxi = assetManager.get('sa_minibus_taxi');
  if (glbTaxi) {
    const group = new THREE.Group();
    glbTaxi.scale.set(0.95, 0.95, 0.95);
    group.add(glbTaxi);
    return group;
  }

  const taxi = new THREE.Group();
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
  const darkGlassMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1 });
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.7 });
  const yellowStripeMat = new THREE.MeshStandardMaterial({ color: 0xeab308 });
  const greenStripeMat = new THREE.MeshStandardMaterial({ color: 0x10b981 });

  // Body
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.0, 5.2), whiteMat);
  body.position.y = 1.3;
  taxi.add(body);

  // Windshield & side glass
  const windshield = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.9, 0.1), darkGlassMat);
  windshield.position.set(0, 1.6, 2.56);
  windshield.rotation.x = -0.2;
  const sideGlassL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.75, 3.8), darkGlassMat);
  sideGlassL.position.set(-1.21, 1.6, -0.2);
  const sideGlassR = sideGlassL.clone();
  sideGlassR.position.x = 1.21;
  taxi.add(windshield, sideGlassL, sideGlassR);

  // South African Flag Chevron / Decal stripe along sides
  const stripeY = new THREE.Mesh(new THREE.BoxGeometry(2.42, 0.15, 4.6), yellowStripeMat);
  stripeY.position.set(0, 1.05, 0);
  const stripeG = new THREE.Mesh(new THREE.BoxGeometry(2.42, 0.12, 4.6), greenStripeMat);
  stripeG.position.set(0, 0.9, 0);
  taxi.add(stripeY, stripeG);

  // Wheels
  [[-1.2, 1.5], [1.2, 1.5], [-1.2, -1.5], [1.2, -1.5]].forEach(([wx, wz]) => {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.3, 12), wheelMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(wx, 0.42, wz);
    taxi.add(wheel);
  });

  return taxi;
}

// 2. Spaza Tuckshop
export function createSpazaShop(): THREE.Group {
  const glbSpaza = assetManager.get('spaza_shop');
  if (glbSpaza) {
    const group = new THREE.Group();
    glbSpaza.scale.set(1.0, 1.0, 1.0);
    group.add(glbSpaza);
    return group;
  }

  const shop = new THREE.Group();
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.6 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.7, roughness: 0.4 });
  const signMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3 });

  // Main shack
  const shack = new THREE.Mesh(new THREE.BoxGeometry(4.0, 2.8, 3.5), wallMat);
  shack.position.y = 1.4;

  // Corrugated roof
  const roof = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.12, 4.2), roofMat);
  roof.position.set(0, 2.9, 0);
  roof.rotation.x = 0.1;

  // Front serving counter
  const counter = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.9, 0.8), new THREE.MeshStandardMaterial({ color: 0x78350f }));
  counter.position.set(0, 0.45, 1.8);

  // Signboard: "KASI SPAZA"
  const sign = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.6, 0.1), signMat);
  sign.position.set(0, 2.4, 1.8);
  shop.add(shack, roof, counter, sign);
  return shop;
}

// 3. Authentic Soweto Corrugated Shack
export function createSowetoShack(): THREE.Group {
  const glbShack = assetManager.get('soweto_shack');
  if (glbShack) {
    const group = new THREE.Group();
    glbShack.scale.set(0.95, 0.95, 0.95);
    group.add(glbShack);
    return group;
  }
  return createSpazaShop();
}

// 4. Township Shipping Container
export function createShippingContainer(): THREE.Group {
  const glbContainer = assetManager.get('shipping_container');
  if (glbContainer) {
    const group = new THREE.Group();
    glbContainer.scale.set(0.95, 0.95, 0.95);
    group.add(glbContainer);
    return group;
  }
  const group = new THREE.Group();
  const box = new THREE.Mesh(
    new THREE.BoxGeometry(2.4, 2.5, 6),
    new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.5 })
  );
  box.position.y = 1.25;
  group.add(box);
  return group;
}

// 5. Township Power Pole with Wiring
export function createTownshipPowerPole(): THREE.Group {
  const glbPole = assetManager.get('power_pole');
  if (glbPole) {
    const group = new THREE.Group();
    glbPole.scale.setScalar(0.9);
    group.add(glbPole);
    return group;
  }
  return createTelephonePole();
}

// 3. Striped Beach Umbrella & Surfboard for Durban
export function createBeachUmbrella(primaryColor: number = 0xef4444): THREE.Group {
  const group = new THREE.Group();
  const poleMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.8 });
  const canopyMat1 = new THREE.MeshStandardMaterial({ color: primaryColor, roughness: 0.4 });

  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 3.8, 8), poleMat);
  pole.position.y = 1.9;
  pole.rotation.z = 0.1;

  const canopy = new THREE.Mesh(new THREE.ConeGeometry(2.2, 0.9, 8), canopyMat1);
  canopy.position.set(0.18, 3.6, 0);
  canopy.rotation.z = 0.1;

  group.add(pole, canopy);
  return group;
}

export function createSurfboard(color: number = 0x06b6d4): THREE.Group {
  const board = new THREE.Group();
  const boardMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 2.8, 0.12),
    new THREE.MeshStandardMaterial({ color, roughness: 0.2, metalness: 0.2 })
  );
  boardMesh.rotation.x = 0.15;
  boardMesh.position.y = 1.2;
  board.add(boardMesh);
  return board;
}

// 4. Victorian Street Lamp for Cape Town
export function createStreetLamp(): THREE.Group {
  const lamp = new THREE.Group();
  const ironMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.3 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xfacc15, emissiveIntensity: 0.7 });

  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, 5.0, 10), ironMat);
  post.position.y = 2.5;

  const lantern = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.18, 0.5, 6), glassMat);
  lantern.position.y = 5.2;

  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.25, 6), ironMat);
  cap.position.y = 5.55;

  lamp.add(post, lantern, cap);
  return lamp;
}

// 5. Indigenous African Acacia Thorn Tree for Eastern Cape
export function createAcaciaTree(): THREE.Group {
  const tree = new THREE.Group();
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x573a21, roughness: 0.9 });
  const foliageMat = new THREE.MeshStandardMaterial({ color: 0x2d6a4f, roughness: 0.8 });

  // Slanted branching trunk
  const trunkCurve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.5, 4.0, 0),
    new THREE.Vector3(1.2, 8.5, 0)
  );
  const trunk = new THREE.Mesh(new THREE.TubeGeometry(trunkCurve, 10, 0.4, 8, false), trunkMat);
  tree.add(trunk);

  // Flat umbrella foliage tiers (classic African savannah silhouette)
  const tier1 = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 2.8, 0.8, 10), foliageMat);
  tier1.position.set(1.2, 8.8, 0);
  const tier2 = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 1.8, 0.6, 10), foliageMat);
  tier2.position.set(1.5, 9.4, 0.3);
  tree.add(tier1, tier2);

  return tree;
}

// 6. Red Flowering Aloe Ferox Succulent for Wild Coast
export function createAloePlant(): THREE.Group {
  const aloe = new THREE.Group();
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.7 });
  const flowerMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xdc2626, emissiveIntensity: 0.4 });

  // Rosette leaves
  for (let l = 0; l < 8; l++) {
    const angle = (l / 8) * Math.PI * 2;
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.12, 1.2, 4), leafMat);
    leaf.rotation.z = 0.6;
    leaf.rotation.y = angle;
    leaf.position.y = 0.3;
    aloe.add(leaf);
  }

  // Red flower candle spike
  const spike = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 1.4, 8), flowerMat);
  spike.position.y = 1.2;
  aloe.add(spike);

  return aloe;
}

// 7. Pop-Art Comic Billboard with Action Bursts
export function createComicBillboardSign(phrase: string = 'POW!'): THREE.Group {
  const billboard = new THREE.Group();
  const boardTex = createComicBillboardTexture(phrase);
  const boardMat = new THREE.MeshBasicMaterial({ map: boardTex });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7 });

  // Sign panel
  const panel = new THREE.Mesh(new THREE.BoxGeometry(6.4, 3.2, 0.2), boardMat);
  panel.position.y = 4.2;

  // Twin support poles
  const poleL = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 4.2, 8), metalMat);
  poleL.position.set(-2.4, 2.1, 0);
  const poleR = poleL.clone();
  poleR.position.x = 2.4;

  billboard.add(panel, poleL, poleR);
  return billboard;
}

// 8. Bo-Kaap Heritage Pastel House
export function createBoKaapHouse(colorHex: number = 0x06b6d4): THREE.Group {
  const group = new THREE.Group();
  const houseMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.35 });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
  const doorMat = new THREE.MeshStandardMaterial({ color: 0x78350f });

  // Main 2-story colorful facade (compact footprint to prevent encroaching)
  const main = new THREE.Mesh(new THREE.BoxGeometry(4.6, 5.2, 5.6), houseMat);
  main.position.y = 2.6;

  // Parapet roof / Dutch gable moulding
  const roof = new THREE.Mesh(new THREE.BoxGeometry(4.9, 0.4, 5.9), trimMat);
  roof.position.y = 5.35;

  // Front Stoep (veranda)
  const stoep = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.35, 1.0), trimMat);
  stoep.position.set(0, 0.18, 3.1);

  // Front door & windows
  const door = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.8, 0.1), doorMat);
  door.position.set(0, 1.1, 2.82);

  const winMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2 });
  [[-1.3, 1.4], [1.3, 1.4], [-1.3, 3.7], [1.3, 3.7]].forEach(([wx, wy]) => {
    const win = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.0, 0.08), winMat);
    win.position.set(wx, wy, 2.82);
    group.add(win);
  });

  group.add(main, roof, stoep, door);
  return group;
}

// 9. Traditional Thatched Rondavel
export function createThatchedRondavel(colorHex: number = 0x06b6d4): THREE.Group {
  const rondavel = new THREE.Group();
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(3.0, 3.0, 3.6, 16),
    new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.8 })
  );
  base.position.y = 1.8;

  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(3.6, 2.8, 16),
    new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 })
  );
  roof.position.y = 4.8;

  rondavel.add(base, roof);
  return rondavel;
}

// 10. Telephone / Utility Pole with cross-arm
export function createTelephonePole(): THREE.Group {
  const pole = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.7 });

  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 7.5, 8), woodMat);
  post.position.y = 3.75;

  const cross = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.15, 0.15), woodMat);
  cross.position.set(0, 6.8, 0);

  [-1.0, 0, 1.0].forEach((ox) => {
    const insulator = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.2, 6), metalMat);
    insulator.position.set(ox, 7.0, 0);
    pole.add(insulator);
  });

  pole.add(post, cross);
  return pole;
}

export function createPalmTree(): THREE.Group {
  const palm = new THREE.Group();
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.6 });

  // Curved Trunk
  const trunkCurve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.6, 3.5, 0),
    new THREE.Vector3(0.9, 7.5, 0)
  );
  const trunk = new THREE.Mesh(
    new THREE.TubeGeometry(trunkCurve, 12, 0.32, 8, false),
    trunkMat
  );
  palm.add(trunk);

  // Fronds / Palm Leaves
  for (let a = 0; a < 6; a++) {
    const angle = (a / 6) * Math.PI * 2;
    const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.05, 2.6), leafMat);
    leaf.position.set(0.9, 7.3, 0);
    leaf.rotation.y = angle;
    leaf.rotation.x = 0.5;
    palm.add(leaf);
  }

  return palm;
}

/**
 * Creates South Africa Landmark models with distant horizon backdrops (Z <= -180).
 * All roadside scenery is managed dynamically along track curve offsets so it never encroaches!
 */
export function createLandmarkMesh(city: SouthAfricanCity): THREE.Group {
  const group = new THREE.Group();

  // Distant sky clouds
  group.add(createClouds());

  if (city === 'soweto') {
    // 1. SOWETO DISTANT BACKDROP: Orlando Cooling Towers & Distant Transmission Pylon
    const towerTexture = createOrlandoTowerTexture();
    const towerGeo = new THREE.CylinderGeometry(5.2, 8.5, 36, 24);
    const towerMat = new THREE.MeshStandardMaterial({ map: towerTexture, roughness: 0.7 });

    const tower1 = new THREE.Mesh(towerGeo, towerMat);
    tower1.position.set(-28, 18, -200);
    const tower2 = new THREE.Mesh(towerGeo, towerMat);
    tower2.position.set(-12, 18, -210);
    group.add(tower1, tower2);

    // Distant High Voltage Transmission Pylon
    const pylonMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 });
    const pylon = new THREE.Group();
    const legL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 34, 0.35), pylonMat);
    legL.position.set(-3.5, 17, 0);
    legL.rotation.z = -0.06;
    const legR = new THREE.Mesh(new THREE.BoxGeometry(0.35, 34, 0.35), pylonMat);
    legR.position.set(3.5, 17, 0);
    legR.rotation.z = 0.06;
    const arm1 = new THREE.Mesh(new THREE.BoxGeometry(18, 0.45, 0.45), pylonMat);
    arm1.position.set(0, 26, 0);
    const arm2 = new THREE.Mesh(new THREE.BoxGeometry(14, 0.45, 0.45), pylonMat);
    arm2.position.set(0, 30, 0);
    pylon.add(legL, legR, arm1, arm2);
    pylon.position.set(32, 0, -215);
    group.add(pylon);

  } else if (city === 'durban') {
    // 2. DURBAN DISTANT BACKDROP: Moses Mabhida Stadium Arch & Ocean Horizon
    const archCurve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(-50, 0, -200),
      new THREE.Vector3(0, 54, -200),
      new THREE.Vector3(50, 0, -200)
    );
    const archGeo = new THREE.TubeGeometry(archCurve, 36, 2.2, 12, false);
    const archMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.7, roughness: 0.2 });
    const arch = new THREE.Mesh(archGeo, archMat);
    group.add(arch);

    // Cable stays on stadium arch
    const cableMat = new THREE.MeshBasicMaterial({ color: 0xe2e8f0 });
    for (let c = -35; c <= 35; c += 10) {
      const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 32), cableMat);
      cable.position.set(c, 22, -200);
      group.add(cable);
    }

    // Durban Ocean Horizon Plane
    const oceanGeo = new THREE.PlaneGeometry(120, 260);
    const oceanMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.1, metalness: 0.3 });
    const ocean = new THREE.Mesh(oceanGeo, oceanMat);
    ocean.rotation.x = -Math.PI / 2;
    ocean.position.set(70, -0.2, -200);
    group.add(ocean);

  } else if (city === 'capetown') {
    // 3. CAPE TOWN DISTANT BACKDROP: Table Mountain Massif & Tablecloth Cloud
    const mountainGeo = new THREE.BoxGeometry(150, 48, 36);
    const mountainMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.95 });
    const mountain = new THREE.Mesh(mountainGeo, mountainMat);
    mountain.position.set(0, 24, -215);

    // Tablecloth cloud spilling over Table Mountain
    const cloudTable = new THREE.Mesh(
      new THREE.BoxGeometry(152, 8, 32),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, transparent: true, opacity: 0.88 })
    );
    cloudTable.position.set(0, 49, -215);
    group.add(mountain, cloudTable);

  } else {
    // Nelspruit Lowveld hills / Eastern Cape Wild Coast landscape
    // 4. EASTERN CAPE WILD COAST DISTANT BACKDROP: Rolling Emerald Hills & Sea Cliffs
    const hillsGeo = new THREE.CylinderGeometry(35, 45, 28, 24);
    const hillsMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.85 });
    
    const hill1 = new THREE.Mesh(hillsGeo, hillsMat);
    hill1.position.set(-45, 6, -210);
    hill1.scale.set(1.5, 0.7, 1.2);

    const hill2 = new THREE.Mesh(hillsGeo, hillsMat);
    hill2.position.set(38, 8, -215);
    hill2.scale.set(1.4, 0.8, 1.1);

    const hillCenter = new THREE.Mesh(hillsGeo, hillsMat);
    hillCenter.position.set(0, 4, -225);
    hillCenter.scale.set(2.0, 0.6, 1.0);

    group.add(hill1, hill2, hillCenter);
  }

  return group;
}

