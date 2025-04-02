import { Environment, OrbitControls, OrthographicCamera } from "@react-three/drei";
import { Physics } from "@react-three/rapier";
import { useRef } from "react";
import { CharacterController } from "./CharacterController";
import { Character } from "./Character";
import { Map } from "./Map";

export const Experience = () => {
  const shadowCameraRef = useRef();

  return (
    <>
      <Environment preset="sunset" />
      
      {/* 그림자 설정을 포함한 방향성 조명 */}
      <directionalLight
        intensity={0.65}
        castShadow
        position={[-15, 10, 15]}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.00005}
      >
        <OrthographicCamera
          left={-22}
          right={15}
          top={10}
          bottom={-20}
          ref={shadowCameraRef}
          attach={"shadow-camera"}
        />
      </directionalLight>

      {/* 주변광 추가 */}
      <ambientLight intensity={0.3} />

      <OrbitControls/>

      {/* 물리 시뮬레이션 */}
      <Physics debug>
        <Map />
        <CharacterController />
      </Physics>/

      {/* 장면 디버깅용 평면 추가 */}
      <mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -1, 0]} 
        receiveShadow
      >
        <planeGeometry args={[100, 100]} />
        <shadowMaterial opacity={0.3} />
      </mesh>
    </>
  );
};