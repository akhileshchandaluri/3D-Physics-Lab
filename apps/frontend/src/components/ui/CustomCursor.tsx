import { useEffect, useState, useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

type CursorMode = 'default' | 'button' | 'card' | 'formula' | 'slider';

export function CustomCursor() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [isVisible, setIsVisible] = useState(false);
  const [mode, setMode] = useState<CursorMode>('default');
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Position of the mouse
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  // Velocity values for cursor stretching
  const cursorScaleX = useMotionValue(1);
  const cursorScaleY = useMotionValue(1);
  const cursorRotate = useMotionValue(0);

  // Spring physics configs
  const springConfig = { damping: 30, stiffness: 260, mass: 0.6 };
  const cursorX = useSpring(mouseX, springConfig);
  const cursorY = useSpring(mouseY, springConfig);

  const lastPos = useRef({ x: 0, y: 0, time: Date.now() });

  useEffect(() => {
    // Check if it's a touch screen device or hovering is not supported
    const touchMediaQuery = window.matchMedia('(hover: none)');
    if (touchMediaQuery.matches || navigator.maxTouchPoints > 0) {
      setIsTouchDevice(true);
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!isVisible) setIsVisible(true);

      const { clientX: x, clientY: y } = e;
      mouseX.set(x);
      mouseY.set(y);

      // Calculate velocity and angle for stretching
      const now = Date.now();
      const dt = Math.max(now - lastPos.current.time, 1); // avoid division by 0
      const dx = x - lastPos.current.x;
      const dy = y - lastPos.current.y;
      
      const speed = Math.sqrt(dx * dx + dy * dy) / dt;
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);

      if (speed > 0.05 && !prefersReducedMotion) {
        // Stretch in direction of movement, squeeze perpendicular to it
        const stretch = Math.min(speed * 3.5, 0.45);
        cursorScaleX.set(1 + stretch);
        cursorScaleY.set(1 - stretch * 0.5);
        cursorRotate.set(angle);
      } else {
        cursorScaleX.set(1);
        cursorScaleY.set(1);
        cursorRotate.set(0);
      }

      lastPos.current = { x, y, time: now };

      // Element hover state detection
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const isButton = target.closest('a, button, [role="button"], .MuiButtonBase-root, .MuiSlider-thumb');
      const isFormula = target.closest('.katex, .formula-container, .precision-hud');
      const isSlider = target.closest('.MuiSlider-root');
      const isCard = target.closest('.tilt-card, .experiment-card, .MuiCard-root');

      if (isFormula) {
        setMode('formula');
      } else if (isSlider) {
        setMode('slider');
      } else if (isButton) {
        setMode('button');
      } else if (isCard) {
        setMode('card');
      } else {
        setMode('default');
      }
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    const handleMouseEnter = () => {
      setIsVisible(true);
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [mouseX, mouseY, cursorScaleX, cursorScaleY, cursorRotate, isVisible, prefersReducedMotion]);

  if (prefersReducedMotion || isTouchDevice || !isVisible) {
    return null;
  }

  // Dynamic styling properties based on the hover mode
  const getModeStyles = () => {
    switch (mode) {
      case 'button':
        return {
          width: 44,
          height: 44,
          border: '1.5px solid rgba(99, 102, 241, 0.8)',
          backgroundColor: 'rgba(99, 102, 241, 0.08)',
          boxShadow: '0 0 15px rgba(99, 102, 241, 0.3)',
        };
      case 'formula':
        return {
          width: 8,
          height: 8,
          border: '1.5px solid rgba(16, 185, 129, 0.9)',
          backgroundColor: 'rgba(16, 185, 129, 0.9)',
          boxShadow: '0 0 8px rgba(16, 185, 129, 0.5)',
        };
      case 'slider':
        return {
          width: 14,
          height: 24,
          border: '1.5px solid rgba(249, 115, 22, 0.8)',
          backgroundColor: 'transparent',
          borderRadius: 4,
          boxShadow: '0 0 8px rgba(249, 115, 22, 0.2)',
        };
      case 'card':
        return {
          width: 32,
          height: 32,
          border: '1.5px solid rgba(6, 182, 212, 0.8)',
          backgroundColor: 'rgba(6, 182, 212, 0.04)',
          boxShadow: '0 0 12px rgba(6, 182, 212, 0.25)',
        };
      default:
        return {
          width: 22,
          height: 22,
          border: '1.5px solid rgba(99, 102, 241, 0.5)',
          backgroundColor: 'transparent',
          boxShadow: 'none',
        };
    }
  };

  const styleProps = getModeStyles();

  return (
    <>
      {/* Outer Follower Ring */}
      <motion.div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          x: cursorX,
          y: cursorY,
          translateX: '-50%',
          translateY: '-50%',
          borderRadius: styleProps.borderRadius ?? '50%',
          pointerEvents: 'none',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mixBlendMode: 'normal',
          scaleX: cursorScaleX,
          scaleY: cursorScaleY,
          rotate: cursorRotate,
        }}
        animate={{
          width: styleProps.width,
          height: styleProps.height,
          border: styleProps.border,
          backgroundColor: styleProps.backgroundColor,
          boxShadow: styleProps.boxShadow,
        }}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 28,
        }}
      >
        {/* Reticle lines for precision formula mode */}
        {mode === 'formula' && (
          <div
            style={{
              position: 'absolute',
              width: 16,
              height: 16,
              pointerEvents: 'none',
            }}
          >
            <div style={{ position: 'absolute', top: 8, left: -4, right: -4, height: 1, backgroundColor: 'rgba(16, 185, 129, 0.4)' }} />
            <div style={{ position: 'absolute', left: 8, top: -4, bottom: -4, width: 1, backgroundColor: 'rgba(16, 185, 129, 0.4)' }} />
          </div>
        )}
      </motion.div>

      {/* Tiny inner center dot */}
      <motion.div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          x: mouseX,
          y: mouseY,
          translateX: '-50%',
          translateY: '-50%',
          width: 4,
          height: 4,
          borderRadius: '50%',
          backgroundColor: mode === 'formula' ? 'rgba(16, 185, 129, 1)' : 'rgba(99, 102, 241, 1)',
          pointerEvents: 'none',
          zIndex: 10000,
        }}
        animate={{
          scale: mode === 'button' ? 1.5 : 1,
          opacity: mode === 'slider' ? 0 : 1,
        }}
        transition={{ duration: 0.15 }}
      />
    </>
  );
}
