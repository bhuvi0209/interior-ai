import {
  useGLTF,
} from "@react-three/drei";

import type {
  ThreeElements,
} from "@react-three/fiber";

type FurnitureModelProps =
  ThreeElements["group"] & {
    modelPath: string;
  };

export default function FurnitureModel({
  modelPath,
  ...props
}: FurnitureModelProps) {
  const { scene } =
    useGLTF(modelPath);

  return (
    <group {...props}>
      <primitive
        object={scene}
      />
    </group>
  );
}