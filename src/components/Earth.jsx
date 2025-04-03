import React, { useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { RigidBody } from "@react-three/rapier";

export function Earth(props) {
    const { nodes, materials } = useGLTF("/models/earth.glb");
    const earthRef = useRef();

    // 자전 속도 조정 (기본적으로 하루에 한 바퀴)
    const rotationSpeed = 0.003; // 조정 가능

    useFrame(() => {
        if (earthRef.current) {
            earthRef.current.rotation.y += rotationSpeed;
        }
    });

    return (
        <RigidBody
            type="fixed"
            colliders="ball"
        >
            <group {...props} dispose={null} ref={earthRef}>
                <group rotation={[-Math.PI / 2, 0, 0]}>
                    <mesh
                        castShadow
                        receiveShadow
                        geometry={nodes.Object_2.geometry}
                        material={materials.material}
                    />
                    <mesh
                        castShadow
                        receiveShadow
                        geometry={nodes.Object_3.geometry}
                        material={materials.Material}
                    />
                    <mesh
                        castShadow
                        receiveShadow
                        geometry={nodes.Object_4.geometry}
                        material={materials['Material.001']}
                    />
                </group>
            </group>
        </RigidBody>
    )
}

useGLTF.preload('/models/earth.glb')
