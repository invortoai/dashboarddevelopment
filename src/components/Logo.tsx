
import React from 'react';

const Logo: React.FC<{ className?: string }> = ({ className = "h-12 w-auto" }) => {
  return (
    <div className="flex items-center">
      <h1 className="text-xl font-bold text-white">INVORTO AI</h1>
    </div>
  );
};

export default Logo;
