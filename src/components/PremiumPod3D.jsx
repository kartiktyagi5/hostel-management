import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, Float, RoundedBox, MeshDistortMaterial, MeshWobbleMaterial, GradientTexture, PresentationControls, Environment, ContactShadows, Stars } from '@react-three/drei';
import * as THREE from 'three';

// --- Building Blocks ---

function GlassPanel({ position, size, color }) {
    return (
        <mesh position={position}>
            <boxGeometry args={size} />
            <meshPhysicalMaterial
                color={color}
                transmission={0.6}
                thickness={0.5}
                roughness={0}
                metalness={0.1}
                clearcoat={1}
                clearcoatRoughness={0}
            />
        </mesh>
    );
}

function NeonSign({ position, text, color }) {
    return (
        <group position={position}>
            <Text
                font="https://fonts.gstatic.com/s/montserrat/v25/JTUSjIg1_i6t8kCHKm459Wlhyw.woff"
                fontSize={0.25}
                color={color}
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.02}
                outlineColor={color}
            >
                {text}
                <meshBasicMaterial color={color} toneMapped={false} />
            </Text>
            {/* Glow Backing */}
            <pointLight intensity={2} distance={3} color={color} />
        </group>
    );
}

function FloatingPod() {
    return (
        <group>
            {/* Main Chamber - Sleek Capsule Shape */}
            <RoundedBox args={[3.2, 2, 3.2]} radius={0.5} smoothness={4} castShadow receiveShadow>
                <meshStandardMaterial color="#f8fafc" roughness={0.1} metalness={0.1} />
            </RoundedBox>

            {/* Glass Front Facade */}
            <GlassPanel position={[0, 0, 1.65]} size={[2.8, 1.6, 0.1]} color="#a5f3fc" />

            {/* Interior Glow (Simulated Life Inside) */}
            <mesh position={[0, -0.5, 1.5]}>
                <planeGeometry args={[2.5, 1]} />
                <meshBasicMaterial color="#fbbf24" transparent opacity={0.3} toneMapped={false} />
            </mesh>

            {/* Tech Stripe - Side */}
            <mesh position={[1.62, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <capsuleGeometry args={[0.05, 2, 4, 8]} />
                <meshStandardMaterial emissive="#6366f1" emissiveIntensity={3} color="#6366f1" toneMapped={false} />
            </mesh>
            <mesh position={[-1.62, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <capsuleGeometry args={[0.05, 2, 4, 8]} />
                <meshStandardMaterial emissive="#6366f1" emissiveIntensity={3} color="#6366f1" toneMapped={false} />
            </mesh>

            {/* Roof Top Garden Abstract */}
            <group position={[0, 1.1, 0]}>
                <mesh position={[-0.8, 0, -0.8]}>
                    <coneGeometry args={[0.4, 0.8, 32]} />
                    <meshStandardMaterial color="#22c55e" roughness={0.8} />
                </mesh>
                <mesh position={[0.8, 0, 0.5]}>
                    <coneGeometry args={[0.3, 0.6, 32]} />
                    <meshStandardMaterial color="#22c55e" roughness={0.8} />
                </mesh>
            </group>

            {/* Floating UI Elements */}
            <NeonSign position={[0, 1.5, 0]} text="HUB 01" color="#6366f1" />
        </group>
    );
}

function AbstractOrbs() {
    const orbs = useMemo(() => Array.from({ length: 5 }).map((_, i) => ({
        position: [
            (Math.random() - 0.5) * 8,
            (Math.random() - 0.5) * 4,
            (Math.random() - 0.5) * 4 - 2
        ],
        scale: Math.random() * 0.5 + 0.2,
        speed: Math.random() * 0.5 + 0.2
    })), []);

    return (
        <group>
            {orbs.map((orb, i) => (
                <Float key={i} speed={orb.speed} rotationIntensity={1} floatIntensity={1}>
                    <mesh position={orb.position}>
                        <sphereGeometry args={[orb.scale, 32, 32]} />
                        <MeshDistortMaterial
                            color="#fff"
                            emissive="#e0e7ff"
                            roughness={0}
                            metalness={1}
                            distort={0.4}
                            speed={2}
                        />
                    </mesh>
                </Float>
            ))}
        </group>
    );
}

export default function PremiumPod3D() {
    return (
        <>
            {/* High-End Lighting Studio */}
            <ambientLight intensity={0.2} />
            <spotLight
                position={[10, 10, 10]}
                angle={0.5}
                penumbra={1}
                intensity={2}
                color="#ffffff"
                castShadow
            />
            <pointLight position={[-10, 0, -5]} intensity={5} color="#6366f1" distance={20} />
            <pointLight position={[0, -5, 5]} intensity={2} color="#fbbf24" distance={10} />

            <Stars radius={100} depth={50} count={2000} factor={4} saturation={0} fade speed={1} />
            <Environment preset="city" />

            <PresentationControls
                config={{ mass: 2, tension: 500 }}
                snap={{ mass: 4, tension: 1500 }}
                rotation={[0, -Math.PI / 6, 0]}
                polar={[-Math.PI / 6, Math.PI / 6]}
                azimuth={[-Math.PI / 4, Math.PI / 4]}
            >
                <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5} floatingRange={[-0.2, 0.2]}>
                    <group position={[0, -0.5, 0]}>
                        <FloatingPod />
                    </group>
                </Float>
            </PresentationControls>

            <AbstractOrbs />
            <ContactShadows position={[0, -3, 0]} opacity={0.6} scale={20} blur={3} far={4} color="#0f172a" />
        </>
    );
}
