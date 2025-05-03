
import React from 'react';

const Logo: React.FC<{ className?: string }> = ({ className = "h-8 w-auto" }) => {
  return (
    <div className={className}>
      <h1 className="text-xl font-bold text-white">AI</h1>
    </div>
  );
};

export default Logo;
