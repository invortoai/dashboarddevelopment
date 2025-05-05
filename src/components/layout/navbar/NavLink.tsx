
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface NavLinkProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  collapsed?: boolean;
  onNavigate?: () => void;
  isMobile?: boolean;
}

/**
 * Shared NavLink component used by both mobile and desktop navigation
 */
const NavLink: React.FC<NavLinkProps> = ({
  to,
  icon,
  label,
  collapsed = false,
  onNavigate,
  isMobile = false
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isNavigating, setIsNavigating] = React.useState(false);
  
  const isActive = () => {
    return location.pathname === to || location.pathname.startsWith(`${to}/`);
  };

  const active = isActive();
  
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Prevent multiple navigation attempts
    if (isNavigating) return;
    
    // Set navigating state to prevent multiple clicks
    setIsNavigating(true);
    
    // Call the optional onNavigate callback (useful for closing mobile menu)
    if (onNavigate) {
      onNavigate();
    }
    
    // Navigate regardless of active state
    setTimeout(() => {
      navigate(to);
      
      // Reset navigation state after navigation completes
      setTimeout(() => {
        setIsNavigating(false);
      }, 300);
    }, 50);
  };
  
  return (
    <Button
      variant={active ? "secondary" : "ghost"}
      className="flex items-center gap-2 w-full justify-start transition-none"
      type="button"
      onClick={handleClick}
    >
      {icon}
      {/* Only show label when not collapsed or on mobile */}
      {(!collapsed || isMobile) && <span>{label}</span>}
    </Button>
  );
};

export default NavLink;
