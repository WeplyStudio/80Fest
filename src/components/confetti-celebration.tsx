
"use client";

import { useState, useEffect } from 'react';
import ReactConfetti from 'react-confetti';
import { useWindowSize } from 'react-use';

export function ConfettiCelebration() {
    const { width, height } = useWindowSize();
    const [isRunning, setIsRunning] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsRunning(false);
        }, 12000); // Stop confetti after 12 seconds

        return () => clearTimeout(timer);
    }, []);

    if (!isRunning) {
        return null;
    }

    return (
        <ReactConfetti
            width={width}
            height={height}
            recycle={false}
            numberOfPieces={400}
            gravity={0.1}
            initialVelocityY={20}
            onConfettiComplete={() => setIsRunning(false)}
        />
    );
}
