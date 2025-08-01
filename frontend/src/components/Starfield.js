import React, { useEffect, useRef } from 'react';

const Starfield = () => {
    const containerRef = useRef(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // Create stars as DOM elements instead of canvas
        const createStar = () => {
            const star = document.createElement('div');
            star.style.position = 'absolute';
            star.style.width = Math.random() * 3 + 1 + 'px';
            star.style.height = star.style.width;
            star.style.backgroundColor = 'white';
            star.style.borderRadius = '50%';
            star.style.left = Math.random() * 100 + '%';
            star.style.top = Math.random() * 100 + '%';
            star.style.opacity = Math.random() * 0.8 + 0.2;
            star.style.animation = `twinkle ${Math.random() * 3 + 2}s infinite alternate`;
            return star;
        };

        // Create multiple stars
        for (let i = 0; i < 150; i++) {
            container.appendChild(createStar());
        }

        return () => {
            // Cleanup
            container.innerHTML = '';
        };
    }, []);

    return (
        <>
            <style>
                {`
                    @keyframes twinkle {
                        from { opacity: 0.2; }
                        to { opacity: 1; }
                    }
                `}
            </style>
            <div
                ref={containerRef}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    zIndex: -1,
                    pointerEvents: 'none',
                    overflow: 'hidden'
                }}
            />
        </>
    );
};

export default Starfield;