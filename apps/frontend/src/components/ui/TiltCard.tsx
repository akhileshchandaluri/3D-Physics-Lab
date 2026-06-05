import { useRef, useState } from 'react';
import { Card, useTheme } from '@mui/material';
import type { CardProps } from '@mui/material';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

interface TiltCardProps extends CardProps {
  maxRotation?: number; // Maximum rotation angle in degrees
  hoverEffect?: boolean;
}

export function TiltCard({
  children,
  maxRotation = 8,
  hoverEffect = true,
  sx,
  ...props
}: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const theme = useTheme();
  const prefersReducedMotion = usePrefersReducedMotion();
  const isDark = theme.palette.mode === 'dark';

  // Motion values for tilt angles
  const rotateXVal = useMotionValue(0);
  const rotateYVal = useMotionValue(0);

  // Motion values for the glare coordinates (percentage of card width/height)
  const glareX = useMotionValue(50);
  const glareY = useMotionValue(50);
  const glareOpacity = useMotionValue(0);

  // Springs for smooth settling and overshoot physics
  const springConfig = { damping: 22, stiffness: 220, mass: 0.8 };
  const rotateX = useSpring(rotateXVal, springConfig);
  const rotateY = useSpring(rotateYVal, springConfig);

  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion || !hoverEffect) return;

    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // Mouse coordinate relative to the center of the card
    const mouseX = e.clientX - rect.left - width / 2;
    const mouseY = e.clientY - rect.top - height / 2;

    // Normalized ratio (-1 to 1)
    const normalizedX = mouseX / (width / 2);
    const normalizedY = mouseY / (height / 2);

    // Apply rotation angle (negative Y coordinate causes positive X rotation)
    rotateXVal.set(-normalizedY * maxRotation);
    rotateYVal.set(normalizedX * maxRotation);

    // Glare position percentage (0% to 100%)
    glareX.set((e.clientX - rect.left) / width * 100);
    glareY.set((e.clientY - rect.top) / height * 100);
    glareOpacity.set(0.15); // Show glare on hover
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (!prefersReducedMotion && hoverEffect) {
      glareOpacity.set(0.15);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    // Smooth reset tilt to center
    rotateXVal.set(0);
    rotateYVal.set(0);
    glareOpacity.set(0);
  };

  // Safe mapping of motion values to CSS percentage strings
  const glareXPercent = useTransform(glareX, (v) => `${v}%`);
  const glareYPercent = useTransform(glareY, (v) => `${v}%`);

  const glareStyle = {
    position: 'absolute' as const,
    inset: 0,
    pointerEvents: 'none' as const,
    zIndex: 10,
    opacity: glareOpacity,
    background: 'radial-gradient(circle at var(--glare-x) var(--glare-y), rgba(255, 255, 255, 0.22) 0%, transparent 60%)',
  };

  return (
    <div
      style={{
        perspective: 1000,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX: prefersReducedMotion ? 0 : rotateX,
          rotateY: prefersReducedMotion ? 0 : rotateY,
          transformStyle: 'preserve-3d',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
        animate={{
          y: isHovered && hoverEffect ? -6 : 0,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        <Card
          elevation={0}
          sx={{
            position: 'relative',
            overflow: 'hidden',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            transition: prefersReducedMotion 
              ? 'none' 
              : 'border-color 0.3s ease, box-shadow 0.3s ease',
            border: isHovered && hoverEffect
              ? `1px solid ${isDark ? 'rgba(99, 102, 241, 0.4)' : 'rgba(99, 102, 241, 0.25)'}`
              : `1px solid ${theme.palette.divider}`,
            boxShadow: isHovered && hoverEffect
              ? isDark
                ? '0 12px 32px -10px rgba(99, 102, 241, 0.35), 0 0 15px rgba(99, 102, 241, 0.08)'
                : '0 12px 32px -10px rgba(0, 0, 0, 0.12)'
              : theme.shadows[1],
            ...sx,
          }}
          {...props}
        >
          {/* Specular glare reflection overlay */}
          {!prefersReducedMotion && hoverEffect && (
            <motion.div
              style={{
                ...glareStyle,
                ...({
                  '--glare-x': glareXPercent,
                  '--glare-y': glareYPercent,
                } as any)
              }}
            />
          )}

          {/* Dynamic Card Border Edge Light */}
          {!prefersReducedMotion && hoverEffect && isHovered && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: 'inherit',
                pointerEvents: 'none',
                border: `1.5px solid transparent`,
                background: `linear-gradient(135deg, rgba(99, 102, 241, 0.2), transparent, rgba(6, 182, 212, 0.2)) border-box`,
                mask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
                maskComposite: 'exclude',
                WebkitMaskComposite: 'xor',
                zIndex: 9,
              }}
            />
          )}

          <div style={{ transform: 'translateZ(10px)', height: '100%', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
            {children}
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
