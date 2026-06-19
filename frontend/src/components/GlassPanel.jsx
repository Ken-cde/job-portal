import React from 'react';
import { motion } from 'framer-motion';

const GlassPanel = ({ children, className = '', angle = 0, opacity = '0.03', glow = false, shape = 'rect', onClick }) => {
  const shapes = {
    rect: 'none',
    shard: 'polygon(0% 0%, 90% 0%, 100% 10%, 10% 100%, 0% 90%)',
    trapezoid: 'polygon(0% 0%, 100% 0%, 90% 100%, 0% 100%)',
    rhombus: 'polygon(20% 0%, 100% 0%, 80% 100%, 0% 100%)'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, rotate: angle * 0.5 }}
      animate={{ opacity: 1, y: 0, rotate: angle }}
      transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
      onClick={onClick}
      className={`glass-panel ${glow ? 'glass-panel-bright' : ''} relative overflow-hidden ${className}`}
      style={{
        transform: `perspective(1000px) rotateX(${angle * -0.5}deg) rotateY(${angle}deg)`,
        clipPath: shapes[shape] || 'none'
      }}
    >
      {/* Subtle Inner Glow for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />

      <div className={`relative z-10 flex flex-col h-full ${shape !== 'rect' ? 'px-6 md:px-12' : ''}`}>
        {children}
      </div>
    </motion.div>
  );
};

export default GlassPanel;
