import React, { useRef, useEffect } from "react";
import { useGLTF, useAnimations } from "@react-three/drei";

export function Character({ 
  scale = 1, 
  position = [0, 0, 1.8], 
  animation = "Idle" 
}) {
  const group = useRef();
  const { scene, animations } = useGLTF("/models/man.glb");
  const { actions } = useAnimations(animations, group);
  const currentAnimation = useRef(null);

  // 모델의 모든 메시에 그림자 설정 추가
  useEffect(() => {
    scene.traverse((object) => {
      if (object.isMesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });
  }, [scene]);

  useEffect(() => {
    if (actions[animation]) {
      if (currentAnimation.current && currentAnimation.current !== actions[animation]) {
        if (animation === "Jump") {
          currentAnimation.current.fadeOut(0.1); // 빠른 전환
          actions[animation].reset().fadeIn(0.2).play();
          actions[animation].timeScale = 0.5; // 점프 속도 조절
        } else {
          currentAnimation.current.fadeOut(0.3);
          actions[animation].reset().fadeIn(0.3).play();
          actions[animation].timeScale = 1;
        }
      } else {
        actions[animation].reset().play();
      }
      
      currentAnimation.current = actions[animation];
    }
  }, [animation, actions]);

  return (
    <primitive 
      object={scene} 
      ref={group}
      scale={scale} 
      position={position}
      rotation={[0, 0, 0]}
      castShadow
    />
  );
}

useGLTF.preload("/models/man.glb");