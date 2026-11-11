# Custom 3D Models Directory

Place your exported Blender 3D models here:

- **Filename**: `hand.glb` or `my_hand.glb`
- **Format**: glTF 2.0 Binary (`.glb`)

---

## How to Export from Blender

1. In Blender, select your hand mesh and armature.
2. Go to **File → Export → glTF 2.0 (.glb/.gltf)**.
3. In the export panel on the right:
   - **Format**: `glTF Binary (.glb)`
   - **Include**: Check `Selected Objects` (or visible objects)
   - **Transform**: Ensure `+Y Up` is checked
   - **Geometry**: Check `Apply Modifiers`, `Normals`
   - **Armature**: Check `Export Deformation Bones Only`
4. Click **Export glTF 2.0** and save as `hand.glb`.
5. Place the file in this folder: `public/models/hand.glb`.

The 3D viewer in EjjiLink AI will detect and display your custom model!
