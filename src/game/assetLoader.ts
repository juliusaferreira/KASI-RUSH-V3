import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { KASI_ASSET_NAMES, type KasiAssetKey } from './assetCatalog';

/** Older in-game names mapped onto the supplied v4/v5 asset library. */
const LEGACY_ALIASES: Record<string, KasiAssetKey> = {
  spaza_shop: 'kasi_spaza_shop',
  wooden_ramp: 'ramp',
  roadwork_barrier: 'road_barrier',
  wooden_crate: 'crates',
  wire_fence: 'fence',
  township_dumpster: 'dumpster',
  township_bench: 'street_bench',
  rand_coin_R1: 'rand_r1_coin',
};

export const ASSET_KEYS = KASI_ASSET_NAMES;
export type AssetKey = KasiAssetKey | keyof typeof LEGACY_ALIASES;

export interface ModelInstanceOptions {
  /** Dimensions to fit to. Nonuniform fitting is useful for stable obstacle hitboxes. */
  targetDimensions?: [number, number, number];
  uniformScale?: boolean;
  /** Keep objects standing on ground; set false for floating collectibles. */
  ground?: boolean;
  lod?: 0 | 1 | 2;
}

const baseUrl = import.meta.env.BASE_URL.endsWith('/')
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`;

class AssetManager {
  private cache = new Map<string, THREE.Group>();
  private bounds = new Map<string, THREE.Box3>();
  private loader = new GLTFLoader();
  private loadPromises = new Map<string, Promise<THREE.Group | null>>();

  private canonical(key: string): KasiAssetKey | null {
    const normalized = LEGACY_ALIASES[key] ?? key;
    return (KASI_ASSET_NAMES as readonly string[]).includes(normalized)
      ? (normalized as KasiAssetKey)
      : null;
  }

  private id(key: string, lod: 0 | 1 | 2): string {
    return `${key}:${lod}`;
  }

  public has(key: string, lod: 0 | 1 | 2 = 0): boolean {
    const canonical = this.canonical(key);
    return !!canonical && this.cache.has(this.id(canonical, lod));
  }

  public get(key: string, lod: 0 | 1 | 2 = 0): THREE.Group | null {
    const canonical = this.canonical(key);
    if (!canonical) return null;
    return this.cache.get(this.id(canonical, lod))?.clone(true) ?? null;
  }

  public async loadModel(key: string, lod: 0 | 1 | 2 = 0): Promise<THREE.Group | null> {
    const canonical = this.canonical(key);
    if (!canonical) {
      console.warn(`Unknown Kasi Rush asset: ${key}`);
      return null;
    }
    const id = this.id(canonical, lod);
    if (this.cache.has(id)) return this.get(canonical, lod);
    const existing = this.loadPromises.get(id);
    if (existing) return existing;

    const path = lod === 0
      ? `${baseUrl}assets/kasi/models/${canonical}.glb`
      : `${baseUrl}assets/kasi/lod/${canonical}_lod${lod}.glb`;
    const promise = new Promise<THREE.Group | null>((resolve) => {
      this.loader.load(
        path,
        (gltf) => {
          const model = gltf.scene;
          model.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              child.castShadow = lod === 0;
              child.receiveShadow = true;
            }
          });
          this.cache.set(id, model);
          this.bounds.set(id, new THREE.Box3().setFromObject(model));
          resolve(model.clone(true));
        },
        undefined,
        (err) => {
          console.warn(`Could not load ${canonical} LOD${lod} from ${path}:`, err);
          resolve(null);
        },
      );
    });
    this.loadPromises.set(id, promise);
    return promise;
  }

  /**
   * A stable holder that upgrades itself when its GLB finishes loading.
   * Keeps existing procedural art visible as a fallback and leaves all
   * obstacle, coin and train collision calculations unchanged.
   */
  public instantiate(
    key: string,
    options: ModelInstanceOptions = {},
    fallback?: THREE.Group,
  ): THREE.Group {
    const holder = new THREE.Group();
    const canonical = this.canonical(key);
    if (!canonical) {
      if (fallback) holder.add(fallback);
      return holder;
    }
    const lod = options.lod ?? 0;
    const attach = () => {
      const clone = this.get(canonical, lod);
      if (!clone) return;
      const bounds = this.bounds.get(this.id(canonical, lod));
      if (!bounds || bounds.isEmpty()) return;
      const size = bounds.getSize(new THREE.Vector3());
      const center = bounds.getCenter(new THREE.Vector3());
      if (options.targetDimensions) {
        const [targetX, targetY, targetZ] = options.targetDimensions;
        const sx = targetX / Math.max(size.x, 0.001);
        const sy = targetY / Math.max(size.y, 0.001);
        const sz = targetZ / Math.max(size.z, 0.001);
        if (options.uniformScale) {
          clone.scale.setScalar(Math.min(sx, sy, sz));
        } else {
          clone.scale.set(sx, sy, sz);
        }
      }
      const scale = clone.scale;
      clone.position.set(
        -center.x * scale.x,
        (options.ground === false ? -center.y : -bounds.min.y) * scale.y,
        -center.z * scale.z,
      );
      holder.clear();
      holder.add(clone);
    };

    if (this.has(canonical, lod)) {
      attach();
    } else {
      if (fallback) holder.add(fallback);
      void this.loadModel(canonical, lod).then((model) => {
        if (model) attach();
      });
    }
    return holder;
  }

  /** Warm the frequently used models. Additional scenery is loaded on demand. */
  public async preloadCore(): Promise<void> {
    await Promise.all([
      'sa_commuter_train', 'sa_minibus_taxi', 'soweto_shack',
      'kasi_spaza_shop', 'road_barrier', 'crates', 'ramp',
      'rand_r1_coin', 'kasi_cruiser', 'bmx_bicycle',
      'electric_scooter', 'fresh_kicks',
    ].map((key) => this.loadModel(key)));
  }

  /** Optional explicit warm-up of every asset for an asset-browser or editor. */
  public async preloadAll(): Promise<void> {
    await Promise.all(KASI_ASSET_NAMES.map((key) => this.loadModel(key)));
  }
}

export const assetManager = new AssetManager();
if (typeof window !== 'undefined') {
  void assetManager.preloadCore().catch((err) => console.warn('Kasi asset preload:', err));
}
