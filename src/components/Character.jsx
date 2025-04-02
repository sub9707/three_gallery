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

  useEffect(() => {
    Object.values(actions).forEach((action) => action.stop());
    if (actions[animation]) {
      actions[animation].reset().fadeIn(0.5).play();
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