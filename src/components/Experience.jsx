import { Environment, OrbitControls, OrthographicCamera, SoftShadows } from "@react-three/drei";
import { Physics } from "@react-three/rapier";
import { useRef, useState } from "react";
import { CharacterController } from "./CharacterController";
import { Map } from "./Map";
import { Button } from "./Button";
import { Overlay } from "./Overlay";

export const Experience = () => {
  const shadowCameraRef = useRef();
  const [buttonPressed, setButtonPressed] = useState(false);
  return (
    <>
      {/* 부드러운 그림자 효과 추가 */}
      <SoftShadows size={10} samples={16} focus={0.5} />

      <Environment preset="sunset" />

      {/* 그림자 설정을 포함한 방향성 조명 */}
      <directionalLight
        intensity={0.75}
        castShadow
        position={[-15, 10, 15]}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.00005}
        shadow-radius={5}
      >
        <OrthographicCamera
          left={-22}
          right={15}
          top={10}
          bottom={-20}
          ref={shadowCameraRef}
          attach={"shadow-camera"}
          far={50}
        />
      </directionalLight>

      {/* 주변광 추가 */}
      <ambientLight intensity={0.35} />

      <OrbitControls />

      {/* HTML 오버레이 컴포넌트 */}
      <Overlay buttonPressed={buttonPressed} />
      {/* 물리 작용 요소들 */}
      <Physics debug>
        <Map />
        <CharacterController
          onButtonCollide={() => setButtonPressed(true)}
          onButtonLeave={() => setButtonPressed(false)}
        />
        <Button
          position={[0, 0.5, 6]}
          rotation={[0, Math.PI, 0]}
          scale={1}
          onCollide={() => setButtonPressed(true)}
          onLeave={() => setButtonPressed(false)}
        />
      </Physics>

      {/* 장면 디버깅용 평면 추가 */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.01, 0]}
        receiveShadow
      >
        <planeGeometry args={[100, 100]} />
        <shadowMaterial opacity={0.4} transparent />
      </mesh>
    </>
  );
};