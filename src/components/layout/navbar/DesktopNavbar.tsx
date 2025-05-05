
import React from 'react';
import { Button } from '@/components/ui/button';
import { BarChart2, User, History, ChevronLeft, ChevronRight } from 'lucide-react';
import Logo from '@/components/Logo';
import NavLink from './NavLink';

interface DesktopNavbarProps {
  handleLogout: (e: React.MouseEvent) => void;
}

const DesktopNavbar: React.FC<DesktopNavbarProps> = ({ handleLogout }) => {
  const [collapsed, setCollapsed] = React.useState(false);

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  return (
    <div 
      className={`bg-sidebar text-sidebar-foreground border-r border-border h-screen flex flex-col transition-width duration-200 ease-in-out ${
        collapsed ? 'w-16' : 'w-full md:w-64'
      }`}
      style={{ willChange: 'width' }}
    >
      <div className="flex items-center justify-center mb-8 p-4">
        {/* Conditionally render logo based on sidebar state */}
        {!collapsed && (
          <div className="flex justify-center items-center">
            <Logo text={true} />
          </div>
        )}
      </div>
      
      <div className="flex-1 flex flex-col space-y-2 px-2">
        <NavLink 
          to="/analytics" 
          icon={<BarChart2 size={20} />} 
          label="Analytics"
          collapsed={collapsed}
        />
        
        <NavLink 
          to="/history" 
          icon={<History size={20} />} 
          label="Call History"
          collapsed={collapsed}
        />
        
        <NavLink 
          to="/profile" 
          icon={<User size={20} />} 
          label="Profile"
          collapsed={collapsed}
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

export default DesktopNavbar;
