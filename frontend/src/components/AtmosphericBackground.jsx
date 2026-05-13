import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Lenis from 'lenis';

const AtmosphericBackground = () => {
  useEffect(() => {
    const lenis = new Lenis();
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    return () => lenis.destroy();
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Deep Navy Base Gradient */}
      <div className="absolute inset-0 bg-p3-gradient" />

      {/* The "Moon" Element - Focal Point of Atmosphere */}
      <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-p3cyan rounded-full blur-[120px] opacity-20 animate-glow-pulse" />

      {/* Ambient Fog/Bloom */}
      <div className="absolute inset-0 bg-p3-glow opacity-50" />

      {/* Floating Particles */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="ambient-particle"
            style={{
              width: Math.random() * 100 + 50 + 'px',
              height: Math.random() * 100 + 50 + 'px',
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
            }}
            animate={{
              y: [0, -100, 0],
              x: [0, 50, 0],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default AtmosphericBackground;
