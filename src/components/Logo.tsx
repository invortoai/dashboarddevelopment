
import React from 'react';

const Logo: React.FC<{ className?: string }> = ({ className = "h-12 w-auto" }) => {
  return (
    <img 
      src="/logo.svg" 
      alt="Call Nexus Logo" 
      className={className} 
    />
  );
};

export default Logo;
