import type { ReactNode } from 'react';
import { Container } from '@mui/material';
import type { ContainerProps } from '@mui/material';
import { motion } from 'framer-motion';

interface PageContainerProps extends ContainerProps {
  children: ReactNode;
}

export function PageContainer({ children, sx, ...props }: PageContainerProps) {
  return (
    <Container 
      maxWidth="lg" 
      component={motion.div}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      sx={{
        py: 4,
        ...sx
      }}
      {...props}
    >
      {children}
    </Container>
  );
}
