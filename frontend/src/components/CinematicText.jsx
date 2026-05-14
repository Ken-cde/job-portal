import React from 'react';

const CinematicText = ({ children, variant = 'h1', className = '' }) => {
  const styles = {
    h1: 'oversized-text text-white absolute z-0 uppercase',
    h2: 'cinematic-text text-4xl font-light text-white uppercase tracking-widest',
    h3: 'cinematic-text text-xl font-light text-p3cyan uppercase tracking-wide',
    aggressive: 'cinematic-text text-2xl font-black italic text-p3cyan uppercase tracking-tighter skew-x-[-10deg] inline-block',
    body: 'font-light text-white/70 leading-relaxed',
    label: 'cinematic-text text-xs text-p3cyan/60 uppercase tracking-tighter'
  };

  return (
    <div className={`${styles[variant]} ${className}`}>
      {children}
    </div>
  );
};

export default CinematicText;
