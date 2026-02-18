import React, { useEffect, useState, useRef } from 'react';
import './NeuralCursor.css';

export default function NeuralCursor() {
    const [isPointer, setIsPointer] = useState(false);
    const [hasMoved, setHasMoved] = useState(false);
    const cursorRef = useRef(null);
    const ringRef = useRef(null);

    useEffect(() => {
        let rafId;
        const moveCursor = (e) => {
            const { clientX: x, clientY: y } = e;

            if (!hasMoved) setHasMoved(true);

            // Use requestAnimationFrame for smoother performance
            cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(() => {
                if (cursorRef.current && ringRef.current) {
                    cursorRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
                    ringRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
                }
            });

            const target = e.target;
            const tagName = target.tagName;
            const isClickable =
                tagName === 'A' ||
                tagName === 'BUTTON' ||
                tagName === 'SELECT' ||
                tagName === 'TEXTAREA' ||
                tagName === 'INPUT' ||
                target.closest('a') ||
                target.closest('button') ||
                window.getComputedStyle(target).cursor === 'pointer';

            setIsPointer(!!isClickable);
        };

        window.addEventListener('mousemove', moveCursor);
        return () => {
            window.removeEventListener('mousemove', moveCursor);
            cancelAnimationFrame(rafId);
        };
    }, [hasMoved]);

    return (
        <>
            <div
                ref={ringRef}
                className={`neural-cursor-ring ${isPointer ? 'active' : ''}`}
                style={{ opacity: hasMoved ? 1 : 0 }}
            />
            <div
                ref={cursorRef}
                className={`neural-cursor-dot ${isPointer ? 'active' : ''}`}
                style={{ opacity: hasMoved ? 1 : 0 }}
            />
        </>
    );
}
