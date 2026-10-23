# Kasi Rush — Three.js 3D Model Pack

Includes 3 previously created assets plus 17 additional stylized procedural GLB models.

## Import
Copy GLB files to `public/assets/` in a Vite/Three.js project.

```js
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
const loader = new GLTFLoader();
loader.load('/assets/electric_scooter.glb', ({scene: model}) => {
  model.position.set(0, 0, -5);
  scene.add(model);
});
```

Units are approximate meters. Most assets are centered at X=0 and Z=0 with ground at Y=0, except the simple coin which faces the camera along Z. Models use embedded flat material colors.

## Ride rules
Fresh Kicks: speed 1.00, power-up duration x1.00, no special action.
Kasi Cruiser: speed 1.00, duration x1.05, block obstacle ability, can reach train/taxi roofs.
BMX: speed 1.15, duration x1.15, can reach train/taxi roofs.
Electric Scooter: speed 1.20, duration x1.20, can reach train/taxi roofs, small obstacle smash with 30s cooldown.

## Quality disclaimer
These are real editable/importable 3D meshes but stylized low-poly *prototype* assets, not photorealistic or production-final PBR assets. No rigs, skeletal animations, baked textures, LODs or collision meshes are included. Geometry and gameplay must be integrated separately.
