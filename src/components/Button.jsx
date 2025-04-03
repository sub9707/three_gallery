import React, { useEffect, useRef, useState } from "react";
import { useGLTF, useAnimations } from "@react-three/drei";
import { RigidBody } from "@react-three/rapier";

export function Button({ onCollide, onLeave, onPushed, onExit, ...props }) {
    const group = useRef();
    const { nodes, materials, animations, scene } = useGLTF("/models/button.glb");
    const { actions } = useAnimations(animations, group);
    const [buttonPressed, setButtonPressed] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);

    useEffect(() => {
        scene.traverse((object) => {
            if (object.isMesh) {
                object.castShadow = true;
                object.receiveShadow = true;
            }
        });
    }, [scene]);

    useEffect(() => {
        const handleKeyDown = (event) => {
            if ((event.key === "e" || event.key === "E") && buttonPressed && !modalVisible) {
                setModalVisible(true);
                onPushed?.(); // 모달 열기
                onLeave?.();
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [buttonPressed, modalVisible, onPushed]);

    return (
        <RigidBody
            type="fixed"
            colliders="cuboid"
            position={[0, 0, 0]}
            onCollisionEnter={({ other }) => {
                if (other.rigidBodyObject?.userData?.isCharacter) {
                    setButtonPressed(true);
                    onCollide?.();
                }
            }}
            onCollisionExit={({ other }) => {
                if (other.rigidBodyObject?.userData?.isCharacter) {
                    setButtonPressed(false);
                    setModalVisible(false);
                    onExit?.(); // 모달 닫기
                    onLeave?.();
                }
            }}
        >
            <group ref={group} {...props} dispose={null} castShadow receiveShadow>
                <group name="Sketchfab_Scene">
                    <group name="Sketchfab_model" rotation={[-Math.PI / 2, 0, 0]} castShadow>
                        <group
                            name="d757a1532ad54fc598cab5f4bcbe806cfbx"
                            rotation={[Math.PI / 2, 0, 0]}
                            scale={0.01}
                            castShadow
                        >
                            <group name="Object_2" castShadow>
                                <group name="RootNode" castShadow>
                                    <group name="switch" rotation={[-Math.PI / 2, 0, 0]} scale={100} castShadow />
                                    <group name="switch_armature" rotation={[-Math.PI / 2, 0, 0]} scale={100} castShadow>
                                        <group name="Object_6" castShadow>
                                            <primitive object={nodes._rootJoint} />
                                            <skinnedMesh
                                                name="Object_9"
                                                geometry={nodes.Object_9.geometry}
                                                material={materials.UV_switch}
                                                skeleton={nodes.Object_9.skeleton}
                                                castShadow
                                                receiveShadow
                                            />
                                        </group>
                                    </group>
                                </group>
                            </group>
                        </group>
                    </group>
                </group>
            </group>
        </RigidBody>
    );
}

useGLTF.preload("/models/button.glb");
