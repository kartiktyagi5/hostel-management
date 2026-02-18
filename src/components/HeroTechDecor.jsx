import React, { useMemo } from 'react';
import { Float, MeshDistortMaterial, Stars } from '@react-three/drei';

function TechElement({ position, color, speed, distort }) {
    return (
        <Float speed={speed} rotationIntensity={2} floatIntensity={2}>
            <mesh position={position}>
                <octahedronGeometry args={[0.4, 0]} />
                <MeshDistortMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={0.5}
                    distort={distort}
                    speed={2}
                    roughness={0}
                    metalness={1}
                />
            </mesh>
        </Float>
    );
}

export default function HeroTechDecor() {
    const elements = useMemo(() => [
        { pos: [-4, 2, -2], color: "#6366f1", speed: 2, distort: 0.3 },
        { pos: [4, -1, -3], color: "#f43f5e", speed: 1.5, distort: 0.5 },
        { pos: [-3, -2, -1], color: "#fbbf24", speed: 2.5, distort: 0.4 },
        { pos: [3, 2, -4], color: "#22c55e", speed: 1.8, distort: 0.2 },
    ], []);

    return (
        <group>
            <Stars radius={50} depth={50} count={1000} factor={4} saturation={0} fade speed={1} />
            {elements.map((el, i) => (
                <TechElement key={i} position={el.pos} color={el.color} speed={el.speed} distort={el.distort} />
            ))}
        </group>
    );
}
