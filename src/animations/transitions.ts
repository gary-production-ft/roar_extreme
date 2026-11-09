import type { Transition } from 'framer-motion';

export const springSmooth: Transition = {
  type: 'spring',
  stiffness: 100,
  damping: 20,
  mass: 1,
};

export const springSnappy: Transition = {
  type: 'spring',
  stiffness: 260,
  damping: 20,
};

export const easeOut: Transition = {
  duration: 0.5,
  ease: [0.16, 1, 0.3, 1],
};

export const easeOutSlow: Transition = {
  duration: 0.9,
  ease: [0.16, 1, 0.3, 1],
};

export const cinematic: Transition = {
  duration: 1.2,
  ease: [0.76, 0, 0.24, 1],
};

export const pageTransition: Transition = {
  duration: 0.4,
  ease: [0.16, 1, 0.3, 1],
};

