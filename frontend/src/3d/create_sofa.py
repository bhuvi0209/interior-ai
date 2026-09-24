import bpy
import os
import math

# --------------------------------------------------
# Clear existing Blender scene
# --------------------------------------------------

bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)


# --------------------------------------------------
# Materials
# --------------------------------------------------

def create_material(name, color):
    material = bpy.data.materials.new(name)
    material.diffuse_color = (*color, 1.0)
    return material


fabric = create_material(
    "Sofa Fabric",
    (0.35, 0.18, 0.10)
)

dark_fabric = create_material(
    "Dark Fabric",
    (0.18, 0.08, 0.04)
)


# --------------------------------------------------
# Create cube helper
# --------------------------------------------------

def create_cube(name, location, scale, material):
    bpy.ops.mesh.primitive_cube_add(
        location=location
    )

    obj = bpy.context.object
    obj.name = name

    obj.scale = (
        scale[0] / 2,
        scale[1] / 2,
        scale[2] / 2
    )

    bpy.ops.object.transform_apply(
        location=False,
        rotation=False,
        scale=True
    )

    obj.data.materials.append(material)

    # Slightly rounded edges
    bevel = obj.modifiers.new(
        name="Soft Edges",
        type="BEVEL"
    )

    bevel.width = 0.08
    bevel.segments = 3

    return obj


# --------------------------------------------------
# Sofa dimensions
# --------------------------------------------------

sofa_width = 3.0
sofa_depth = 1.0

# --------------------------------------------------
# Sofa base
# --------------------------------------------------

create_cube(
    "Sofa Base",
    (0, 0, 0.35),
    (sofa_width, sofa_depth, 0.35),
    dark_fabric
)


# --------------------------------------------------
# Seat cushions
# --------------------------------------------------

create_cube(
    "Left Seat Cushion",
    (-0.75, 0, 0.68),
    (1.35, 0.85, 0.35),
    fabric
)

create_cube(
    "Right Seat Cushion",
    (0.75, 0, 0.68),
    (1.35, 0.85, 0.35),
    fabric
)


# --------------------------------------------------
# Back cushions
# --------------------------------------------------

create_cube(
    "Left Back Cushion",
    (-0.75, 0.38, 1.25),
    (1.35, 0.28, 1.05),
    fabric
)

create_cube(
    "Right Back Cushion",
    (0.75, 0.38, 1.25),
    (1.35, 0.28, 1.05),
    fabric
)


# --------------------------------------------------
# Left arm
# --------------------------------------------------

create_cube(
    "Left Arm",
    (-1.43, 0, 0.95),
    (0.25, 1.0, 1.25),
    fabric
)


# --------------------------------------------------
# Right arm
# --------------------------------------------------

create_cube(
    "Right Arm",
    (1.43, 0, 0.95),
    (0.25, 1.0, 1.25),
    fabric
)


# --------------------------------------------------
# Sofa legs
# --------------------------------------------------

leg_material = create_material(
    "Wood",
    (0.08, 0.04, 0.02)
)

leg_positions = [
    (-1.2, -0.35, 0.15),
    (1.2, -0.35, 0.15),
    (-1.2, 0.35, 0.15),
    (1.2, 0.35, 0.15),
]

for index, position in enumerate(leg_positions):
    create_cube(
        f"Leg {index + 1}",
        position,
        (0.15, 0.15, 0.3),
        leg_material
    )


# --------------------------------------------------
# Ground origin
# --------------------------------------------------

bpy.ops.object.select_all(action="SELECT")

# Put everything into one parent collection/object
bpy.ops.object.join()

sofa = bpy.context.object
sofa.name = "Sofa"


# --------------------------------------------------
# Set origin
# --------------------------------------------------

bpy.ops.object.origin_set(
    type="ORIGIN_GEOMETRY",
    center="BOUNDS"
)

# Move sofa so bottom is near Z=0
sofa.location.z = 0


# --------------------------------------------------
# Export GLB
# --------------------------------------------------

output_path = os.path.abspath(
    os.path.join(
        os.path.dirname(__file__),
        "frontend",
        "public",
        "models",
        "sofa.glb"
    )
)

bpy.ops.export_scene.gltf(
    filepath=output_path,
    export_format="GLB",
    use_selection=True
)

print("--------------------------------")
print("SOFA GLB CREATED")
print("--------------------------------")
print(output_path)