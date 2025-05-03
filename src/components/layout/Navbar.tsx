
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import Logo from '../Logo';
import { BarChart2, User, History, ChevronLeft, ChevronRight } from 'lucide-react';

const Navbar: React.FC = () => {
  const { logout } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = React.useState(false);

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  const NavLink: React.FC<{ to: string; icon: React.ReactNode; label: string }> = ({ 
    to, 
    icon, 
    label 
  }) => (
    <Link to={to} className="block w-full">
      <Button
        variant={isActive(to) ? "secondary" : "ghost"}
        className="flex items-center gap-2 w-full justify-start"
        onClick={(e) => e.stopPropagation()}
      >
        {icon}
        <span className={`${collapsed ? 'hidden' : 'hidden md:inline'}`}>{label}</span>
      </Button>
    </Link>
  );

  return (
    <div 
      className={`bg-card border-r border-border h-screen flex flex-col transition-all duration-200 ${
        collapsed ? 'w-16' : 'w-full md:w-64'
      }`}
    >
      <div className="flex items-center justify-between mb-8 p-4">
        <Link to="/analytics" className={`flex items-center ${collapsed ? 'justify-center' : ''}`}>
          <Logo className={collapsed ? 'h-8 w-8' : 'h-8'} />
          {!collapsed && <span className="ml-3 text-xl font-bold">INVORTO AI</span>}
        </Link>
        <Button 
          variant="ghost" 
          size="icon"
          className="flex md:hidden"
          onClick={(e) => {
            e.stopPropagation();
            toggleSidebar();
          }}
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </Button>
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
          className={`w-full ${collapsed ? 'p-2' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            logout();
          }}
        >
          {collapsed ? 'Out' : 'Logout'}
        </Button>
      </div>

      {/* Collapse toggle button for desktop */}
      <div className="hidden md:flex justify-center p-2 border-t border-border">
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            toggleSidebar();
          }}
          className="h-8 w-8"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </Button>
      </div>
    </div>
  );
};

export default Navbar;
