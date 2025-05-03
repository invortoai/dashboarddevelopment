
import React from 'react';

const Logo: React.FC<{ className?: string }> = ({ className = "h-8 w-auto" }) => {
  return (
    <div className={className}>
      <img 
        src="/lovable-uploads/b3660e55-73b3-4ab0-8b83-841a631ef0de.png" 
        alt="Logo" 
        className="h-full" 
      />
    </div>
  );
};

export default Logo;
