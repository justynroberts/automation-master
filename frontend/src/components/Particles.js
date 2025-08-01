import React from 'react';

const Particles = () => {
    // Generate particles as static elements
    const particles = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        size: Math.random() * 3 + 1,
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 20,
        duration: Math.random() * 20 + 10,
        opacity: Math.random() * 0.6 + 0.2
    }));

    return (
        <>
            <style>{`
                @keyframes particle-float {
                    0% { 
                        transform: translate(0, 0) rotate(0deg); 
                        opacity: 0.2; 
                    }
                    25% { 
                        transform: translate(30px, -50px) rotate(90deg); 
                        opacity: 0.8; 
                    }
                    50% { 
                        transform: translate(-20px, -100px) rotate(180deg); 
                        opacity: 1; 
                    }
                    75% { 
                        transform: translate(-40px, -50px) rotate(270deg); 
                        opacity: 0.6; 
                    }
                    100% { 
                        transform: translate(0, 0) rotate(360deg); 
                        opacity: 0.2; 
                    }
                }
                .particle {
                    position: absolute;
                    background: radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.2) 70%, transparent 100%);
                    border-radius: 50%;
                    pointer-events: none;
                    animation: particle-float infinite linear;
                }
            `}</style>
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    zIndex: -1,
                    pointerEvents: 'none',
                    overflow: 'hidden'
                }}
            >
                {particles.map((particle) => (
                    <div
                        key={particle.id}
                        className="particle"
                        style={{
                            width: `${particle.size}px`,
                            height: `${particle.size}px`,
                            left: `${particle.left}%`,
                            top: `${particle.top}%`,
                            opacity: particle.opacity,
                            animationDelay: `${particle.delay}s`,
                            animationDuration: `${particle.duration}s`,
                        }}
                    />
                ))}
            </div>
        </>
    );
};

export default Particles;