import React, { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Float, ContactShadows, Text, Html } from "@react-three/drei";

function RoomUnit({ position, label, status, delay }) {
    const mesh = useRef();
    const [hovered, setHover] = useState(false);

    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        mesh.current.position.y = position[1] + Math.sin(t * 0.5 + delay) * 0.05;
    });

    const color = status === 'occupied' ? '#ef4444' : '#22c55e'; // Red for occupied, Green for available

    return (
        <group ref={mesh} position={position}
            onPointerOver={() => setHover(true)}
            onPointerOut={() => setHover(false)}>

            {/* Room Structure */}
            <mesh castShadow receiveShadow>
                <boxGeometry args={[2.5, 1.2, 2.5]} />
                <meshStandardMaterial color={hovered ? "#e0e7ff" : "#ffffff"} roughness={0.1} metalness={0.1} />
            </mesh>

            {/* Bed/Window Area */}
            <mesh position={[0, 0, 1.26]}>
                <planeGeometry args={[2, 0.8]} />
                <meshStandardMaterial color="#bae6fd" emissive="#bae6fd" emissiveIntensity={0.2} roughness={0} metalness={0.9} />
            </mesh>

            {/* Status Indicator Light */}
            <mesh position={[1, 0.4, 1.27]}>
                <sphereGeometry args={[0.08, 16, 16]} />
                <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} />
            </mesh>

            {/* Floating Label */}
            <Html position={[0, 1, 0]} center distanceFactor={8} style={{ opacity: hovered ? 1 : 0, transition: 'opacity 0.2s' }}>
                <div style={{
                    background: 'rgba(255,255,255,0.9)',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontFamily: 'sans-serif',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                    whiteSpace: 'nowrap',
                    color: '#0f172a'
                }}>
                    {label} • {status.toUpperCase()}
                </div>
            </Html>
        </group>
    );
}

export default function HostelSystem3D() {
    const group = useRef();

    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        if (group.current) {
            // Subtle rotation to show all angles
            group.current.rotation.y = Math.sin(t * 0.1) * 0.2;
        }
    });

    return (
        <>
            <ambientLight intensity={0.7} />
            <directionalLight position={[10, 10, 5]} intensity={1.2} />
            <pointLight position={[-10, 0, -10]} intensity={0.5} color="#6366f1" />

            <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.5}>
                <group ref={group} rotation={[0, -Math.PI / 6, 0]}>

                    {/* Central Dashboard Screen */}
                    <mesh position={[0, 1, -1.5]}>
                        <boxGeometry args={[4, 2.5, 0.2]} />
                        <meshStandardMaterial color="#1e293b" />
                    </mesh>
                    <mesh position={[0, 1, -1.39]}>
                        <planeGeometry args={[3.8, 2.3]} />
                        <meshStandardMaterial color="#000" emissive="#6366f1" emissiveIntensity={0.1} />
                    </mesh>
                    <Text position={[0, 1.5, -1.35]} fontSize={0.25} color="#ffffff">
                        HOSTEL MANAGEMENT SYSTEM
                    </Text>
                    <Text position={[0, 1.0, -1.35]} fontSize={0.15} color="#94a3b8">
                        Target: 98% Occupancy
                    </Text>
                    <Text position={[0, 0.7, -1.35]} fontSize={0.15} color="#22c55e">
                        ● System Active
                    </Text>

                    {/* Stacked Living Units - Representing the Database of Rooms */}
                    <RoomUnit position={[0, -1.5, 0]} label="Room 101" status="occupied" delay={0} />
                    <RoomUnit position={[0, 0, 1.5]} label="Room 102" status="available" delay={1} />
                    <RoomUnit position={[0, 1.5, 0]} label="Room 201" status="occupied" delay={2} />

                    {/* Connection Lines (Data Flow) */}
                    <mesh position={[0, 0, -0.75]} rotation={[Math.PI / 2, 0, 0]}>
                        <cylinderGeometry args={[0.05, 0.05, 4, 8]} />
                        <meshStandardMaterial color="#64748b" metalness={0.8} />
                    </mesh>

                </group>
            </Float>

            <ContactShadows position={[0, -3, 0]} opacity={0.4} scale={10} blur={2} far={4} color="#000000" />
        </>
    );
}
