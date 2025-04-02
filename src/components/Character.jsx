import React, { useRef, useEffect } from "react";
import { useGLTF, useAnimations } from "@react-three/drei";

export function Character({ 
  scale = 1, 
  position = [0, 0.4, 1.8], 
  animation = "Idle" 
}) {
  const group = useRef();
  const { scene, animations } = useGLTF("/models/man.glb");
  const { actions } = useAnimations(animations, group);
  const currentAnimation = useRef(null);

  useEffect(() => {
    if (actions[animation]) {
      if (currentAnimation.current && currentAnimation.current !== actions[animation]) {
        currentAnimation.current.fadeOut(0.3);
      }

      actions[animation].reset().fadeIn(0.3).play();
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
    />
  );
}

useGLTF.preload("/models/man.glb");
