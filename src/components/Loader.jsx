import React, { useState, useEffect } from 'react';
import './Loader.css';

export default function Loader({ onFinished }) {
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState('Initializing Haven OS...');

    useEffect(() => {
        const statuses = [
            'Syncing Neural Networks...',
            'Calibrating Atmospheric Controls...',
            'Decrypting Secure Protocols...',
            'Optimizing Living Nodes...',
            'System Ready.'
        ];

        let currentStatusIdx = 0;
        const interval = setInterval(() => {
            setProgress(prev => {
                const next = prev + Math.floor(Math.random() * 15) + 5;
                if (next >= 100) {
                    clearInterval(interval);
                    setTimeout(() => onFinished(), 500);
                    return 100;
                }

                // Update status text every 20-30%
                if (next > (currentStatusIdx + 1) * 20) {
                    currentStatusIdx++;
                    if (statuses[currentStatusIdx]) setStatus(statuses[currentStatusIdx]);
                }

                return next;
            });
        }, 150);

        return () => clearInterval(interval);
    }, [onFinished]);

    return (
        <div className="system-loader">
            <div className="loader-content">
                <div className="loader-logo">
                    <div className="logo-orb"></div>
                    <span className="logo-label">HAVEN OS</span>
                </div>
                <div className="progress-container">
                    <div className="progress-bar" style={{ width: `${progress}%` }}></div>
                </div>
                <div className="loader-status">
                    <span className="cursor-blink">{">"}</span> {status}
                </div>
                <div className="loader-percentage">{progress}%</div>
            </div>
            <div className="scanline"></div>
        </div>
    );
}
