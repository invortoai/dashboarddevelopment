
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { BarChart2, User, History, ChevronLeft, ChevronRight, Menu } from 'lucide-react';
import Logo from '@/components/Logo';

const Navbar: React.FC = () => {
  const { logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [isNavigating, setIsNavigating] = React.useState(false);

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  const handleLogout = () => {
    if (isMobile) {
      setMobileOpen(false);
    }
    logout();
  };

  // Conditionally render logo based on sidebar state
  const NavIcon: React.FC = () => {
    if (collapsed) return null; // Don't show anything when collapsed
    
    return (
      <div className="flex justify-center items-center">
        <Logo text={true} />
      </div>
    );
  };

  // Custom NavLink component that uses navigate for programmatic navigation
  const NavLink: React.FC<{ to: string; icon: React.ReactNode; label: string }> = ({ 
    to, 
    icon, 
    label 
  }) => {
    const active = isActive(to);
    
    const handleClick = (e: React.MouseEvent) => {
      e.preventDefault(); // Prevent default behavior
      
      // Prevent multiple navigation attempts
      if (isNavigating) return;
      
      setIsNavigating(true);
      
      if (isMobile) {
        setMobileOpen(false);
      }
      
      // Navigate only if we're not already on this route
      if (!active) {
        navigate(to);
      }
      
      // Reset navigation state after a short delay
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

  // Render mobile sidebar using Sheet component
  if (isMobile) {
    return (
      <>
        <div className="fixed top-0 left-0 right-0 h-14 bg-sidebar border-b border-border flex items-center px-4 z-20">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={24} />
          </Button>
          <div className="flex-1 flex justify-center">
            <NavIcon />
          </div>
        </div>
        
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="p-0 bg-sidebar w-[250px] max-w-[80vw]">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-center p-4 border-b border-border">
                <NavIcon />
              </div>
              
              <div className="flex-1 flex flex-col space-y-2 p-4">
                <NavLink 
                  to="/analytics" 
                  icon={<BarChart2 size={20} />} 
                  label="Analytics" 
                />
                
                <NavLink 
                  to="/history" 
                  icon={<History size={20} />} 
                  label="Call History" 
                />
                
                <NavLink 
                  to="/profile" 
                  icon={<User size={20} />} 
                  label="Profile" 
                />
              </div>
              
              <div className="p-4 border-t border-border">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
        
        {/* Add top margin to content */}
        <div className="h-14"></div>
      </>
    );
  }

  // Desktop sidebar
  return (
    <div 
      className={`bg-sidebar text-sidebar-foreground border-r border-border h-screen flex flex-col transition-width duration-200 ease-in-out ${
        collapsed ? 'w-16' : 'w-full md:w-64'
      }`}
      style={{ willChange: 'width' }}
    >
      <div className="flex items-center justify-center mb-8 p-4">
        <NavIcon />
      </div>
      
      <div className="flex-1 flex flex-col space-y-2 px-2">
        <NavLink 
          to="/analytics" 
          icon={<BarChart2 size={20} />} 
          label="Analytics" 
        />
        
        <NavLink 
          to="/history" 
          icon={<History size={20} />} 
          label="Call History" 
        />
        
        <NavLink 
          to="/profile" 
          icon={<User size={20} />} 
          label="Profile" 
        />
      </div>

      <div className="p-4">
        <Button 
          variant="outline" 
          className={`w-full ${collapsed ? 'justify-center' : ''}`}
          onClick={handleLogout}
          type="button"
        >
          {collapsed ? 'Out' : 'Logout'}
        </Button>
      </div>

      {/* Collapse toggle button for desktop */}
      <div className="hidden md:flex justify-center p-2 border-t border-border">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="h-8 w-8"
          type="button"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </Button>
      </div>
    </div>
  );
};

export default Navbar;
