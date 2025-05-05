import React, { useRef, useEffect, forwardRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import useControls from '@/hooks/useControls';

const PLAYER_SPEED = 5;

// Define props type - empty for now
type PlayerProps = Record<string, unknown>;

// Wrap with forwardRef, forwarding to the *root* element rendered by this component (which will be RigidBody)
// Note: The type forwarded is RapierRigidBody, matching the ref created inside.
const Player = forwardRef<RapierRigidBody, PlayerProps>((props, forwardedRef) => {
  // Ref for the RigidBody *created by this component*
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  // Ref for the visual mesh inside the RigidBody
  const meshRef = useRef<THREE.Mesh>(null);
  const controls = useControls();

  // Assign the forwarded ref (if any) to our internal rigidBodyRef
  // This allows parent components (if needed in the future) to get a ref to the physics body
  useEffect(() => {
    if (!forwardedRef) return;
    if (typeof forwardedRef === 'function') {
      forwardedRef(rigidBodyRef.current);
    } else {
      forwardedRef.current = rigidBodyRef.current;
    }
  }, [forwardedRef]);

  // Initial setup using the *internal* rigidBodyRef
  useEffect(() => {
    const body = rigidBodyRef.current;
    if (body) {
      body.setTranslation({ x: 0, y: 0.5, z: 0 }, true);
      body.setLinvel({ x: 0, y: 0, z: 0 }, true);
      body.setRotation({ w: 1.0, x: 0.0, y: 0.0, z: 0.0 }, true);
    }
  }, []); // Run once on mount

  // Frame loop using the *internal* rigidBodyRef
  useFrame((_state, _delta) => {
    const rigidBody = rigidBodyRef.current;
    const visualMesh = meshRef.current;
    if (!rigidBody || !visualMesh) return;

    // --- Movement ---
    const moveDirection = new THREE.Vector3(0, 0, 0);
    if (controls.forward) moveDirection.z -= 1;
    if (controls.backward) moveDirection.z += 1;
    if (controls.left) moveDirection.x -= 1;
    if (controls.right) moveDirection.x += 1;

    // --- Apply Velocity ---
    const currentVel = rigidBody.linvel();
    const targetVel = new THREE.Vector3(0, currentVel.y, 0);

    if (moveDirection.lengthSq() > 0) {
      moveDirection.normalize().multiplyScalar(PLAYER_SPEED);
      targetVel.x = moveDirection.x;
      targetVel.z = moveDirection.z;
    }

    rigidBody.setLinvel(targetVel, true);

    // --- Sync visual mesh ---
    visualMesh.position.copy(rigidBody.translation());
    visualMesh.rotation.copy(rigidBody.rotation() as unknown as THREE.Euler);
  });

  // Return RigidBody containing the mesh.
  // Pass the internal rigidBodyRef to it.
  // Spread props to allow passing standard RigidBody props from parent.
  return (
    <RigidBody
      ref={rigidBodyRef}
      colliders="cuboid"
      type="dynamic"
      enabledRotations={[false, false, false]}
      position={[0, 0.5, 0]} // Initial position can be set here too
      gravityScale={0}
      friction={0}
      restitution={0}
      linearDamping={0.5}
      angularDamping={0.5}
      name="player"
      {...props} // Pass down any props meant for RigidBody
    >
      <mesh ref={meshRef} castShadow>
        <boxGeometry args={[0.8, 0.8, 0.8]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
    </RigidBody>
  );
});

Player.displayName = 'PlayerWithPhysics'; // New display name

export default Player;
