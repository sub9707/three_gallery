import { Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";

export const TextComp = ({ text, position, color = "white" }) => {
    const textRef = useRef();
    const [offset] = useState(Math.random() * Math.PI * 2); // 랜덤 시작 위치

    useFrame(({ clock }) => {
        if (textRef.current) {
            textRef.current.position.y = position[1] + Math.sin(clock.elapsedTime + offset) * 0.5; // 부드럽게 떠다니는 효과
        }
    });

    return (
        <Text
            ref={textRef}
            position={position}
            fontSize={1}
            color={color}
            anchorX="center"
            anchorY="middle"
            scale={[-1, 1, 1]} 
        >
            {text}
        </Text>
    );
};
