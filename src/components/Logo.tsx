
import React from 'react';

const Logo: React.FC<{ className?: string }> = ({ className = "h-12 w-auto" }) => {
  return (
    <div className="flex items-center gap-2">
      <img 
        src="/lovable-uploads/bedf8a4a-fb1c-4753-be61-f11447dad31f.png" 
        alt="Invorto AI Logo" 
        className={className} 
      />
    </div>
  );
};

export default Logo;
