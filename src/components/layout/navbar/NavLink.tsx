
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();
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
    
    // Debug
    console.log('NavLink clicked:', to, 'Current path:', location.pathname);
    
    // Call the optional onNavigate callback (useful for closing mobile menu)
    if (onNavigate) {
      onNavigate();
    }
    
    // Navigate regardless of active state - fix for navigation from profile page
    setTimeout(() => {
      // Use navigate instead of location.pathname direct comparison
      navigate(to);
      
      // Show toast notification on mobile
      if (isMobile) {
        toast({
          title: "Navigating",
          description: `Going to ${label}`,
          duration: 2000
        });
      }
      
      console.log('Navigation executed to:', to);
    }, 100);
    
    // Reset navigation state after navigation completes
    setTimeout(() => {
      setIsNavigating(false);
    }, 500);
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
