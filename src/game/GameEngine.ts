import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { SouthAfricanCity, PowerupState, PowerupType, RunStats, CharacterId, ComicSplashStyle } from '../types/game';
import {
  LANE_WIDTH,
  LANES,
  BASE_SPEED,
  MAX_SPEED,
  SPEED_ACCELERATION,
  JUMP_VELOCITY,
  SNEAKER_JUMP_VELOCITY,
  GRAVITY,
  ROLL_DURATION,
  HOVERBOARD_DURATION,
  JETPACK_DURATION,
  MAGNET_DURATION,
  SNEAKERS_DURATION,
  MULTIPLIER_DURATION,
  JETPACK_HEIGHT,
  TRAIN_HEIGHT,
  TRAIN_LENGTH,
  CITIES,
} from './constants';
import { createBallastTexture, createGraffitiTexture } from './textures';
import {
  createCharacterModel,
  createCustomGltfCharacter,
  createInspectorModel,
  createTrainMesh,
  createBarrierLow,
  createBarrierHigh,
  createCoinMesh,
  createPowerupMesh,
  createLandmarkMesh,
  createMinibusTaxi,
  createSpazaShop,
  createSowetoShack,
  createShippingContainer,
  createTownshipPowerPole,
  createBeachUmbrella,
  createSurfboard,
  createStreetLamp,
  createAcaciaTree,
  createAloePlant,
  createComicBillboardSign,
  createBoKaapHouse,
  createThatchedRondavel,
  createTelephonePole,
  createPalmTree,
} from './models';
import { assetManager } from './assetLoader';

interface Particle {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
}

export interface SideSceneryItem {
  group: THREE.Group;
  z: number;
  sideOffset: number; // perpendicular distance from curved track centerline
  localRotY: number;
}
import { getLaneX, clampLane, calculateRunScore, tickPowerupTimers, getTrackCurveX, getTrackCurveAngle } from './rules';
import { sound } from '../audio/soundManager';

export interface GameEngineCallbacks {
  onScoreUpdate: (stats: RunStats) => void;
  onPowerupUpdate: (powerups: PowerupState, hoverboardActive: boolean, hoverboardTime: number) => void;
  onGameOver: (finalStats: RunStats) => void;
  onSplashText?: (text: string, style: ComicSplashStyle, x?: number, y?: number) => void;
}

interface ActiveObstacle {
  id: number;
  type: 'train' | 'barrier_low' | 'barrier_high';
  lane: number;
  group: THREE.Group;
  z: number;
  y: number;
  width: number;
  height: number;
  depth: number;
  hasRamp?: boolean;
  speed?: number; // for moving oncoming train
}

interface ActiveCoin {
  id: number;
  lane: number;
  group: THREE.Group;
  x: number;
  y: number;
  z: number;
  collected: boolean;
}

interface ActivePowerupItem {
  id: number;
  type: PowerupType;
  lane: number;
  group: THREE.Group;
  x: number;
  y: number;
  z: number;
  collected: boolean;
}

export class GameEngine {
  private container: HTMLElement;
  private callbacks: GameEngineCallbacks;
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private isSoftwareGl: boolean = false;
  private frameId: number = 0;

  // Running State
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private city: SouthAfricanCity = 'soweto';
  private characterId: CharacterId = 'skeleton';
  private characterOutfit: string = '#f8fafc';

  // Game Stats
  private distance: number = 0;
  private coins: number = 0;
  private score: number = 0;
  private multiplier: number = 10;
  private highScore: number = 0;
  private totalCoins: number = 0;
  private currentSpeed: number = BASE_SPEED;

  // Player Physics
  private currentLane: number = 0; // -1, 0, 1
  private targetLane: number = 0;
  private playerX: number = 0;
  private playerY: number = 0;
  private playerZ: number = 0;
  private playerVy: number = 0;
  private isJumping: boolean = false;
  private isRolling: boolean = false;
  private rollTimer: number = 0;
  private groundY: number = 0; // 0 on track, TRAIN_HEIGHT on train

  // Hoverboard & Powerups
  private hasHoverboard: boolean = false;
  private hoverboardTimer: number = 0;
  private powerups: PowerupState = { sneakers: 0, magnet: 0, jetpack: 0, multiplier: 0 };

  // Inspector Chase Stumble Mechanic
  private inspectorOffsetZ: number = 10.0; // distance behind player (normal = 10, stumbled = 3.5)
  private stumbleTimer: number = 0;

  // 3D Meshes & Scene Objects
  private playerModel!: ReturnType<typeof createCharacterModel>;
  private inspectorModel!: ReturnType<typeof createInspectorModel>;
  private landmarkGroup!: THREE.Group;
  private sideSceneryGroup: THREE.Group = new THREE.Group();
  private sideScenery: SideSceneryItem[] = [];
  private catenaryInstances!: THREE.Group;
  private groundMesh!: THREE.Mesh;
  private ballastTexture!: THREE.CanvasTexture;
  private railsMesh!: THREE.Mesh;
  private curbsMesh!: THREE.Mesh;
  private tiesInstancedMesh!: THREE.InstancedMesh;
  private obstacles: ActiveObstacle[] = [];
  private activeCoins: ActiveCoin[] = [];
  private activePowerups: ActivePowerupItem[] = [];

  // Particle System
  private particles: Particle[] = [];
  private particleGroup: THREE.Group = new THREE.Group();
  private dustTimer: number = 0;

  // Track Chunk generation
  private nextSpawnZ: number = -20;
  private nextObstacleId: number = 1;
  private animClock: number = 0;

  // Input listeners cleanup
  private cleanupListeners: () => void = () => {};

  constructor(container: HTMLElement, city: SouthAfricanCity, callbacks: GameEngineCallbacks) {
    this.container = container;
    this.city = city;
    this.callbacks = callbacks;
    this.highScore = parseInt(localStorage.getItem('mzansi_high_score') || '0', 10);
    this.totalCoins = parseInt(localStorage.getItem('mzansi_total_coins') || '0', 10);

    this.initThree();
    this.setupScene();
    this.setupInput();
  }

  private initThree() {
    const gl = document.createElement('canvas').getContext('webgl2');
    if (gl) {
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      this.isSoftwareGl = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    } else {
      this.isSoftwareGl = true;
    }

    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
      preserveDrawingBuffer: true,
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(65, width / height, 0.5, 250);
    this.camera.position.set(0, 4.8, 6.2);
    this.camera.lookAt(0, 1.8, -4.0);

    // Environment reflections
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();
  }

  public setCity(city: SouthAfricanCity) {
    this.city = city;
    this.setupSkyAndLighting();
    if (this.landmarkGroup) {
      this.scene.remove(this.landmarkGroup);
    }
    this.landmarkGroup = createLandmarkMesh(this.city);
    this.scene.add(this.landmarkGroup);

    // Rebuild city-specific roadside scenery that dynamically bends with tracks
    this.initSideScenery();
  }

  public setCharacter(characterId: CharacterId, color?: string) {
    this.characterId = characterId;
    if (color) this.characterOutfit = color;
    if (this.playerModel) {
      this.scene.remove(this.playerModel.group);
    }
    this.playerModel = createCharacterModel(this.characterId, this.characterOutfit);
    if (this.isTitleLooping || !this.isRunning) {
      this.playerModel.group.rotation.y = Math.PI - 0.28;
    }
    this.updatePlayerHoverboardMesh();
    this.scene.add(this.playerModel.group);
  }

  public setCharacterOutfit(color: string) {
    this.characterOutfit = color;
    if (this.playerModel) {
      this.scene.remove(this.playerModel.group);
    }
    this.playerModel = createCharacterModel(this.characterId, this.characterOutfit);
    if (this.isTitleLooping || !this.isRunning) {
      this.playerModel.group.rotation.y = Math.PI - 0.28;
    }
    this.updatePlayerHoverboardMesh();
    this.scene.add(this.playerModel.group);
  }

  public setCustomGltfModel(
    gltfScene: THREE.Group,
    animations: THREE.AnimationClip[] = [],
    name: string = 'Custom 3D Runner'
  ) {
    if (this.playerModel) {
      this.scene.remove(this.playerModel.group);
    }
    this.playerModel = createCustomGltfCharacter(gltfScene, animations);
    if (this.isTitleLooping || !this.isRunning) {
      this.playerModel.group.rotation.y = Math.PI - 0.28;
    }
    this.updatePlayerHoverboardMesh();
    this.scene.add(this.playerModel.group);
    this.triggerSplash(`${name.toUpperCase()} LOADED!`, 'wow');
  }

  private hoverboardId: string = 'kasi_cruiser';

  public setHoverboard(boardId: string) {
    this.hoverboardId = boardId;
    this.updatePlayerHoverboardMesh();
  }

  public updatePlayerHoverboardMesh() {
    if (!this.playerModel || !this.playerModel.hoverboardMesh) return;
    const mesh = this.playerModel.hoverboardMesh;
    mesh.clear();

    // v5 rideable art installs itself when loaded, including when the menu is open.
    const modeledBoard = this.hoverboardId === 'kasi_cruiser' ? 'kasi_cruiser'
      : this.hoverboardId === 'bmx_bicycle' ? 'bmx_bicycle'
      : this.hoverboardId === 'electric_scooter' ? 'electric_scooter'
      : null;
    if (modeledBoard) {
      const target: [number, number, number] = modeledBoard === 'bmx_bicycle'
        ? [0.85, 1.45, 2.5]
        : modeledBoard === 'electric_scooter' ? [0.75, 1.4, 1.7]
          : [0.95, 0.35, 1.9];
      const model = assetManager.instantiate(modeledBoard, { targetDimensions: target });
      model.rotation.y = Math.PI;
      model.position.y = -0.08;
      mesh.add(model);
      return;
    }

    // Default procedural deck
    const isToxicSkull = this.hoverboardId === 'skull_skateboard';
    const deckColor = isToxicSkull ? 0x18181b : 0x059669;
    const rimColor = isToxicSkull ? 0x84cc16 : 0x34d399;
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

    const thrusterL = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.14, 0.25, 12),
      new THREE.MeshStandardMaterial({ color: isToxicSkull ? 0x1f2937 : 0x334155, metalness: 0.8 })
    );
    thrusterL.rotation.x = Math.PI / 2;
    thrusterL.position.set(-0.3, -0.08, -0.75);
    const thrusterR = thrusterL.clone();
    thrusterR.position.x = 0.3;

    mesh.add(deck, neonRim, thrusterL, thrusterR);
  }

  private triggerSplash(text: string, style: ComicSplashStyle, x?: number, y?: number) {
    this.callbacks.onSplashText?.(text, style, x, y);
  }

  private setupSkyAndLighting() {
    const cfg = CITIES[this.city];
    this.scene.background = new THREE.Color(cfg.skyColor);
    this.scene.fog = new THREE.FogExp2(cfg.fogColor, 0.016);

    // Clear old lights if updating city
    const oldLights = this.scene.children.filter((c) => c instanceof THREE.Light);
    oldLights.forEach((l) => this.scene.remove(l));

    // Warm Sun Key Light
    const sunLight = new THREE.DirectionalLight(0xfff7ed, 1.6);
    sunLight.position.set(15, 30, 20);
    sunLight.castShadow = !this.isSoftwareGl;
    if (!this.isSoftwareGl) {
      sunLight.shadow.mapSize.width = 1024;
      sunLight.shadow.mapSize.height = 1024;
      sunLight.shadow.camera.near = 0.5;
      sunLight.shadow.camera.far = 80;
      sunLight.shadow.camera.left = -15;
      sunLight.shadow.camera.right = 15;
      sunLight.shadow.camera.top = 20;
      sunLight.shadow.camera.bottom = -10;
      sunLight.shadow.bias = -0.0005;
    }
    this.scene.add(sunLight);

    // Warm Golden Rim / Backlight for cinematic edge definition on character & trains
    const rimLight = new THREE.DirectionalLight(0xfef08a, 0.75);
    rimLight.position.set(-15, 22, -25);
    this.scene.add(rimLight);

    // Cool Sky & Warm Earth Fill
    const hemiLight = new THREE.HemisphereLight(cfg.skyColor, 0x475569, 0.85);
    this.scene.add(hemiLight);
  }

  private setupScene() {
    this.setupSkyAndLighting();

    // High-Fidelity Ballast Gravel Ground Bed (Segmented for procedural bending)
    this.ballastTexture = createBallastTexture();
    const groundGeo = this.createGroundGeometry(70, 4);
    const groundMat = new THREE.MeshStandardMaterial({
      map: this.ballastTexture,
      roughness: 0.85,
      metalness: 0.1,
      side: THREE.DoubleSide,
    });
    this.groundMesh = new THREE.Mesh(groundGeo, groundMat);
    this.groundMesh.receiveShadow = true;
    this.scene.add(this.groundMesh);

    // Low Railway Bed Shoulder Curbs (Segmented for procedural bending, preserving landscape vistas)
    const curbsGeo = this.createCurbsGeometry(2, 70);
    const curbMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.8,
      side: THREE.DoubleSide,
    });
    this.curbsMesh = new THREE.Mesh(curbsGeo, curbMat);
    this.scene.add(this.curbsMesh);

    // 6 Shiny Steel Rails (Left & Right rail across 3 lanes, segmented for procedural bending)
    const railsGeo = this.createRailsGeometry(6, 70);
    const railsMat = new THREE.MeshStandardMaterial({
      color: 0xc8d1dc,
      metalness: 0.9,
      roughness: 0.18,
      side: THREE.DoubleSide,
    });
    this.railsMesh = new THREE.Mesh(railsGeo, railsMat);
    this.scene.add(this.railsMesh);

    // Railway Sleepers / Ties (InstancedMesh updated along curved tracks)
    const TOTAL_TIES = 133 * 3;
    const tieGeo = new THREE.BoxGeometry(2.1, 0.08, 0.35);
    const tieMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.85 });
    this.tiesInstancedMesh = new THREE.InstancedMesh(tieGeo, tieMat, TOTAL_TIES);
    this.scene.add(this.tiesInstancedMesh);

    // Initial positioning of track curvature
    this.updateTrackCurvature();

    // Overhead catenary wire gantries
    this.catenaryInstances = new THREE.Group();
    for (let z = 10; z >= -220; z -= 35) {
      const gantry = this.createCatenaryGantry();
      gantry.position.z = z;
      this.catenaryInstances.add(gantry);
    }
    this.scene.add(this.catenaryInstances);

    // Dynamic Roadside Scenery Group (Bespoke buildings, vehicles, flora & comic signs)
    this.scene.add(this.sideSceneryGroup);
    this.initSideScenery();

    // South Africa Landmark distant backdrop
    this.landmarkGroup = createLandmarkMesh(this.city);
    this.scene.add(this.landmarkGroup);

    // Player Model
    this.playerModel = createCharacterModel(this.characterId, this.characterOutfit);
    this.scene.add(this.playerModel.group);

    // Inspector & Dog Model
    this.inspectorModel = createInspectorModel();
    this.inspectorModel.group.position.set(0, 0, this.inspectorOffsetZ);
    this.scene.add(this.inspectorModel.group);

    // Particle System Group
    this.scene.add(this.particleGroup);

    // Resize handler
    const onResize = () => {
      const w = this.container.clientWidth || window.innerWidth;
      const h = this.container.clientHeight || window.innerHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);
    this.cleanupListeners = () => {
      window.removeEventListener('resize', onResize);
    };
  }

  private createCatenaryGantry(): THREE.Group {
    const gantry = new THREE.Group();
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.7, roughness: 0.3 });

    // Wide side pillars set well outside track curbs (track curbs at ±5.2)
    const pillarL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 8.2, 0.2), metalMat);
    pillarL.position.set(-7.8, 4.1, 0);

    const pillarR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 8.2, 0.2), metalMat);
    pillarR.position.set(7.8, 4.1, 0);

    // Overhead truss beam spanning 16.2 units
    const beam = new THREE.Mesh(new THREE.BoxGeometry(16.2, 0.25, 0.25), metalMat);
    beam.position.set(0, 8.1, 0);

    gantry.add(pillarL, pillarR, beam);
    return gantry;
  }

  private createGroundGeometry(segZ: number, segX: number): THREE.BufferGeometry {
    const geo = new THREE.BufferGeometry();
    const numVerts = (segX + 1) * (segZ + 1);
    const positions = new Float32Array(numVerts * 3);
    const uvs = new Float32Array(numVerts * 2);
    const indices: number[] = [];

    let uvIdx = 0;
    for (let i = 0; i <= segZ; i++) {
      const v = (i / segZ) * 35;
      for (let c = 0; c <= segX; c++) {
        const u = (c / segX) * 6;
        uvs[uvIdx++] = u;
        uvs[uvIdx++] = v;
      }
    }

    for (let i = 0; i < segZ; i++) {
      for (let c = 0; c < segX; c++) {
        const row1 = i * (segX + 1);
        const row2 = (i + 1) * (segX + 1);
        const a = row1 + c;
        const b = row1 + c + 1;
        const d = row2 + c;
        const e = row2 + c + 1;

        indices.push(a, b, d);
        indices.push(b, e, d);
      }
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    return geo;
  }

  private createRailsGeometry(numRails: number, segZ: number): THREE.BufferGeometry {
    const geo = new THREE.BufferGeometry();
    const vertsPerRail = (segZ + 1) * 4;
    const totalVerts = numRails * vertsPerRail;
    const positions = new Float32Array(totalVerts * 3);
    const indices: number[] = [];

    for (let r = 0; r < numRails; r++) {
      const baseRailVert = r * vertsPerRail;
      for (let i = 0; i < segZ; i++) {
        const curr = baseRailVert + i * 4;
        const next = baseRailVert + (i + 1) * 4;

        // Quad 1: Inner side
        indices.push(curr + 0, curr + 1, next + 1);
        indices.push(curr + 0, next + 1, next + 0);

        // Quad 2: Top face
        indices.push(curr + 1, curr + 2, next + 2);
        indices.push(curr + 1, next + 2, next + 1);

        // Quad 3: Outer side
        indices.push(curr + 2, curr + 3, next + 3);
        indices.push(curr + 2, next + 3, next + 2);
      }
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setIndex(indices);
    return geo;
  }

  private createCurbsGeometry(numCurbs: number, segZ: number): THREE.BufferGeometry {
    const geo = new THREE.BufferGeometry();
    const vertsPerCurb = (segZ + 1) * 4;
    const totalVerts = numCurbs * vertsPerCurb;
    const positions = new Float32Array(totalVerts * 3);
    const indices: number[] = [];

    for (let c = 0; c < numCurbs; c++) {
      const baseCurbVert = c * vertsPerCurb;
      for (let i = 0; i < segZ; i++) {
        const curr = baseCurbVert + i * 4;
        const next = baseCurbVert + (i + 1) * 4;

        // Quad 1: Inner side
        indices.push(curr + 0, curr + 1, next + 1);
        indices.push(curr + 0, next + 1, next + 0);

        // Quad 2: Top surface
        indices.push(curr + 1, curr + 2, next + 2);
        indices.push(curr + 1, next + 2, next + 1);

        // Quad 3: Outer face
        indices.push(curr + 2, curr + 3, next + 3);
        indices.push(curr + 2, next + 3, next + 2);
      }
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setIndex(indices);
    return geo;
  }

  public updateTrackCurvature() {
    if (!this.groundMesh || !this.railsMesh || !this.curbsMesh || !this.tiesInstancedMesh) return;

    const SEG_Z = 70;
    const startZ = 25;
    const endZ = -255;
    const stepZ = (endZ - startZ) / SEG_Z; // -4.0 units per slice

    // 1. Update Ground Mesh Vertices
    const groundPos = this.groundMesh.geometry.attributes.position as THREE.BufferAttribute;
    const gArray = groundPos.array as Float32Array;
    let gIdx = 0;
    for (let i = 0; i <= SEG_Z; i++) {
      const z = startZ + i * stepZ;
      const cx = getTrackCurveX(z, this.distance, this.city);
      const angle = getTrackCurveAngle(z, this.distance, this.city);
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      for (let c = 0; c <= 4; c++) {
        const baseX = -22 + c * 11; // Spans width: -22, -11, 0, 11, 22
        gArray[gIdx++] = cx + baseX * cosA;
        gArray[gIdx++] = 0.0;
        gArray[gIdx++] = z - baseX * sinA;
      }
    }
    groundPos.needsUpdate = true;

    // Scroll ballast gravel texture seamlessly with distance
    if (this.ballastTexture) {
      this.ballastTexture.offset.y = -(this.distance * 0.04) % 1;
    }

    // 2. Update Rails Vertices (6 Rails across Left, Center, Right lanes)
    const railsPos = this.railsMesh.geometry.attributes.position as THREE.BufferAttribute;
    const rArray = railsPos.array as Float32Array;
    const railOffsets = [-3.35, -1.85, -0.75, 0.75, 1.85, 3.35];
    const halfRailW = 0.042;
    let rIdx = 0;

    for (let r = 0; r < 6; r++) {
      const baseOff = railOffsets[r];
      for (let i = 0; i <= SEG_Z; i++) {
        const z = startZ + i * stepZ;
        const cx = getTrackCurveX(z, this.distance, this.city);
        const angle = getTrackCurveAngle(z, this.distance, this.city);
        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);

        const innerOff = baseOff - halfRailW;
        const outerOff = baseOff + halfRailW;

        const innerX = cx + innerOff * cosA;
        const innerZ = z - innerOff * sinA;
        const outerX = cx + outerOff * cosA;
        const outerZ = z - outerOff * sinA;

        // V0: Inner bottom
        rArray[rIdx++] = innerX;
        rArray[rIdx++] = 0.01;
        rArray[rIdx++] = innerZ;

        // V1: Inner top
        rArray[rIdx++] = innerX;
        rArray[rIdx++] = 0.12;
        rArray[rIdx++] = innerZ;

        // V2: Outer top
        rArray[rIdx++] = outerX;
        rArray[rIdx++] = 0.12;
        rArray[rIdx++] = outerZ;

        // V3: Outer bottom
        rArray[rIdx++] = outerX;
        rArray[rIdx++] = 0.01;
        rArray[rIdx++] = outerZ;
      }
    }
    railsPos.needsUpdate = true;

    // 3. Update Curbs Vertices (2 Retaining Curbs: Left at -5.2, Right at +5.2)
    const curbsPos = this.curbsMesh.geometry.attributes.position as THREE.BufferAttribute;
    const cArray = curbsPos.array as Float32Array;
    let cIdx = 0;
    const curbOffsets = [-5.2, 5.2];
    const halfCurbW = 0.16;

    for (let curb = 0; curb < 2; curb++) {
      const centerOff = curbOffsets[curb];
      const isLeft = curb === 0;
      for (let i = 0; i <= SEG_Z; i++) {
        const z = startZ + i * stepZ;
        const cx = getTrackCurveX(z, this.distance, this.city);
        const angle = getTrackCurveAngle(z, this.distance, this.city);
        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);

        const innerOff = isLeft ? centerOff + halfCurbW : centerOff - halfCurbW;
        const outerOff = isLeft ? centerOff - halfCurbW : centerOff + halfCurbW;

        const innerX = cx + innerOff * cosA;
        const innerZ = z - innerOff * sinA;
        const outerX = cx + outerOff * cosA;
        const outerZ = z - outerOff * sinA;

        // V0: Inner bottom
        cArray[cIdx++] = innerX;
        cArray[cIdx++] = 0.01;
        cArray[cIdx++] = innerZ;

        // V1: Inner top
        cArray[cIdx++] = innerX;
        cArray[cIdx++] = 0.15;
        cArray[cIdx++] = innerZ;

        // V2: Outer top
        cArray[cIdx++] = outerX;
        cArray[cIdx++] = 0.15;
        cArray[cIdx++] = outerZ;

        // V3: Outer bottom
        cArray[cIdx++] = outerX;
        cArray[cIdx++] = 0.01;
        cArray[cIdx++] = outerZ;
      }
    }
    curbsPos.needsUpdate = true;

    // 4. Update Sleepers / Ties (Instanced along curved track)
    const dummy = new THREE.Object3D();
    let tieIdx = 0;
    for (let z = 18; z >= -220; z -= 1.8) {
      const cx = getTrackCurveX(z, this.distance, this.city);
      const angle = getTrackCurveAngle(z, this.distance, this.city);
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      for (let l = 0; l < 3; l++) {
        const laneOffset = LANES[l];
        const tx = cx + laneOffset * cosA;
        const tz = z - laneOffset * sinA;
        dummy.position.set(tx, 0.04, tz);
        dummy.rotation.set(0, angle, 0);
        dummy.updateMatrix();
        this.tiesInstancedMesh.setMatrixAt(tieIdx++, dummy.matrix);
      }
    }
    this.tiesInstancedMesh.instanceMatrix.needsUpdate = true;
  }

  private setupInput() {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    let lastTapTime = 0;

    const onTouchStart = (e: TouchEvent) => {
      if (!this.isRunning || this.isPaused) return;
      const touch = e.touches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      touchStartTime = Date.now();

      // Double Tap detection for Hoverboard
      const now = Date.now();
      if (now - lastTapTime < 320) {
        this.activateHoverboard();
      }
      lastTapTime = now;
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!this.isRunning || this.isPaused) return;
      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStartX;
      const dy = touch.clientY - touchStartY;
      const dt = Date.now() - touchStartTime;

      const minSwipeDist = 28;
      if (Math.abs(dx) > Math.abs(dy)) {
        // Horizontal Swipe
        if (dx < -minSwipeDist) {
          this.moveLane(-1);
        } else if (dx > minSwipeDist) {
          this.moveLane(1);
        }
      } else {
        // Vertical Swipe
        if (dy < -minSwipeDist) {
          this.jump();
        } else if (dy > minSwipeDist) {
          this.roll();
        }
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (!this.isRunning || this.isPaused) return;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        this.moveLane(-1);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        this.moveLane(1);
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        this.jump();
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        this.roll();
      } else if (e.key === ' ' || e.key === 'Spacebar') {
        this.activateHoverboard();
      }
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('keydown', onKeyDown);

    const prevCleanup = this.cleanupListeners;
    this.cleanupListeners = () => {
      prevCleanup();
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('keydown', onKeyDown);
    };
  }

  public moveLane(direction: number) {
    const nextLane = clampLane(this.targetLane + direction);
    if (nextLane !== this.targetLane) {
      this.targetLane = nextLane;
      sound.playLaneSwitch();
      if (navigator.vibrate) navigator.vibrate(15);
    }
  }

  public jump() {
    // Can jump if grounded on track or on top of train
    if (!this.isJumping) {
      this.isJumping = true;
      this.isRolling = false;
      const isSneakers = this.powerups.sneakers > 0;
      this.playerVy = isSneakers ? SNEAKER_JUMP_VELOCITY : JUMP_VELOCITY;
      sound.playJump(isSneakers);
      if (Math.random() < 0.75) {
        const jumpWords = ['HOP!', 'LEAP!', 'UP!', 'SPRING!'];
        this.triggerSplash(jumpWords[Math.floor(Math.random() * jumpWords.length)], 'zoom');
      }
      if (navigator.vibrate) navigator.vibrate(20);
    }
  }

  public roll() {
    this.isRolling = true;
    this.rollTimer = ROLL_DURATION;
    // If airborne, dive down fast!
    if (this.isJumping) {
      this.playerVy = -18.0;
    }
    sound.playSlide();
    if (Math.random() < 0.75) {
      const rollWords = ['ZOOM!', 'SWOOSH!', 'SLIDE!'];
      this.triggerSplash(rollWords[Math.floor(Math.random() * rollWords.length)], 'zoom');
    }
    if (navigator.vibrate) navigator.vibrate(20);
  }

  public activateHoverboard() {
    if (!this.hasHoverboard) {
      this.hasHoverboard = true;
      this.hoverboardTimer = HOVERBOARD_DURATION;
      this.playerModel.hoverboardMesh.visible = true;
      this.triggerSplash("SURF'S UP!", 'power');
      sound.playHoverboard();
      if (navigator.vibrate) navigator.vibrate([30, 20, 40]);
    }
  }

  public start() {
    this.isTitleLooping = false;
    this.isRunning = true;
    this.isPaused = false;
    this.distance = 0;
    this.coins = 0;
    this.score = 0;
    this.currentSpeed = BASE_SPEED;
    this.currentLane = 0;
    this.targetLane = 0;
    this.playerX = 0;
    this.playerY = 0;
    this.playerZ = 0;
    this.playerVy = 0;
    this.isJumping = false;
    this.isRolling = false;
    this.groundY = 0;
    this.hasHoverboard = false;
    this.hoverboardTimer = 0;
    // Classic opening chase: Inspector starts right on player's heels for first 3.5 seconds!
    this.stumbleTimer = 3.5;
    this.inspectorOffsetZ = 3.4;
    this.powerups = { sneakers: 0, magnet: 0, jetpack: 0, multiplier: 0 };
    this.nextSpawnZ = -25;

    // Reset models
    this.playerModel.hoverboardMesh.visible = false;
    this.playerModel.jetpackMesh.visible = false;
    this.playerModel.sneakersGroup.visible = false;

    // Clear existing obstacles and coins
    this.clearSpawnedObjects();

    this.isTitleLooping = false;
    this.playerModel.group.rotation.y = 0;
    this.camera.position.set(0, 4.8, 6.2);
    this.camera.updateProjectionMatrix();
    this.camera.lookAt(0, 1.8, -4.0);

    // Spawn first obstacle chunk immediately at Z = -35 so action starts right away!
    this.spawnNextChunkAt(-35);
    this.spawnNextChunkAt(-75);
    this.spawnNextChunkAt(-115);
    this.spawnNextChunkAt(-155);

    sound.startBGM();
    sound.playWhistle();

    // Start 60 FPS Render Loop
    this.startLoop();
  }

  private isTitleLooping: boolean = false;

  public startTitleIdleLoop() {
    this.isTitleLooping = true;
    let lastTime = performance.now();

    const titleTick = () => {
      if (!this.isTitleLooping || this.isRunning) return;

      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      this.animClock += dt;

      // Gentle idling character breathing & arm sway facing 3/4 front so all features are visible
      const idle = Math.sin(this.animClock * 2.5);
      this.playerModel.group.position.set(0, idle * 0.03, 0);
      this.playerModel.group.rotation.y = Math.PI - 0.28 + Math.sin(this.animClock * 1.0) * 0.12;
      this.playerModel.leftArm.rotation.x = idle * 0.15;
      this.playerModel.rightArm.rotation.x = -idle * 0.15;

      // Flutter cape in idle
      if (this.playerModel.capeMesh) {
        this.playerModel.capeMesh.rotation.x = 0.25 + Math.sin(this.animClock * 5) * 0.08;
      }
      // Pulse lightsaber blade in idle
      if (this.playerModel.saberBlade) {
        const mat = this.playerModel.saberBlade.material as THREE.MeshStandardMaterial;
        if (mat) {
          mat.emissiveIntensity = 2.0 + Math.sin(this.animClock * 16) * 0.8;
        }
      }

      // Update custom 3D model skeletal animation mixer if loaded
      if (this.playerModel.mixer) {
        this.playerModel.mixer.update(dt);
      }

      // Inspector and dog idling behind on the track
      this.inspectorModel.group.position.set(1.4, 0, -2.6);
      this.inspectorModel.group.rotation.y = 0.25;

      // Update dynamic track curvature & roadside scenery
      this.updateTrackCurvature();
      this.updateSideSceneryPositions(0);

      // Camera positioned closely in front of the character in 3/4 showcase view
      this.camera.position.set(0, 2.3, 4.2);
      this.camera.lookAt(0, 1.25, 0);

      this.renderer.render(this.scene, this.camera);

      if (this.isSoftwareGl) {
        this.frameId = window.setTimeout(titleTick, 100);
      } else {
        this.frameId = requestAnimationFrame(titleTick);
      }
    };

    titleTick();
  }

  public renderTitleFrame() {
    this.startTitleIdleLoop();
  }

  public returnToMainMenu() {
    this.isRunning = false;
    this.isPaused = false;
    sound.stopBGM();
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    this.clearSpawnedObjects();
    this.playerX = 0;
    this.playerY = 0;
    this.targetLane = 0;
    this.currentLane = 0;
    this.distance = 0;
    this.currentSpeed = BASE_SPEED;
    this.groundY = 0;
    this.hasHoverboard = false;
    this.hoverboardTimer = 0;
    this.powerups = { sneakers: 0, magnet: 0, jetpack: 0, multiplier: 0 };
    if (this.playerModel) {
      this.playerModel.hoverboardMesh.visible = false;
      this.playerModel.jetpackMesh.visible = false;
      this.playerModel.sneakersGroup.visible = false;
    }
    this.startTitleIdleLoop();
  }

  private spawnNextChunkAt(chunkZ: number) {
    this.nextSpawnZ = chunkZ;

    // Pick 1 or 2 lanes to place obstacles
    const occupiedLanes = new Set<number>();
    const numObstacles = Math.random() > 0.4 ? 2 : 1;

    for (let i = 0; i < numObstacles; i++) {
      const laneIdx = ([-1, 0, 1] as const)[Math.floor(Math.random() * 3)];
      if (occupiedLanes.has(laneIdx)) continue;
      occupiedLanes.add(laneIdx);

      const roll = Math.random();
      if (roll < 0.45) {
        // Passenger Train
        this.spawnTrain(laneIdx, chunkZ);
      } else if (roll < 0.75) {
        // Low Jump Barrier
        this.spawnBarrierLow(laneIdx, chunkZ);
      } else {
        // High Slide Barrier
        this.spawnBarrierHigh(laneIdx, chunkZ);
      }
    }

    // In open lanes, spawn coin patterns or powerups
    const openLanes = ([-1, 0, 1] as const).filter((l) => !occupiedLanes.has(l));
    if (openLanes.length > 0) {
      const coinLane = openLanes[0];
      const coinX = getLaneX(coinLane);

      // 10% chance to spawn a powerup item
      if (Math.random() < 0.16) {
        const pTypes: PowerupType[] = ['magnet', 'jetpack', 'sneakers', 'multiplier'];
        const chosen = pTypes[Math.floor(Math.random() * pTypes.length)];
        this.spawnPowerup(chosen, coinX, 1.2, chunkZ);
      } else {
        // Spawn coin row or jump arc
        const isArc = Math.random() > 0.5;
        for (let c = 0; c < 5; c++) {
          const coinZ = chunkZ + c * 3.0;
          const coinY = isArc ? 0.9 + Math.sin((c / 4) * Math.PI) * 1.8 : 0.9;
          this.spawnCoin(coinX, coinY, coinZ);
        }
      }
    }
  }

  public pause() {
    this.isPaused = true;
    sound.stopBGM();
  }

  public resume() {
    this.isPaused = false;
    sound.startBGM();
    this.startLoop();
  }

  private startLoop() {
    let lastTime = performance.now();

    const afterDraw = (cb: () => void) => {
      const gl = this.renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          this.frameId = window.setTimeout(poll, 5);
        } else {
          gl.deleteSync(sync);
          this.frameId = window.setTimeout(cb, 80);
        }
      };
      this.frameId = window.setTimeout(poll, 5);
    };

    const tick = () => {
      if (!this.isRunning || this.isPaused) return;

      const now = performance.now();
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      const dt = Math.min(rawDt, 0.05);

      this.update(dt);
      this.renderer.render(this.scene, this.camera);

      if (this.isSoftwareGl) {
        afterDraw(tick);
      } else {
        this.frameId = requestAnimationFrame(tick);
      }
    };

    if (this.isSoftwareGl) {
      afterDraw(tick);
    } else {
      this.frameId = requestAnimationFrame(tick);
    }
  }

  private update(dt: number) {
    this.animClock += dt;

    // Advance Run Distance & Acceleration
    const isJetpack = this.powerups.jetpack > 0;
    const speedMult = isJetpack ? 1.5 : 1.0;
    const stepDist = this.currentSpeed * speedMult * dt;
    this.distance += stepDist;
    this.currentSpeed = Math.min(MAX_SPEED, this.currentSpeed + SPEED_ACCELERATION * dt);

    // Update dynamic track curvature along running distance
    this.updateTrackCurvature();

    // Score calculation & throttling
    this.score = calculateRunScore(this.distance, this.coins, this.multiplier, this.powerups.multiplier > 0);
    this.callbacks.onScoreUpdate({
      score: this.score,
      coins: this.coins,
      distance: Math.floor(this.distance),
      multiplier: this.multiplier * (this.powerups.multiplier > 0 ? 2 : 1),
      highScore: Math.max(this.highScore, this.score),
      totalCoins: this.totalCoins + this.coins,
    });

    // Tick Powerups
    this.powerups = tickPowerupTimers(this.powerups, dt);
    if (this.hasHoverboard) {
      this.hoverboardTimer = Math.max(0, this.hoverboardTimer - dt);
      if (this.hoverboardTimer <= 0) {
        this.hasHoverboard = false;
        this.playerModel.hoverboardMesh.visible = false;
      }
    }
    this.playerModel.jetpackMesh.visible = this.powerups.jetpack > 0;
    this.playerModel.sneakersGroup.visible = this.powerups.sneakers > 0;
    this.callbacks.onPowerupUpdate(this.powerups, this.hasHoverboard, this.hoverboardTimer);

    // Lateral Lane Movement (exponential damp toward target lane X)
    const targetX = getLaneX(this.targetLane);
    this.playerX = THREE.MathUtils.damp(this.playerX, targetX, 14, dt);
    this.currentLane = Math.round(this.playerX / LANE_WIDTH);

    // Vertical Physics (Jump / Fall / Ground)
    const targetGroundY = isJetpack ? JETPACK_HEIGHT : this.groundY;

    if (isJetpack) {
      this.playerY = THREE.MathUtils.damp(this.playerY, JETPACK_HEIGHT, 6, dt);
      this.playerVy = 0;
      this.isJumping = false;
    } else {
      this.playerVy -= GRAVITY * dt;
      this.playerY += this.playerVy * dt;

      if (this.playerY <= targetGroundY) {
        this.playerY = targetGroundY;
        this.playerVy = 0;
        this.isJumping = false;
      }
    }

    // Roll duration
    if (this.isRolling) {
      this.rollTimer -= dt;
      if (this.rollTimer <= 0) {
        this.isRolling = false;
      }
    }

    // Update Player Mesh Position & Tilt into upcoming bends
    this.playerModel.group.position.set(this.playerX, this.playerY, 0);

    // Dynamic runner banking into curves + lateral shift: player faces FORWARD down the tracks (Math.PI)
    const lateralVel = targetX - this.playerX;
    const nearCurveAngle = getTrackCurveAngle(-12, this.distance, this.city);
    // Forward-facing track alignment with smooth curve banking
    this.playerModel.group.rotation.y = Math.PI - nearCurveAngle * 0.45;
    this.playerModel.group.rotation.z = lateralVel * 0.12 + nearCurveAngle * 0.22;

    // Running limb animation cycle
    const strideFreq = this.currentSpeed * 0.8;
    const stride = Math.sin(this.animClock * strideFreq);

    if (this.hasHoverboard) {
      if (this.hoverboardId === 'bmx_bicycle') {
        // BMX Riding Pose: both hands reach forward onto handlebars, pedaling cadence
        const pedalCycle = Math.sin(this.animClock * this.currentSpeed * 0.7);
        this.playerModel.group.scale.set(1.0, 1.0, 1.0);
        this.playerModel.leftArm.rotation.set(-1.15, 0.18, 0);
        this.playerModel.rightArm.rotation.set(-1.15, -0.18, 0);
        this.playerModel.leftLeg.rotation.set(0.35 + pedalCycle * 0.3, 0, 0);
        this.playerModel.rightLeg.rotation.set(0.35 - pedalCycle * 0.3, 0, 0);
      } else if (this.hoverboardId === 'electric_scooter') {
        // E-Scooter Riding Pose: upright forward stance, both hands gripping handlebars, feet planted on deck
        this.playerModel.group.scale.set(1.0, 1.0, 1.0);
        this.playerModel.leftArm.rotation.set(-1.25, 0.12, 0);
        this.playerModel.rightArm.rotation.set(-1.25, -0.12, 0);
        this.playerModel.leftLeg.rotation.set(0.12, 0, 0);
        this.playerModel.rightLeg.rotation.set(-0.28, 0, 0);
      } else {
        // Skateboard / Kasi Cruiser / Hoverboard Surfing Pose:
        // Surfer stands sideways across the forward-gliding board with athletic balance
        this.playerModel.group.scale.set(1.0, 1.0, 1.0);
        this.playerModel.leftArm.rotation.set(-0.55, 0.35, 0);
        this.playerModel.rightArm.rotation.set(0.55, -0.35, 0);
        this.playerModel.leftLeg.rotation.set(-0.22, 0.35, 0);
        this.playerModel.rightLeg.rotation.set(0.22, 0.35, 0);
      }
    } else if (this.isJumping) {
      // Jump pose: arms up, knees slightly bent
      this.playerModel.group.scale.set(1.0, 1.0, 1.0);
      this.playerModel.leftArm.rotation.set(-1.8, 0, 0);
      this.playerModel.rightArm.rotation.set(-1.8, 0, 0);
      this.playerModel.leftLeg.rotation.set(0.6, 0, 0);
      this.playerModel.rightLeg.rotation.set(0.6, 0, 0);
    } else if (this.isRolling) {
      // Crouch / tuck
      this.playerModel.group.scale.set(1.0, 0.55, 1.0);
      this.playerModel.leftArm.rotation.set(1.0, 0, 0);
      this.playerModel.rightArm.rotation.set(1.0, 0, 0);
      this.playerModel.leftLeg.rotation.set(0, 0, 0);
      this.playerModel.rightLeg.rotation.set(0, 0, 0);
    } else {
      // Standard sprint stride
      this.playerModel.group.scale.set(1.0, 1.0, 1.0);
      this.playerModel.leftArm.rotation.set(stride * 0.9, 0, 0);
      this.playerModel.rightArm.rotation.set(-stride * 0.9, 0, 0);
      this.playerModel.leftLeg.rotation.set(-stride * 1.1, 0, 0);
      this.playerModel.rightLeg.rotation.set(stride * 1.1, 0, 0);
    }

    // Superhero Cape Wind Flutter
    if (this.playerModel.capeMesh) {
      this.playerModel.capeMesh.rotation.x = 0.25 + Math.sin(this.animClock * 14) * 0.12;
      this.playerModel.capeMesh.rotation.z = Math.cos(this.animClock * 10) * 0.05;
    }

    // Jedi Lightsaber Blade Energy Glow Pulse
    if (this.playerModel.saberBlade) {
      const mat = this.playerModel.saberBlade.material as THREE.MeshStandardMaterial;
      if (mat) {
        mat.emissiveIntensity = 1.8 + Math.sin(this.animClock * 18) * 0.6;
      }
    }

    // Custom Imported 3D Model Skeletal Animation Mixer
    if (this.playerModel.mixer) {
      this.playerModel.mixer.update(dt);
    }

    // Inspector Follower Logic along curved track - faces FORWARD chasing player
    if (this.stumbleTimer > 0) {
      this.stumbleTimer -= dt;
      // Close behind player on stumble
      this.inspectorOffsetZ = THREE.MathUtils.damp(this.inspectorOffsetZ, 3.8, 8, dt);
    } else {
      // Inspector drops back
      this.inspectorOffsetZ = THREE.MathUtils.damp(this.inspectorOffsetZ, 12.0, 3, dt);
    }
    const inspCurveX = getTrackCurveX(this.inspectorOffsetZ, this.distance, this.city);
    const inspAngle = getTrackCurveAngle(this.inspectorOffsetZ, this.distance, this.city);
    this.inspectorModel.group.position.set(this.playerX * 0.8 + inspCurveX, 0, this.inspectorOffsetZ);
    this.inspectorModel.group.rotation.y = Math.PI - inspAngle;
    this.inspectorModel.inspectorLegL.rotation.x = -stride * 1.0;
    this.inspectorModel.inspectorLegR.rotation.x = stride * 1.0;

    // Move Obstacles, Coins & World Environment toward camera (-Z to +Z relative)
    this.updateTrackAndEnvironment(stepDist, dt);

    // Collision Detection
    this.checkCollisions();

    // Particles (Sneaker dust puffs and jetpack flames)
    this.dustTimer += dt;
    if (this.dustTimer > 0.12 && !isJetpack && this.playerY <= this.groundY + 0.15 && !this.isRolling) {
      this.dustTimer = 0;
      this.spawnDust(this.playerX, this.playerY, 0);
    }
    if (isJetpack) {
      this.spawnJetpackFlames(this.playerX, this.playerY, 0);
    }
    this.updateParticles(dt);

    // Dynamic Speed FOV Kick
    const targetFov = isJetpack ? 75 : THREE.MathUtils.mapLinear(this.currentSpeed, BASE_SPEED, MAX_SPEED, 65, 73);
    if (Math.abs(this.camera.fov - targetFov) > 0.1) {
      this.camera.fov = THREE.MathUtils.damp(this.camera.fov, targetFov, 3, dt);
      this.camera.updateProjectionMatrix();
    }

    // Camera follow with spring damping, dynamic track bend lookahead & banking
    const lookAheadTrackX = getTrackCurveX(-24, this.distance, this.city);
    const camTrackX = getTrackCurveX(5.5, this.distance, this.city);
    const upcomingCurveAngle = getTrackCurveAngle(-25, this.distance, this.city);

    const targetCamY = isJetpack ? JETPACK_HEIGHT + 4.5 : Math.max(4.8, this.playerY + 4.2);
    const targetCamX = camTrackX * 0.35 + this.playerX * 0.45;
    this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, targetCamX, 9, dt);
    this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, targetCamY, 8, dt);
    this.camera.lookAt(lookAheadTrackX * 0.45 + this.playerX * 0.25, isJetpack ? JETPACK_HEIGHT : 1.6, -14);

    // Dynamic camera banking roll (leaning subtly into the curve)
    this.camera.rotation.z = THREE.MathUtils.damp(this.camera.rotation.z, -upcomingCurveAngle * 0.22, 5, dt);
  }

  public spawnDust(x: number, y: number, z: number) {
    if (this.particles.length > 45) return;
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 6, 6),
      new THREE.MeshBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.55 })
    );
    mesh.position.set(x + (Math.random() - 0.5) * 0.35, y + 0.08, z + 0.25);
    this.particleGroup.add(mesh);
    this.particles.push({
      mesh,
      vx: (Math.random() - 0.5) * 0.7,
      vy: 0.4 + Math.random() * 0.5,
      vz: 1.8 + Math.random() * 1.5,
      life: 0.32,
      maxLife: 0.32,
    });
  }

  public spawnSparkles(x: number, y: number, z: number) {
    for (let i = 0; i < 8; i++) {
      const mesh = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.12, 0),
        new THREE.MeshBasicMaterial({ color: 0xfef08a })
      );
      mesh.position.set(x, y, z);
      this.particleGroup.add(mesh);
      const angle = (i / 8) * Math.PI * 2;
      this.particles.push({
        mesh,
        vx: Math.cos(angle) * (2.2 + Math.random() * 2.5),
        vy: Math.sin(angle) * (2.2 + Math.random() * 2.5),
        vz: (Math.random() - 0.5) * 2.5,
        life: 0.4,
        maxLife: 0.4,
      });
    }
  }

  public spawnJetpackFlames(x: number, y: number, z: number) {
    [-0.18, 0.18].forEach((offsetX) => {
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.15, 6, 6),
        new THREE.MeshBasicMaterial({ color: Math.random() > 0.4 ? 0xf59e0b : 0xef4444, transparent: true, opacity: 0.85 })
      );
      mesh.position.set(x + offsetX, y + 0.8, z - 0.45);
      this.particleGroup.add(mesh);
      this.particles.push({
        mesh,
        vx: (Math.random() - 0.5) * 0.6,
        vy: -2.8 - Math.random() * 1.5,
        vz: 3.5 + Math.random() * 2.5,
        life: 0.24,
        maxLife: 0.24,
      });
    });
  }

  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particleGroup.remove(p.mesh);
        this.particles.splice(i, 1);
        continue;
      }
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.z += p.vz * dt;
      const progress = p.life / p.maxLife;
      p.mesh.scale.setScalar(progress * 1.25);
    }
  }

  private updateTrackAndEnvironment(stepDist: number, dt: number) {
    // 1. Move Obstacles & Follow Track Curvature
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      // If train is oncoming moving, add extra relative speed
      const extraSpeed = obs.speed ? obs.speed * dt : 0;
      obs.z += stepDist + extraSpeed;

      const cx = getTrackCurveX(obs.z, this.distance, this.city);
      const angle = getTrackCurveAngle(obs.z, this.distance, this.city);
      const laneOffset = getLaneX(obs.lane);

      obs.group.position.x = cx + laneOffset * Math.cos(angle);
      obs.group.position.z = obs.z - laneOffset * Math.sin(angle);
      obs.group.rotation.y = angle;

      // Despawn passed obstacles behind player
      if (obs.z > 25) {
        this.scene.remove(obs.group);
        this.obstacles.splice(i, 1);
      }
    }

    // 2. Move Coins & Follow Track Curvature
    const isMagnet = this.powerups.magnet > 0;
    for (let i = this.activeCoins.length - 1; i >= 0; i--) {
      const coin = this.activeCoins[i];
      coin.z += stepDist;
      coin.group.rotation.y += 0.08;

      const cx = getTrackCurveX(coin.z, this.distance, this.city);
      const angle = getTrackCurveAngle(coin.z, this.distance, this.city);
      const laneOffset = getLaneX(coin.lane);

      // Magnet pulls coins within 16 units toward player
      if (isMagnet && !coin.collected && coin.z > -16 && coin.z < 6) {
        coin.x = THREE.MathUtils.damp(coin.x, this.playerX, 14, dt);
        coin.y = THREE.MathUtils.damp(coin.y, this.playerY + 0.8, 14, dt);
        coin.group.position.set(coin.x, coin.y, coin.z);
      } else {
        coin.x = cx + laneOffset * Math.cos(angle);
        coin.group.position.x = coin.x;
        coin.group.position.z = coin.z - laneOffset * Math.sin(angle);
      }

      // Coin pickup check
      const distToPlayer = Math.hypot(coin.x - this.playerX, coin.y - (this.playerY + 0.8), coin.z);
      if (distToPlayer < 1.3 && !coin.collected) {
        coin.collected = true;
        this.coins++;
        this.spawnSparkles(coin.x, coin.y, coin.z);
        sound.playCoin();
        if (this.coins % 6 === 0 || Math.random() < 0.22) {
          const coinPuffs = ['WOW!', 'CHING!', 'BONANZA!', 'SWEET!', 'NICE!'];
          this.triggerSplash(coinPuffs[Math.floor(Math.random() * coinPuffs.length)], 'wow');
        }
        if (navigator.vibrate) navigator.vibrate(15);
        this.scene.remove(coin.group);
        this.activeCoins.splice(i, 1);
        continue;
      }

      if (coin.z > 20) {
        this.scene.remove(coin.group);
        this.activeCoins.splice(i, 1);
      }
    }

    // 3. Move Powerup Items & Follow Track Curvature
    for (let i = this.activePowerups.length - 1; i >= 0; i--) {
      const p = this.activePowerups[i];
      p.z += stepDist;
      p.group.rotation.y += 0.05;

      const cx = getTrackCurveX(p.z, this.distance, this.city);
      const angle = getTrackCurveAngle(p.z, this.distance, this.city);
      const laneOffset = getLaneX(p.lane);
      p.x = cx + laneOffset * Math.cos(angle);
      p.group.position.x = p.x;
      p.group.position.z = p.z - laneOffset * Math.sin(angle);

      const dist = Math.hypot(p.x - this.playerX, p.y - (this.playerY + 0.8), p.z);
      if (dist < 1.4 && !p.collected) {
        p.collected = true;
        this.collectPowerup(p.type);
        this.scene.remove(p.group);
        this.activePowerups.splice(i, 1);
        continue;
      }

      if (p.z > 20) {
        this.scene.remove(p.group);
        this.activePowerups.splice(i, 1);
      }
    }

    // 4. Move Catenary Gantries & Track Curvature Loop
    this.catenaryInstances.children.forEach((gantry) => {
      gantry.position.z += stepDist;
      if (gantry.position.z > 15) {
        gantry.position.z -= 245;
      }
      const gz = gantry.position.z;
      const cx = getTrackCurveX(gz, this.distance, this.city);
      const angle = getTrackCurveAngle(gz, this.distance, this.city);
      gantry.position.x = cx;
      gantry.position.z = gz;
      gantry.rotation.y = angle;
    });

    // 5. Move Roadside Scenery along dynamic track curvature (strictly curves with track)
    this.updateSideSceneryPositions(stepDist);

    // 6. Align distant landmark with horizon curvature (stays back at z = -190)
    if (this.landmarkGroup) {
      const lkZ = -200;
      const lkCurveX = getTrackCurveX(lkZ, this.distance, this.city);
      this.landmarkGroup.position.x = lkCurveX * 0.45;
      this.landmarkGroup.position.z = -190;
    }

    // 7. Spawn new chunks ahead
    this.nextSpawnZ += stepDist;
    if (this.nextSpawnZ > -80) {
      this.spawnNextChunk();
    }
  }

  private collectPowerup(type: PowerupType) {
    sound.playPowerup();
    if (navigator.vibrate) navigator.vibrate([40, 20, 60]);

    if (type === 'sneakers') {
      this.powerups.sneakers = SNEAKERS_DURATION;
      this.triggerSplash('BOING!', 'pow');
    } else if (type === 'magnet') {
      this.powerups.magnet = MAGNET_DURATION;
      this.triggerSplash('MAGNETIC!', 'power');
    } else if (type === 'jetpack') {
      this.powerups.jetpack = JETPACK_DURATION;
      this.triggerSplash('BLAST OFF!', 'boom');
      this.spawnJetpackCoinSkyway();
    } else if (type === 'multiplier') {
      this.powerups.multiplier = MULTIPLIER_DURATION;
      this.triggerSplash('2X SCORE!', 'wow');
    }
  }

  private spawnJetpackCoinSkyway() {
    // Spawn lines of gold coins high in the sky
    for (let z = -20; z >= -180; z -= 3.5) {
      const lane = LANES[Math.floor(Math.sin(z * 0.05) + 1.5) % 3];
      this.spawnCoin(lane, JETPACK_HEIGHT, z);
    }
  }

  private spawnNextChunk() {
    const chunkZ = -120 - Math.random() * 20;
    this.nextSpawnZ = chunkZ;

    // Pick 1 or 2 lanes to place obstacles
    const occupiedLanes = new Set<number>();
    const numObstacles = Math.random() > 0.4 ? 2 : 1;

    for (let i = 0; i < numObstacles; i++) {
      const laneIdx = ([-1, 0, 1] as const)[Math.floor(Math.random() * 3)];
      if (occupiedLanes.has(laneIdx)) continue;
      occupiedLanes.add(laneIdx);

      const roll = Math.random();
      if (roll < 0.45) {
        // Passenger Train
        this.spawnTrain(laneIdx, chunkZ);
      } else if (roll < 0.75) {
        // Low Jump Barrier
        this.spawnBarrierLow(laneIdx, chunkZ);
      } else {
        // High Slide Barrier
        this.spawnBarrierHigh(laneIdx, chunkZ);
      }
    }

    // In open lanes, spawn coin patterns or powerups
    const openLanes = ([-1, 0, 1] as const).filter((l) => !occupiedLanes.has(l));
    if (openLanes.length > 0) {
      const coinLane = openLanes[0];
      const coinX = getLaneX(coinLane);

      // 10% chance to spawn a powerup item
      if (Math.random() < 0.14) {
        const pTypes: PowerupType[] = ['magnet', 'jetpack', 'sneakers', 'multiplier'];
        const chosen = pTypes[Math.floor(Math.random() * pTypes.length)];
        this.spawnPowerup(chosen, coinX, 1.2, chunkZ);
      } else {
        // Spawn coin row or jump arc
        const isArc = Math.random() > 0.6;
        for (let c = 0; c < 5; c++) {
          const coinZ = chunkZ + c * 3.2;
          const coinY = isArc ? 0.9 + Math.sin((c / 4) * Math.PI) * 1.8 : 0.9;
          this.spawnCoin(coinX, coinY, coinZ);
        }
      }
    }
  }

  private spawnTrain(lane: number, z: number) {
    const trainMesh = createTrainMesh(this.city);
    const laneX = getLaneX(lane);
    const cx = getTrackCurveX(z, this.distance, this.city);
    const angle = getTrackCurveAngle(z, this.distance, this.city);
    trainMesh.position.set(cx + laneX * Math.cos(angle), 0, z - laneX * Math.sin(angle));
    trainMesh.rotation.y = angle;
    this.scene.add(trainMesh);

    this.obstacles.push({
      id: this.nextObstacleId++,
      type: 'train',
      lane,
      group: trainMesh,
      z,
      y: 0,
      width: 2.3,
      height: TRAIN_HEIGHT,
      depth: TRAIN_LENGTH,
    });

    // Spawn coins on top of the train!
    for (let c = -TRAIN_LENGTH / 2 + 4; c <= TRAIN_LENGTH / 2 - 4; c += 4) {
      this.spawnCoin(laneX, TRAIN_HEIGHT + 0.9, z + c);
    }
  }

  private spawnBarrierLow(lane: number, z: number) {
    const mesh = createBarrierLow();
    const laneX = getLaneX(lane);
    const cx = getTrackCurveX(z, this.distance, this.city);
    const angle = getTrackCurveAngle(z, this.distance, this.city);
    mesh.position.set(cx + laneX * Math.cos(angle), 0, z - laneX * Math.sin(angle));
    mesh.rotation.y = angle;
    this.scene.add(mesh);

    this.obstacles.push({
      id: this.nextObstacleId++,
      type: 'barrier_low',
      lane,
      group: mesh,
      z,
      y: 0,
      width: 2.2,
      height: 1.3,
      depth: 0.5,
    });

    // Jump arc coins over low barrier
    for (let c = -2; c <= 2; c++) {
      const coinZ = z + c * 2.2;
      const coinY = 1.0 + Math.cos((c / 2) * (Math.PI / 2)) * 1.5;
      this.spawnCoin(laneX, coinY, coinZ);
    }
  }

  private spawnBarrierHigh(lane: number, z: number) {
    const mesh = createBarrierHigh();
    const laneX = getLaneX(lane);
    const cx = getTrackCurveX(z, this.distance, this.city);
    const angle = getTrackCurveAngle(z, this.distance, this.city);
    mesh.position.set(cx + laneX * Math.cos(angle), 0, z - laneX * Math.sin(angle));
    mesh.rotation.y = angle;
    this.scene.add(mesh);

    this.obstacles.push({
      id: this.nextObstacleId++,
      type: 'barrier_high',
      lane,
      group: mesh,
      z,
      y: 0,
      width: 2.3,
      height: 2.4,
      depth: 0.5,
    });

    // Low slide coins underneath
    for (let c = -1; c <= 1; c++) {
      this.spawnCoin(laneX, 0.4, z + c * 2.2);
    }
  }

  private spawnCoin(x: number, y: number, z: number) {
    const mesh = createCoinMesh();
    const lane = clampLane(Math.round(x / LANE_WIDTH));
    const laneX = getLaneX(lane);
    const cx = getTrackCurveX(z, this.distance, this.city);
    const angle = getTrackCurveAngle(z, this.distance, this.city);
    const curX = cx + laneX * Math.cos(angle);
    const curZ = z - laneX * Math.sin(angle);
    mesh.position.set(curX, y, curZ);
    this.scene.add(mesh);

    this.activeCoins.push({
      id: this.nextObstacleId++,
      lane,
      group: mesh,
      x: curX,
      y,
      z,
      collected: false,
    });
  }

  private spawnPowerup(type: PowerupType, x: number, y: number, z: number) {
    const mesh = createPowerupMesh(type);
    const lane = clampLane(Math.round(x / LANE_WIDTH));
    const laneX = getLaneX(lane);
    const cx = getTrackCurveX(z, this.distance, this.city);
    const angle = getTrackCurveAngle(z, this.distance, this.city);
    const curX = cx + laneX * Math.cos(angle);
    const curZ = z - laneX * Math.sin(angle);
    mesh.position.set(curX, y, curZ);
    this.scene.add(mesh);

    this.activePowerups.push({
      id: this.nextObstacleId++,
      type,
      lane,
      group: mesh,
      x: curX,
      y,
      z,
      collected: false,
    });
  }

  private checkCollisions() {
    // Jetpack grants total invulnerability
    if (this.powerups.jetpack > 0) {
      this.groundY = 0;
      return;
    }

    let foundTrainRoof = false;

    for (const obs of this.obstacles) {
      // Check X overlap
      const obsX = getLaneX(obs.lane);
      const xDist = Math.abs(this.playerX - obsX);
      if (xDist > obs.width / 2 + 0.35) continue;

      // Check Z overlap
      const zDist = Math.abs(this.playerZ - obs.z);
      if (zDist > obs.depth / 2 + 0.4) continue;

      // Handle Train
      if (obs.type === 'train') {
        const trainTopY = obs.y + obs.height;



        // Check if player is on or landing onto the roof of the train
        if (this.playerY >= trainTopY - 0.4 && this.playerVy <= 0.8) {
          this.groundY = trainTopY;
          foundTrainRoof = true;
          continue;
        }

        // Side Stumble vs Frontal Crash:
        if (xDist > obs.width / 2 - 0.25) {
          // Grazed side of train while changing lanes!
          this.stumble();
          continue;
        }

        // Direct frontal impact with train!
        this.handleCrash();
        return;
      }

      // Handle Low Barrier (Must jump over)
      if (obs.type === 'barrier_low') {
        if (this.playerY > obs.height - 0.25) {
          // Safely jumped over!
          continue;
        }
        this.handleCrash();
        return;
      }

      // Handle High Barrier (Must slide under)
      if (obs.type === 'barrier_high') {
        if (this.isRolling && this.playerY <= 0.6) {
          // Safely sliding under!
          continue;
        }
        this.handleCrash();
        return;
      }
    }

    if (!foundTrainRoof && this.playerY >= TRAIN_HEIGHT - 0.2) {
      // Dropping off back or side of train onto ground
      this.groundY = 0;
    }
  }

  private stumble() {
    if (this.stumbleTimer > 0) {
      // Already stumbled and inspector was close -> CAUGHT!
      this.handleCrash();
      return;
    }
    this.stumbleTimer = 3.5;
    this.triggerSplash('OUCH!', 'pow');
    sound.playStumble();
    if (navigator.vibrate) navigator.vibrate([40, 30, 40]);
  }

  private handleCrash() {
    // If Hoverboard is active, it sacrifices itself and saves the player!
    if (this.hasHoverboard) {
      this.hasHoverboard = false;
      this.hoverboardTimer = 0;
      this.playerModel.hoverboardMesh.visible = false;
      this.triggerSplash('WHAM!', 'boom');
      sound.playCrash();
      if (navigator.vibrate) navigator.vibrate([60, 30, 80]);

      // Knock back & clear nearby obstacles in this lane
      this.playerY = 0;
      this.groundY = 0;
      this.obstacles = this.obstacles.filter((o) => {
        if (Math.abs(o.z - this.playerZ) < 15 && o.lane === this.targetLane) {
          this.scene.remove(o.group);
          return false;
        }
        return true;
      });
      return;
    }

    // Fatal Crash - Run Over!
    this.isRunning = false;
    const fatalWords = ['KAPOW!', 'CRASH!', 'BOOM!', 'SMASH!'];
    this.triggerSplash(fatalWords[Math.floor(Math.random() * fatalWords.length)], 'kapow');
    sound.stopBGM();
    sound.playCrash();
    if (navigator.vibrate) navigator.vibrate([150, 50, 200]);

    // Save High Score & Total Coins to LocalStorage
    const finalScore = this.score;
    const newHighScore = Math.max(this.highScore, finalScore);
    const newTotalCoins = this.totalCoins + this.coins;
    localStorage.setItem('mzansi_high_score', newHighScore.toString());
    localStorage.setItem('mzansi_total_coins', newTotalCoins.toString());

    this.callbacks.onGameOver({
      score: finalScore,
      coins: this.coins,
      distance: Math.floor(this.distance),
      multiplier: this.multiplier,
      highScore: newHighScore,
      totalCoins: newTotalCoins,
    });
  }

  private initSideScenery() {
    this.sideSceneryGroup.clear();
    this.sideScenery = [];

    const city = this.city;
    const spacing = 16;
    const count = 16;
    // Loading is asynchronous. Each instance starts empty and fills itself with
    // the corresponding embedded-texture GLB; scenery never blocks game startup.
    const model = (name: string, lod: 0 | 1 | 2 = 0) =>
      assetManager.instantiate(name, { lod });

    for (let i = 0; i < count; i++) {
      const zL = 16 - i * spacing;
      const zR = 8 - i * spacing;
      let groupL: THREE.Group;
      let groupR: THREE.Group;
      let offsetL = -12.5;
      let offsetR = 12.5;
      let rotL = 0;
      let rotR = 0;
      // Distance LODs keep GPU load in check for the two distant sides.
      const lod: 0 | 1 = i > 8 ? 1 : 0;

      if (city === 'soweto') {
        const left = ['sa_minibus_taxi', 'soweto_shack', 'kasi_spaza_shop',
          'shipping_container', 'power_pole', 'market_stall',
          'bus_stop_taxi_rank', 'graffiti_wall'];
        const right = ['soweto_shack', 'sa_minibus_taxi', 'kasi_spaza_shop',
          'soweto_sign', 'street_bench', 'railway_station',
          'recycling_bin', 'billboard', 'fence', 'dumpster'];
        groupL = model(left[i % left.length], lod);
        groupR = model(right[i % right.length], lod);
        if ([1, 2, 6].includes(i % left.length)) rotL = Math.PI / 2;
        if ([0, 2, 5].includes(i % right.length)) rotR = -Math.PI / 2;
        offsetL = -13.5;
        offsetR = 13.5;
      } else if (city === 'durban') {
        const left = ['palm_tree', 'durban_lifeguard_hut', 'surfboards',
          'palm_tree', 'fishing_boat', 'street_bench', 'durban_sign'];
        const right = ['palm_tree', 'surfboards', 'durban_lifeguard_hut',
          'palm_tree', 'market_stall', 'lamp_post', 'billboard'];
        groupL = model(left[i % left.length], lod);
        groupR = model(right[i % right.length], lod);
        offsetL = -14;
        offsetR = 14;
        if (i % 7 === 1) rotL = Math.PI / 2;
        if (i % 7 === 2) rotR = -Math.PI / 2;
      } else if (city === 'capetown') {
        const left = ['cape_town_bokaap_house', 'lamp_post',
          'cape_town_bokaap_house', 'market_stall', 'cape_town_sign',
          'traffic_light'];
        const right = ['cape_town_bokaap_house', 'street_bench',
          'cape_town_bokaap_house', 'lamp_post', 'billboard',
          'traffic_light'];
        groupL = model(left[i % left.length], lod);
        groupR = model(right[i % right.length], lod);
        rotL = i % 6 === 0 || i % 6 === 2 ? Math.PI / 2 : 0;
        rotR = i % 6 === 0 || i % 6 === 2 ? -Math.PI / 2 : 0;
        offsetL = -13.3;
        offsetR = 13.3;
      } else if (city === 'nelspruit') {
        const left = ['nelspruit_building', 'indigenous_tree',
          'market_stall', 'nelspruit_building', 'street_bench', 'nelspruit_sign'];
        const right = ['indigenous_tree', 'nelspruit_building',
          'bus_stop_taxi_rank', 'palm_tree', 'nelspruit_building', 'street_sign'];
        groupL = model(left[i % left.length], lod);
        groupR = model(right[i % right.length], lod);
        rotL = i % 6 === 0 || i % 6 === 3 ? Math.PI / 2 : 0;
        rotR = i % 6 === 1 || i % 6 === 4 ? -Math.PI / 2 : 0;
        offsetL = -13.5;
        offsetR = 13.5;
      } else {
        // Wild Coast: refined Eastern Cape houses plus landscape foliage.
        const left = ['eastern_cape_house', 'indigenous_tree', 'eastern_cape_sign',
          'eastern_cape_house', 'indigenous_tree', 'market_stall'];
        const right = ['indigenous_tree', 'eastern_cape_house', 'street_sign',
          'indigenous_tree', 'eastern_cape_house', 'fishing_boat'];
        groupL = model(left[i % left.length], lod);
        groupR = model(right[i % right.length], lod);
        rotL = i % 6 === 0 || i % 6 === 3 ? Math.PI / 2 : 0;
        rotR = i % 6 === 1 || i % 6 === 4 ? -Math.PI / 2 : 0;
        offsetL = -14;
        offsetR = 14;
      }

      this.sideSceneryGroup.add(groupL);
      this.sideScenery.push({ group: groupL, z: zL, sideOffset: offsetL, localRotY: rotL });
      this.sideSceneryGroup.add(groupR);
      this.sideScenery.push({ group: groupR, z: zR, sideOffset: offsetR, localRotY: rotR });
    }
    this.updateSideSceneryPositions(0);
  }

  private updateSideSceneryPositions(stepDist: number) {
    for (let i = 0; i < this.sideScenery.length; i++) {
      const item = this.sideScenery[i];
      item.z += stepDist;
      if (item.z > 25) {
        item.z -= 256;
      }
      const cx = getTrackCurveX(item.z, this.distance, this.city);
      const angle = getTrackCurveAngle(item.z, this.distance, this.city);
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      item.group.position.x = cx + item.sideOffset * cosA;
      item.group.position.z = item.z - item.sideOffset * sinA;
      item.group.rotation.y = angle + item.localRotY;
    }
  }

  private clearSpawnedObjects() {
    this.obstacles.forEach((o) => this.scene.remove(o.group));
    this.obstacles = [];

    this.activeCoins.forEach((c) => this.scene.remove(c.group));
    this.activeCoins = [];

    this.activePowerups.forEach((p) => this.scene.remove(p.group));
    this.activePowerups = [];

    this.particles.forEach((p) => this.particleGroup.remove(p.mesh));
    this.particles = [];
  }

  public dispose() {
    this.isRunning = false;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    sound.stopBGM();
    this.cleanupListeners();
    this.clearSpawnedObjects();
    this.sideSceneryGroup.clear();
    this.sideScenery = [];
    if (this.groundMesh) {
      this.groundMesh.geometry.dispose();
      (this.groundMesh.material as THREE.Material).dispose();
    }
    if (this.railsMesh) {
      this.railsMesh.geometry.dispose();
      (this.railsMesh.material as THREE.Material).dispose();
    }
    if (this.curbsMesh) {
      this.curbsMesh.geometry.dispose();
      (this.curbsMesh.material as THREE.Material).dispose();
    }
    if (this.tiesInstancedMesh) {
      this.tiesInstancedMesh.geometry.dispose();
      (this.tiesInstancedMesh.material as THREE.Material).dispose();
    }
    if (this.ballastTexture) {
      this.ballastTexture.dispose();
    }
    this.renderer.dispose();
    if (this.renderer.domElement && this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
