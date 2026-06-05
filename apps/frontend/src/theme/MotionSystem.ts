import type { Transition, Variants } from 'framer-motion';

// Spring configurations simulating natural weight and inertia
export const SPRING_GENTLE: Transition = {
  type: 'spring',
  stiffness: 120,
  damping: 14,
  mass: 1,
};

export const SPRING_ELASTIC: Transition = {
  type: 'spring',
  stiffness: 180,
  damping: 12,
  mass: 0.8,
};

export const SPRING_PANEL: Transition = {
  type: 'spring',
  stiffness: 100,
  damping: 18,
  mass: 1.2,
};

export const SPRING_FLOAT: Transition = {
  type: 'spring',
  stiffness: 60,
  damping: 15,
  mass: 1,
};

export const TRANSITION_FAST: Transition = {
  type: 'tween',
  ease: [0.16, 1, 0.3, 1],
  duration: 0.3,
};

export const TRANSITION_SMOOTH: Transition = {
  type: 'tween',
  ease: [0.16, 1, 0.3, 1],
  duration: 0.6,
};

// Orchestrated stagger timings
export const STAGGER_FAST = {
  staggerChildren: 0.05,
};

export const STAGGER_CASCADE = {
  staggerChildren: 0.1,
};

// Reusable motion variants
export const FADE_UP: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: SPRING_GENTLE },
  exit: { opacity: 0, y: -20, transition: TRANSITION_FAST },
};

export const FADE_LEFT: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0, transition: SPRING_GENTLE },
  exit: { opacity: 0, x: -20, transition: TRANSITION_FAST },
};

export const FADE_RIGHT: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0, transition: SPRING_GENTLE },
  exit: { opacity: 0, x: 20, transition: TRANSITION_FAST },
};

export const BLUR_REVEAL: Variants = {
  initial: { opacity: 0, filter: 'blur(10px)', scale: 0.98 },
  animate: { opacity: 1, filter: 'blur(0px)', scale: 1, transition: TRANSITION_SMOOTH },
  exit: { opacity: 0, filter: 'blur(10px)', scale: 0.98, transition: TRANSITION_FAST },
};
