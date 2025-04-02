import { useKeyboardControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { CapsuleCollider, RigidBody } from "@react-three/rapier";
import { useControls } from "leva";
import { useEffect, useRef, useState } from "react";
import { MathUtils, Vector3 } from "three";
import { degToRad } from "three/src/math/MathUtils.js";
import { Character } from "./Character";

// 각도를 정규화하는 함수
const normalizeAngle = (angle) => {
  while (angle > Math.PI) angle -= 2 * Math.PI;
  while (angle < -Math.PI) angle += 2 * Math.PI;
  return angle;
};

// 두 각도를 보간하는 함수
const lerpAngle = (start, end, t) => {
  start = normalizeAngle(start);
  end = normalizeAngle(end);

  if (Math.abs(end - start) > Math.PI) {
    if (end > start) {
      start += 2 * Math.PI;
    } else {
      end += 2 * Math.PI;
    }
  }

  return normalizeAngle(start + (end - start) * t);
};

export const CharacterController = () => {
  // 이동 속도 및 회전 속도 설정
  const { WALK_SPEED, RUN_SPEED, ROTATION_SPEED } = useControls(
    "Character Control",
    {
      WALK_SPEED: { value: 4, min: 0.1, max: 4, step: 0.1 },
      RUN_SPEED: { value: 8, min: 0.2, max: 12, step: 0.1 },
      ROTATION_SPEED: {
        value: degToRad(0.5),
        min: degToRad(1),
        max: degToRad(5),
        step: degToRad(0.1),
      },
    }
  );

  const rb = useRef();
  const container = useRef();
  const character = useRef();
  const [animation, setAnimation] = useState("Idle");

  // 회전 및 카메라 관련 설정
  const characterRotationTarget = useRef(0);
  const rotationTarget = useRef(0);
  const cameraTarget = useRef();
  const cameraPosition = useRef();
  const cameraWorldPosition = useRef(new Vector3());
  const cameraLookAtWorldPosition = useRef(new Vector3());
  const cameraLookAt = useRef(new Vector3());
  const [, get] = useKeyboardControls();
  const isClicking = useRef(false);

  // 점프 상태 및 속도 설정
  const isJumping = useRef(false);
  const isPreparing = useRef(false);
  const JUMP_FORCE = 8;
  const jumpState = useRef("ready"); // "ready", "preparing", "rising", "falling", "landing"
  const jumpAnimationTimer = useRef(0);
  const jumpCooldown = useRef(false);
  const jumpTimer = useRef(null);

  // 점프 애니메이션 지속 시간 설정
  const JUMP_ANIMATION_MIN_TIME = 0.1; // 기존 0.5 → 0.3으로 감소
  const JUMP_PREPARATION_TIME = 700; // 기존 500ms → 300ms으로 감소
  

  // 마우스 및 터치 이벤트 리스너 설정
  useEffect(() => {
    const onMouseDown = () => { 
    };
    const onMouseUp = () => {
      isClicking.current = false;
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("mouseup", onMouseUp);
    document.addEventListener("touchstart", onMouseDown);
    document.addEventListener("touchend", onMouseUp);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("touchstart", onMouseDown);
      document.removeEventListener("touchend", onMouseUp);
    };
  }, []);

  useFrame(({ camera, mouse }, delta) => {
    if (rb.current) {
      const vel = rb.current.linvel();

      // 상하좌우 이동 설정
      const movement = { x: 0, z: 0 };
      if (get().forward) movement.z = 1;
      if (get().backward) movement.z = -1;
      if (get().left) movement.x = 1;
      if (get().right) movement.x = -1;

      if (movement.x !== 0) {
        rotationTarget.current += ROTATION_SPEED * movement.x;
      }

      let speed = get().run ? RUN_SPEED : WALK_SPEED;

      // 점프 중이 아닐 때만 이동 애니메이션 변경
      if ((movement.x !== 0 || movement.z !== 0) && !isJumping.current && !isPreparing.current) {
        characterRotationTarget.current = Math.atan2(movement.x, movement.z);
        vel.x =
          Math.sin(rotationTarget.current + characterRotationTarget.current) * speed;
        vel.z =
          Math.cos(rotationTarget.current + characterRotationTarget.current) * speed;
        setAnimation(speed === RUN_SPEED ? "Run" : "Walk");
      } else if (!isJumping.current && !isPreparing.current) {
        setAnimation("Idle");
      }

      // 점프 중이나 준비 중에도 이동 속도 적용
      if ((isJumping.current || isPreparing.current) && (movement.x !== 0 || movement.z !== 0)) {
        characterRotationTarget.current = Math.atan2(movement.x, movement.z);
        vel.x =
          Math.sin(rotationTarget.current + characterRotationTarget.current) * speed * 0.8; // 점프 중에는 이동속도 감소
        vel.z =
          Math.cos(rotationTarget.current + characterRotationTarget.current) * speed * 0.8;
      }

      // 개선된 점프 기능 - 즉시 애니메이션 전환, 1초 후 실제 점프
      if (get().jump && !isJumping.current && !isPreparing.current && !jumpCooldown.current) {
        isPreparing.current = true;
        jumpState.current = "preparing";
        jumpAnimationTimer.current = 0;
        jumpCooldown.current = true;

        // 즉시 애니메이션 변경
        setAnimation(""); // 현재 애니메이션 초기화
        setTimeout(() => setAnimation("Jump"), 0); // 다음 틱에서 점프 애니메이션 설정

        // 1초 후 실제 점프 실행
        jumpTimer.current = setTimeout(() => {
          isPreparing.current = false;
          isJumping.current = true;
          jumpState.current = "rising";
          vel.y = JUMP_FORCE;
          rb.current.setLinvel(vel, false);
        }, JUMP_PREPARATION_TIME);

        // 점프 쿨다운 설정
        setTimeout(() => {
          jumpCooldown.current = false;
        }, JUMP_PREPARATION_TIME + 200);
      }

      // 점프 애니메이션 및 상태 관리 
      if (isJumping.current) {
        jumpAnimationTimer.current += delta;

        // 상승 -> 하강 상태 전환
        if (jumpState.current === "rising" && vel.y <= 0) {
          jumpState.current = "falling";
          // 하강 중에도 Jump 애니메이션 계속 사용
        }

        // 최소 애니메이션 시간을 보장하고, 바닥에 닿으면 착지 상태로 전환
        if (rb.current.translation().y <= 2.1 &&
          jumpState.current === "falling" &&
          jumpAnimationTimer.current >= JUMP_ANIMATION_MIN_TIME) {
          jumpState.current = "landing";

          // 착지 애니메이션 및 상태 전환 타이머
          setTimeout(() => {
            isJumping.current = false;
            jumpState.current = "ready";

            // 착지 후 현재 이동 상태에 따라 적절한 애니메이션 설정
            const isMoving = get().forward || get().backward || get().left || get().right;
            if (isMoving) {
              setAnimation(get().run ? "Run" : "Walk");
            } else {
              setAnimation("Idle");
            }
          }, 200); // 착지 애니메이션 시간
        }
      }

      // 캐릭터 회전 보간 적용
      character.current.rotation.y = lerpAngle(
        character.current.rotation.y,
        characterRotationTarget.current,
        0.1
      );

      rb.current.setLinvel(vel, false);
    }

    // 카메라 이동 설정
    container.current.rotation.y = MathUtils.lerp(
      container.current.rotation.y,
      rotationTarget.current,
      0.1
    );

    cameraPosition.current.getWorldPosition(cameraWorldPosition.current);
    camera.position.lerp(cameraWorldPosition.current, 0.1);

    if (cameraTarget.current) {
      cameraTarget.current.getWorldPosition(cameraLookAtWorldPosition.current);
      cameraLookAt.current.lerp(cameraLookAtWorldPosition.current, 0.1);
      camera.lookAt(cameraLookAt.current);
    }
  });

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (jumpTimer.current) {
        clearTimeout(jumpTimer.current);
      }
    };
  }, []);

  return (
    <RigidBody colliders={false} position={[0, 2, 0]} lockRotations ref={rb} friction={4}>
      <group ref={container}>
        <group ref={cameraTarget} position-z={1.5} />
        <group ref={cameraPosition} position-y={10} position-z={-10} />
        <group ref={character}>
          <Character scale={0.02} position-y={1} animation={animation} />
        </group>
      </group>
      <CapsuleCollider args={[1.7, 0.5]} position={[0, 2.2, 0]} />
    </RigidBody>
  );
};