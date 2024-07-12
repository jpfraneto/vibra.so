import React, { useState, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';

interface VibrationEffectProps {
  children: React.ReactNode;
  isVibrating: boolean;
  intensity: number;
}

const VibrationEffect: React.FC<VibrationEffectProps> = ({ children, isVibrating, intensity }) => {
  const controls = useAnimation();

  useEffect(() => {
    if (isVibrating) {
      controls.start({
        x: [0, -2, 2, -2, 0].map(v => v * intensity),
        y: [0, -1, 1, -1, 0].map(v => v * intensity),
        transition: {
          duration: 0.15,
          repeat: Infinity,
          repeatType: "reverse",
        },
      });
    } else {
      controls.stop();
      controls.set({ x: 0, y: 0 });
    }
  }, [isVibrating, intensity, controls]);

  return (
    <motion.div animate={controls}>
      {children}
    </motion.div>
  );
};

export default VibrationEffect;