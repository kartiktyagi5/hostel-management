import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Float, PresentationControls, ContactShadows, Environment, useGLTF } from "@react-three/drei";

function Furniture({ position, size, color, metalness = 0.1, roughness = 0.8, castShadow = true }) {
    return (
        <mesh position={position} castShadow={castShadow} receiveShadow>
            <boxGeometry args={size} />
            <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
        </mesh>
    );
}

function ModernLamp({ position }) {
    return (
        <group position={position}>
            <mesh position={[0, 0.4, 0]}>
                <cylinderGeometry args={[0.05, 0.05, 0.8]} />
                <meshStandardMaterial color="#333" />
            </mesh>
            <mesh position={[0, 0.9, 0]}>
                <coneGeometry args={[0.2, 0.3, 32, 1, true]} />
                <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.5} transparent opacity={0.8} />
            </mesh>
            <pointLight position={[0, 0.8, 0]} intensity={0.5} color="#fbbf24" distance={2} />
        </group>
    );
}

export default function LuxuryRoom3D() {
    const roomRef = useRef();

    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        if (roomRef.current) {
            roomRef.current.rotation.y = Math.sin(t * 0.1) * 0.1;
        }
    });

    return (
        <>
            <ambientLight intensity={0.5} />
            <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} shadow-mapSize={[256, 256]} castShadow />
            <Environment preset="city" />

            <PresentationControls
                global
                zoom={0.8}
                rotation={[0, -Math.PI / 4, 0]}
                polar={[-Math.PI / 4, Math.PI / 4]}
                azimuth={[-Math.PI / 4, Math.PI / 4]}
            >
                <group ref={roomRef} position={[0, -1, 0]} dispose={null}>
                    {/* Floor Base */}
                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
                        <boxGeometry args={[4, 4, 0.1]} />
                        <meshStandardMaterial color="#e2e8f0" roughness={0.1} />
                    </mesh>

                    {/* Back Walls */}
                    <mesh position={[-0.05, 1, -2]} receiveShadow>
                        <boxGeometry args={[4.1, 2.1, 0.1]} />
                        <meshStandardMaterial color="#f8fafc" />
                    </mesh>
                    <mesh position={[-2, 1, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
                        <boxGeometry args={[4, 2.1, 0.1]} />
                        <meshStandardMaterial color="#f1f5f9" />
                    </mesh>

                    {/* Bed */}
                    <group position={[-1, 0.3, 1]}>
                        <Furniture position={[0, 0, 0]} size={[1.4, 0.6, 2]} color="#1e293b" /> {/* Frame */}
                        <Furniture position={[0, 0.35, 0.1]} size={[1.3, 0.2, 1.8]} color="#ffffff" /> {/* Mattress */}
                        <Furniture position={[0, 0.5, -0.6]} size={[1.3, 0.1, 0.4]} color="#fbbf24" /> {/* Pillow */}
                    </group>

                    {/* Study Desk Area */}
                    <group position={[1.2, 0, -1.2]}>
                        <Furniture position={[0, 0.75, 0]} size={[1.2, 0.05, 0.6]} color="#0f172a" metalness={0.5} /> {/* Desk Top */}
                        <Furniture position={[-0.55, 0.375, 0.25]} size={[0.05, 0.75, 0.05]} color="#333" /> {/* Leg */}
                        <Furniture position={[0.55, 0.375, 0.25]} size={[0.05, 0.75, 0.05]} color="#333" /> {/* Leg */}
                        <Furniture position={[-0.55, 0.375, -0.25]} size={[0.05, 0.75, 0.05]} color="#333" /> {/* Leg */}
                        <Furniture position={[0.55, 0.375, -0.25]} size={[0.05, 0.75, 0.05]} color="#333" /> {/* Leg */}

                        {/* Laptop */}
                        <group position={[0, 0.78, 0]}>
                            <mesh position={[0, 0, 0.1]}>
                                <boxGeometry args={[0.4, 0.02, 0.3]} />
                                <meshStandardMaterial color="#94a3b8" metalness={0.8} />
                            </mesh>
                            <mesh position={[0, 0.15, -0.05]} rotation={[-0.2, 0, 0]}>
                                <boxGeometry args={[0.4, 0.3, 0.02]} />
                                <meshStandardMaterial color="#0f172a" metalness={0.8} />
                            </mesh>
                        </group>
                    </group>

                    {/* Window */}
                    <mesh position={[-2, 1.2, 0.5]}>
                        <boxGeometry args={[0.2, 1.2, 1.5]} />
                        <meshStandardMaterial color="#bae6fd" transparent opacity={0.6} roughness={0.1} metalness={0.1} />
                    </mesh>

                    {/* Decor */}
                    <ModernLamp position={[1.5, 0, 1.5]} />
                    <Furniture position={[1.5, 0.2, 1.5]} size={[0.4, 0.4, 0.4]} color="#cbd5e1" /> {/* Side Table */}

                    {/* Rug */}
                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
                        <circleGeometry args={[1.2, 32]} />
                        <meshStandardMaterial color="#6366f1" roughness={0.8} />
                    </mesh>

                </group>
            </PresentationControls>

            <ContactShadows position={[0, -1.4, 0]} opacity={0.4} scale={10} blur={2} far={4} resolution={256} />

        </>
    );
}
