import { motion, useSpring, useTransform, useMotionValue } from 'framer-motion';
import { useEffect } from 'react';

/**
 * WateryCard: A wrapper that adds a slow, drifting floating motion
 * and a "watery" elastic interaction.
 */
export const WateryCard = ({ children, className = '', angle = 0 }) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth out the mouse movement for that "underwater" feel
  const springX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 50, damping: 20 });

  const rotateX = useTransform(springY, [-100, 100], [5, -5]);
  const rotateY = useTransform(springX, [-100, 100], [-5, 5]);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        perspective: '1000px',
      }}
      animate={{
        y: [0, -10, 0], // Slow floating drift
      }}
      transition={{
        y: { duration: 6, repeat: Infinity, ease: "easeInOut" },
      }}
      className={`relative ${className}`}
    >
      {children}
    </motion.div>
  );
};

/**
 * RippleButton: Cinematic button with an aqua glow and elastic transition.
 */
export const RippleButton = ({ children, onClick, className = '', variant = 'primary' }) => {
  return (
    <motion.button
      whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(120, 232, 255, 0.4)' }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`
        relative overflow-hidden px-8 py-3 rounded-full cinematic-text transition-all duration-500
        ${variant === 'primary'
          ? 'bg-p3cyan text-p3midnight font-bold hover:bg-white'
          : 'border border-p3cyan/30 text-white hover:bg-p3cyan/20'}
        ${className}
      `}
    >
      <span className="relative z-10">{children}</span>
      {/* Watery Ripple Effect */}
      <motion.div
        className="absolute inset-0 bg-white/20"
        initial={{ opacity: 0, scale: 0 }}
        whileHover={{ opacity: 1, scale: 1.5 }}
        transition={{ duration: 0.6 }}
        style={{ borderRadius: '50%', transform: 'translate(-50%, -50%)' }}
      />
    </motion.button>
  );
};

/**
 * PageTransition: The "Ripple-Fade" reveal for switching pages.
 */
export const PageTransition = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, filter: 'blur(10px)', scale: 0.98 }}
      animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
      exit={{ opacity: 0, filter: 'blur(10px)', scale: 1.02 }}
      transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
      className="w-full h-full"
    >
      {children}
    </motion.div>
  );
};

/**
 * P3Slam: A wrapper that "slams" content into place with a fast, overshoot spring.
 * Useful for menu items and headers.
 */
export const P3Slam = ({ children, direction = 'right', delay = 0 }) => {
  const variants = {
    right: { x: 50, opacity: 0 },
    left: { x: -50, opacity: 0 },
    bottom: { y: 50, opacity: 0 },
    top: { y: -50, opacity: 0 },
  };

  return (
    <motion.div
      initial={variants[direction]}
      animate={{ x: 0, y: 0, opacity: 1 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20,
        delay
      }}
    >
      {children}
    </motion.div>
  );
};

