import { RigidBody } from "@react-three/rapier";
import React from "react";

export const Map = (props) => {
  return (
    <group>
      {/* 그리드 */}
      <gridHelper args={[50, 50]} position={[0, 1, 0]} /> 

      {/* 바닥 */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh receiveShadow {...props}>
          <boxGeometry args={[50, 1, 50]} />
          <meshStandardMaterial color="white" roughness={0.8} metalness={0.2} />
        </mesh>
      </RigidBody>
    </group>
  );
};