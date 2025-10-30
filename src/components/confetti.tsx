
"use client";
import React, { useEffect, useState } from 'react';

const ConfettiPiece = ({ id, style }: { id: number, style: React.CSSProperties }) => (
    <div
        key={id}
        className="confetti-piece"
        style={style}
    />
);

const Confetti = () => {
    const [pieces, setPieces] = useState<Array<{ id: number, style: React.CSSProperties }>>([]);

    useEffect(() => {
        const newPieces = Array.from({ length: 150 }).map((_, index) => {
            const style: React.CSSProperties = {
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${Math.random() * 3 + 2}s`,
                backgroundColor: `hsl(${Math.random() * 360}, 100%, 50%)`,
                transform: `rotate(${Math.random() * 360}deg)`,
            };
            return { id: index, style };
        });
        setPieces(newPieces);
    }, []);

    return (
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
            {pieces.map(p => <ConfettiPiece key={p.id} {...p} />)}
        </div>
    );
};

export default Confetti;
