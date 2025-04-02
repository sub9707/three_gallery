import { useKeyboardControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { CapsuleCollider, RigidBody } from "@react-three/rapier";
import { useControls } from "leva";
import { useEffect, useRef, useState } from "react";
import { AudioLoader, MathUtils, Vector3, AudioListener, Audio } from "three";
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
  const { WALK_SPEED, RUN_SPEED, ROTATION_SPEED } = useControls(
    "Character Control",
    {
      WALK_SPEED: { value: 4, min: 0.1, max: 4, step: 0.1 },
      RUN_SPEED: { value: 8, min: 0.2, max: 12, step: 0.1 },
      ROTATION_SPEED: {
        value: degToRad(2),  // 값을 증가시켜 회전 속도 향상
        min: degToRad(0.1),  // 최소값 수정
        max: degToRad(5),
        step: degToRad(0.1),
      },
    }
  );

  const { camera } = useThree();
  const rb = useRef();
  const container = useRef();
  const character = useRef();
  const [animation, setAnimation] = useState("Idle");
  const walkSound = useRef(null);
  const jumpSound = useRef(null);
  const landingSound = useRef(null);

  const characterRotationTarget = useRef(0);
  const rotationTarget = useRef(0);
  const cameraTarget = useRef();
  const cameraPosition = useRef();
  const cameraWorldPosition = useRef(new Vector3());
  const cameraLookAtWorldPosition = useRef(new Vector3());
  const cameraLookAt = useRef(new Vector3());
  const [, get] = useKeyboardControls();
  const isClicking = useRef(false);

  const isJumping = useRef(false);
  const isPreparing = useRef(false);
  const JUMP_FORCE = 8;
  const jumpState = useRef("ready");
  const jumpAnimationTimer = useRef(0);
  const jumpCooldown = useRef(false);
  const jumpTimer = useRef(null);
  const jumpSoundPlayed = useRef(false);
  const landingSoundPlayed = useRef(false);

  const JUMP_ANIMATION_MIN_TIME = 0.1;
  const JUMP_PREPARATION_TIME = 700;

  useEffect(() => {
    const onMouseDown = () => { };
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


  useFrame(({ camera }, delta) => {
    if (!rb.current) return;  // RigidBody가 준비되지 않았으면 실행하지 않음
    
    const vel = rb.current.linvel();

    const movement = { x: 0, z: 0 };
    const controls = get();
    
    // 키보드 입력 확인 (로깅 추가)
    if (controls.forward) {
      movement.z = 1;
      console.log("Forward key pressed");
    }
    if (controls.backward) {
      movement.z = -1;
      console.log("Backward key pressed");
    }
    if (controls.left) {
      movement.x = 1;
      console.log("Left key pressed");
    }
    if (controls.right) {
      movement.x = -1;
      console.log("Right key pressed");
    }

    // 움직임이 있는지 확인
    const isMoving = movement.x !== 0 || movement.z !== 0;
    
    // 이동 로직 수정 - 회전 적용 방식 변경
    if (movement.x !== 0) {
      rotationTarget.current += ROTATION_SPEED * movement.x * delta * 60;
    }

    let speed = controls.run ? RUN_SPEED : WALK_SPEED;

    // 점프 중이나 준비 중에도 이동 속도 적용하되, 사운드는 재생하지 않음
    if ((isJumping.current || isPreparing.current) && isMoving) {
      characterRotationTarget.current = Math.atan2(movement.x, movement.z);
      
      // 방향 벡터 계산
      const moveAngle = rotationTarget.current + characterRotationTarget.current;
      vel.x = Math.sin(moveAngle) * speed * 0.8;
      vel.z = Math.cos(moveAngle) * speed * 0.8;
      
      rb.current.setLinvel(vel, true);  // 속도 직접 설정하고 깨우기
      
      // 점프 중에는 이동 사운드 재생하지 않음
      stopWalkSound();
    }
    // 점프 중이 아닐 때 이동 애니메이션 변경 및 사운드 재생
    else if (isMoving && !isJumping.current && !isPreparing.current) {
      characterRotationTarget.current = Math.atan2(movement.x, movement.z);
      
      // 방향 벡터 계산
      const moveAngle = rotationTarget.current + characterRotationTarget.current;
      vel.x = Math.sin(moveAngle) * speed;
      vel.z = Math.cos(moveAngle) * speed;
      
      rb.current.setLinvel(vel, true);  // 속도 직접 설정하고 깨우기
      
      setAnimation(speed === RUN_SPEED ? "Run" : "Walk");
      playWalkSound(speed);
    } else if (!isJumping.current && !isPreparing.current) {
      // 멈춤 상태일 때 수평 속도를 0으로 설정
      vel.x = 0;
      vel.z = 0;
      rb.current.setLinvel(vel, true);
      
      setAnimation("Idle");
      stopWalkSound();
    }

    // 개선된 점프 기능 - 즉시 애니메이션 전환, JUMP_PREPARATION_TIME 후 실제 점프
    if (controls.jump && !isJumping.current && !isPreparing.current && !jumpCooldown.current) {
      console.log("Jump initiated");
      isPreparing.current = true;
      jumpState.current = "preparing";
      jumpAnimationTimer.current = 0;
      jumpCooldown.current = true;
      jumpSoundPlayed.current = false; // 점프 사운드 재생 상태 초기화
      landingSoundPlayed.current = false; // 착지 사운드 재생 상태 초기화

      // 점프 시작 시 걷기/달리기 사운드 중지
      stopWalkSound();

      // 즉시 애니메이션 변경
      setAnimation("Jump");

      // JUMP_PREPARATION_TIME 후 실제 점프 실행
      jumpTimer.current = setTimeout(() => {
        isPreparing.current = false;
        isJumping.current = true;
        jumpState.current = "rising";
        
        // 현재 수평 속도 유지하면서 수직 속도만 설정
        const currentVel = rb.current.linvel();
        currentVel.y = JUMP_FORCE;
        rb.current.setLinvel(currentVel, true);
        
        console.log("Jump executed");
        
        // 실제 점프가 실행될 때 점프 사운드 재생
        if (!jumpSoundPlayed.current) {
          playJumpSound();
          jumpSoundPlayed.current = true;
        }
      }, JUMP_PREPARATION_TIME);

      // 점프 쿨다운 설정
      setTimeout(() => {
        jumpCooldown.current = false;
      }, JUMP_PREPARATION_TIME + 200);
    }

    // 점프 애니메이션 및 상태 관리
    if (isJumping.current) {
      jumpAnimationTimer.current += delta;
      const currentVel = rb.current.linvel();

      // 상승 -> 하강 상태 전환
      if (jumpState.current === "rising" && currentVel.y <= 0) {
        jumpState.current = "falling";
        console.log("Jump falling");
      }

      // 최소 애니메이션 시간을 보장하고, 바닥에 닿으면 착지 상태로 전환
      const translation = rb.current.translation();
      if (translation.y <= 2.1 && jumpState.current === "falling" && jumpAnimationTimer.current >= JUMP_ANIMATION_MIN_TIME) {
        jumpState.current = "landing";
        console.log("Jump landing");
        
        // 착지 시 착지 사운드 재생 (아직 재생되지 않았다면)
        if (!landingSoundPlayed.current) {
          playLandingSound();
          landingSoundPlayed.current = true;
        }

        // 착지 애니메이션 및 상태 전환 타이머
        setTimeout(() => {
          isJumping.current = false;
          jumpState.current = "ready";
          jumpSoundPlayed.current = false; // 점프 사운드 재생 상태 초기화
          landingSoundPlayed.current = false; // 착지 사운드 재생 상태 초기화
          console.log("Jump complete");

          // 착지 후 현재 이동 상태에 따라 적절한 애니메이션 설정
          const currentControls = get();
          const moving = currentControls.forward || currentControls.backward || 
                         currentControls.left || currentControls.right;
          if (moving) {
            setAnimation(currentControls.run ? "Run" : "Walk");
            // 착지 후 이동 중이면 이동 사운드 다시 재생
            playWalkSound(currentControls.run ? RUN_SPEED : WALK_SPEED);
          } else {
            setAnimation("Idle");
          }
        }, 200); // 착지 애니메이션 시간
      }
    }

    // 캐릭터 회전 업데이트
    if (character.current) {
      character.current.rotation.y = lerpAngle(
        character.current.rotation.y,
        characterRotationTarget.current,
        0.1
      );
    }

    // 컨테이너 회전 업데이트
    if (container.current) {
      container.current.rotation.y = MathUtils.lerp(
        container.current.rotation.y,
        rotationTarget.current,
        0.1
      );
    }

    // 카메라 위치 및 시선 업데이트
    if (cameraPosition.current && cameraTarget.current) {
      cameraPosition.current.getWorldPosition(cameraWorldPosition.current);
      camera.position.lerp(cameraWorldPosition.current, 0.1);

      cameraTarget.current.getWorldPosition(cameraLookAtWorldPosition.current);
      cameraLookAt.current.lerp(cameraLookAtWorldPosition.current, 0.1);
      camera.lookAt(cameraLookAt.current);
    }
  });


  const listener = useRef(camera.listener || new AudioListener());
  useEffect(() => {
    if (!camera.listener) {
      camera.add(listener.current);
      camera.listener = listener.current;
    }
  }, [camera]);

  const audioLoader = useRef(new AudioLoader());
  useEffect(() => {
    // 오디오 로드 성공 여부를 추적하기 위한 함수
    const loadAudio = (path, ref, loop = false, volume = 0.5) => {
      console.log(`Loading audio: ${path}`);
      
      audioLoader.current.load(
        path, 
        (buffer) => {
          console.log(`Audio loaded successfully: ${path}`);
          ref.current = new Audio(listener.current);
          ref.current.setBuffer(buffer);
          ref.current.setLoop(loop);
          ref.current.setVolume(volume);
        },
        (progress) => {
          console.log(`Audio loading progress: ${path} - ${(progress.loaded / progress.total) * 100}%`);
        },
        (error) => {
          console.error(`Error loading audio: ${path}`, error);
        }
      );
    };
    
    // 걷기 사운드 로드
    loadAudio("/sounds/walk.wav", walkSound, true, 0.5);
    
    // 점프 사운드 로드
    loadAudio("/sounds/jump.ogg", jumpSound, false, 0.6);
    
    // 착지 사운드 로드
    loadAudio("/sounds/landing.mp3", landingSound, false, 0.7);
    
  }, []);

  const playWalkSound = (speed) => {
    if (walkSound.current) {
      try {
        // Always update the playback rate regardless of whether it's playing
        walkSound.current.setPlaybackRate(speed === RUN_SPEED ? 1.7 : 1.3);

        // Only start playing if it's not already playing
        if (!walkSound.current.isPlaying) {
          walkSound.current.play();
        }
      } catch (error) {
        console.error("Error playing walk sound:", error);
      }
    }
  };
  
  const stopWalkSound = () => {
    if (walkSound.current && walkSound.current.isPlaying) {
      try {
        walkSound.current.stop();
      } catch (error) {
        console.error("Error stopping walk sound:", error);
      }
    }
  };
  
  const playJumpSound = () => {
    if (jumpSound.current && !jumpSound.current.isPlaying) {
      try {
        jumpSound.current.play();
      } catch (error) {
        console.error("Error playing jump sound:", error);
      }
    }
  };
  
  const playLandingSound = () => {
    if (landingSound.current && !landingSound.current.isPlaying) {
      try {
        landingSound.current.play();
      } catch (error) {
        console.error("Error playing landing sound:", error);
      }
    }
  };

  return (
    <RigidBody colliders={false} position={[0, 1, 0]} lockRotations ref={rb} friction={4} userData={{ isCharacter: true }} >
      <group ref={container}>
        <group ref={cameraTarget} position-z={1.5} />
        <group ref={cameraPosition} position-y={10} position-z={-10} />
        <group ref={character}>
          <Character scale={0.02} position-y={1} animation={animation} />
        </group>
      </group>
      <CapsuleCollider args={[1.5, 0.5]} position={[0, 2, 0]} />
    </RigidBody>
  );
};