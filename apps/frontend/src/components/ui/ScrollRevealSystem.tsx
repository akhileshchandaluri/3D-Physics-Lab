import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

interface ScrollRevealProps {
  children: ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  delay?: number;
  duration?: number;
  distance?: number;
  staggerChildren?: number;
}

export function ScrollReveal({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.6,
  distance = 30,
  staggerChildren = 0,
}: ScrollRevealProps) {
  const prefersReducedMotion = usePrefersReducedMotion();

  if (prefersReducedMotion) {
    return <>{children}</>;
  }

  // Calculate coordinates based on directional request
  const getCoordinates = () => {
    switch (direction) {
      case 'up':
        return { y: distance };
      case 'down':
        return { y: -distance };
      case 'left':
        return { x: distance };
      case 'right':
        return { x: -distance };
      default:
        return {};
    }
  };

  const initial = {
    opacity: 0,
    filter: 'blur(8px)',
    ...getCoordinates(),
  };

  const animate = {
    opacity: 1,
    filter: 'blur(0px)',
    x: 0,
    y: 0,
    transition: {
      duration,
      delay,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
      staggerChildren: staggerChildren > 0 ? staggerChildren : undefined,
    },
  };

  return (
    <motion.div
      initial={initial}
      whileInView={animate}
      viewport={{ once: true, margin: '-10% 0px -10% 0px' }}
      style={{ width: '100%' }}
    >
      {children}
    </motion.div>
  );
}

interface StaggerContainerProps {
  children: ReactNode;
  delay?: number;
  staggerTime?: number;
}

export function StaggerContainer({
  children,
  delay = 0,
  staggerTime = 0.08,
}: StaggerContainerProps) {
  const prefersReducedMotion = usePrefersReducedMotion();

  if (prefersReducedMotion) {
    return <>{children}</>;
  }

  return (
    <motion.div
      initial="initial"
      whileInView="animate"
      viewport={{ once: true, margin: '-50px' }}
      variants={{
        initial: {},
        animate: {
          transition: {
            delayChildren: delay,
            staggerChildren: staggerTime,
          },
        },
      }}
      style={{ display: 'contents' }}
    >
      {children}
    </motion.div>
  );
}
