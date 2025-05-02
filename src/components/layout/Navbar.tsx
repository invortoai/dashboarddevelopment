
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import Logo from '../Logo';
import { Phone, BarChart2, User, History } from 'lucide-react';

const Navbar: React.FC = () => {
  const { logout } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const NavLink: React.FC<{ to: string; icon: React.ReactNode; label: string }> = ({ 
    to, 
    icon, 
    label 
  }) => (
    <Link to={to}>
      <Button
        variant={isActive(to) ? "secondary" : "ghost"}
        className="flex items-center gap-2 w-full justify-start"
      >
        {icon}
        <span className="hidden md:inline">{label}</span>
      </Button>
    </Link>
  );

  return (
    <div className="bg-card border-r border-border h-screen p-4 flex flex-col">
      <div className="flex items-center justify-center mb-8">
        <Link to="/analytics">
          <Logo />
        </Link>
        <span className="ml-3 text-xl font-bold">Invorto AI</span>
      </div>
      
      <div className="flex flex-col space-y-2">
        <NavLink 
          to="/dashboard" 
          icon={<Phone size={20} />} 
          label="Call Form" 
        />
        
        <NavLink 
          to="/history" 
          icon={<History size={20} />} 
          label="Call History" 
        />
        
        <NavLink 
          to="/analytics" 
          icon={<BarChart2 size={20} />} 
          label="Analytics" 
        />
        
        <NavLink 
          to="/profile" 
          icon={<User size={20} />} 
          label="Profile" 
        />
      </div>
      
      <div className="mt-auto">
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => logout()}
        >
          Logout
        </Button>
      </div>
    </div>
  );
};

export default Navbar;
