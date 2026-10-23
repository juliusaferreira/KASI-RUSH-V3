# Skeleton Character Pack — Android game starter assets

## Included
- `skeleton_asset_sheet.png`: full visual reference sheet.
- `*_reference.png`: individual cropped reference renders for the character, action poses, turnaround views, avatar/emotion panel, hoverboard, cap, and shoes.

## Important format limitation
These files are **raster PNG reference renders**. They are not a rigged 3D model, animation clips, transparent production sprites, or FBX/GLB/OBJ model files. The action crops are cut from a composed reference sheet and may include dark background/panel elements. Use them for visual guidance, mockups, or a 2D billboard prototype; don't expect them to animate as a real 3D character.

## Android Studio integration
Android Studio is the IDE, not a 3D game engine. For an actual 3D runner, choose a rendering/game framework such as libGDX (3D support), jMonkeyEngine, or integrate a game engine such as Unity/Godot. Then obtain/create a rigged model (`.glb`/`.gltf` or engine-supported format), textures, and animation clips.

### Store the PNG reference files
1. In your Android project, create `app/src/main/assets/skeleton/`.
2. Copy the PNG files there. (The Android `assets` folder is appropriate for files you want to load by path; `res/drawable` is better for ordinary Android UI images.)
3. Load a reference PNG from Kotlin like this:

```kotlin
val input = assets.open("skeleton/character_main_reference.png")
val bitmap = android.graphics.BitmapFactory.decodeStream(input)
input.close()
```

4. If using a 3D framework, use the PNGs as art direction only. Import a real model and its texture/material files through that framework's asset pipeline.

## Recommended production asset specifications
- Model: rigged skeleton character in `.glb` or your engine's supported format.
- Rig: humanoid skeleton with named bones and a consistent bind pose.
- Animations: idle, run loop, jump, slide, fall, stumble, and recovery.
- Textures: separate base-color/normal/roughness maps as needed; use power-of-two dimensions such as 1024x1024 or 2048x2048.
- Mobile optimization: target a modest polygon count, compress textures, and test on a real Android device.

## Branding note
The cap lettering in these concept renders is decorative/generated artwork. For a commercial release, use your own title/logo or artwork you have permission to use.
