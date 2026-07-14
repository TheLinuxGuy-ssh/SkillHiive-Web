import React from 'react';
import { LazyMotion, domAnimation, m, type Variants } from 'framer-motion';

const swipeVariants: Variants = {
  initial: (direction: number) => ({
    opacity: 0,
    y: direction > 0 ? '3vw' : '3vw',
  }),
  animate: {
    opacity: 1,
    y: 0,
    transition: { type: 'tween', ease: 'easeInOut', duration: 0.125 },
  },
  exit: (direction: number) => ({
    opacity: 0,
    y: direction > 0 ? '3vw' : '-3vw',
    transition: { type: 'tween', ease: 'easeInOut', duration: 0.125 },
  }),
};

interface SwipeLayoutProps {
  children: React.ReactNode;
}

const SwipeLayout: React.FC<SwipeLayoutProps> = ({ children }) => {
  return (
    <LazyMotion features={domAnimation} strict>

      <m.div
        variants={swipeVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        style={{
          width: '100%',
          minHeight: '100vh',
          position: 'relative',
        }}
      >
        {children}
      </m.div>
    </LazyMotion>
  );
};

export default SwipeLayout;
