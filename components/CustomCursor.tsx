'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function CustomCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const updatePosition = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    const updateHoverState = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Check if the target is clickable or input
      const isClickable = target.closest('a') !== null || 
                          target.closest('button') !== null || 
                          target.closest('input') !== null || 
                          window.getComputedStyle(target).cursor === 'pointer';
      
      setIsHovering(isClickable);
    };

    window.addEventListener('mousemove', updatePosition);
    window.addEventListener('mouseover', updateHoverState);

    return () => {
      window.removeEventListener('mousemove', updatePosition);
      window.removeEventListener('mouseover', updateHoverState);
    };
  }, []);

  return (
    <>
      <motion.div
        className="fixed top-0 left-0 w-4 h-4 rounded-full bg-[#B45309] pointer-events-none z-[100] mix-blend-multiply"
        animate={{
          x: position.x - 8,
          y: position.y - 8,
          scale: isHovering ? 2.5 : 1,
          opacity: isHovering ? 0.4 : 0.8,
        }}
        transition={{
          type: 'spring',
          stiffness: 150,
          damping: 15,
          mass: 0.1,
        }}
      />
      <motion.div
        className="fixed top-0 left-0 w-1 h-1 rounded-full bg-[#1C1917] pointer-events-none z-[100]"
        animate={{
          x: position.x - 2,
          y: position.y - 2,
        }}
        transition={{
          type: 'tween',
          ease: 'linear',
          duration: 0,
        }}
      />
    </>
  );
}
