import { useRef, useState, useEffect } from 'react';
import type { ReactElement } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

interface MagneticProps {
  children: ReactElement;
  range?: number;    // Distance threshold in pixels to start magnetic pull
  strength?: number; // Scale of pull (e.g. 0.35 = moves 35% of the distance to the cursor)
}

export function Magnetic({ children, range = 80, strength = 0.35 }: MagneticProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { stiffness: 120, damping: 15, mass: 0.8 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion) return;

    const element = ref.current;
    if (!element) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < range) {
        setIsHovered(true);
        // Elastic drag pull relative to center of element
        x.set(dx * strength);
        y.set(dy * strength);
      } else {
        setIsHovered(false);
        x.set(0);
        y.set(0);
      }
    };

    const handleMouseLeave = () => {
      setIsHovered(false);
      x.set(0);
      y.set(0);
    };

    window.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [prefersReducedMotion, range, strength, x, y]);

  if (prefersReducedMotion) {
    return children;
  }

  return (
    <motion.div
      ref={ref}
      style={{
        x: springX,
        y: springY,
        display: 'inline-block',
      }}
      animate={{
        scale: isHovered ? 1.03 : 1,
      }}
      transition={{ type: 'spring', stiffness: 200, damping: 10 }}
    >
      {children}
    </motion.div>
  );
}
