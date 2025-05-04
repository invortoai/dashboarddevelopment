
import React from 'react';

const Logo: React.FC<{ className?: string; text?: boolean }> = ({ className = "h-8 w-auto", text = true }) => {
  return (
    <div className={className}>
      {text ? (
        <span className="text-xl font-bold text-white">INVORTO AI</span>
      ) : (
        <img 
          src="/uploads/b3660e55-73b3-4ab0-8b83-841a631ef0de.png" 
          alt="Logo" 
          className="h-full" 
        />
      )}
    </div>
  );
};

export default Logo;
