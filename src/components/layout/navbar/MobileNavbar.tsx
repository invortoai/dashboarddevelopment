
import React from 'react';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu, X, BarChart2, History, User } from 'lucide-react';
import Logo from '@/components/Logo';
import NavLink from './NavLink';
import { useAuth } from '@/context/AuthContext';

interface MobileNavbarProps {
  handleLogout: (e: React.MouseEvent) => void;
}

const MobileNavbar: React.FC<MobileNavbarProps> = ({ handleLogout }) => {
  const [sheetOpen, setSheetOpen] = React.useState(false);

  // Function to close sheet when navigating
  const handleClose = () => {
    setSheetOpen(false);
  };

  return (
    <>
      <div className="fixed top-0 left-0 right-0 h-16 bg-sidebar border-b border-border flex items-center px-4 z-40">
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon"
              className="focus:outline-none"
              aria-label="Open menu"
            >
              <Menu size={24} />
            </Button>
          </SheetTrigger>
          <SheetContent 
            side="left" 
            className="p-0 bg-sidebar w-[250px] max-w-[80vw] overflow-auto z-[100]"
          >
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex justify-center items-center">
                  <Logo text={true} />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  aria-label="Close menu"
                  onClick={handleClose}
                >
                  <X size={18} />
                </Button>
              </div>
              
              <div className="flex-1 flex flex-col space-y-2 p-4">
                <NavLink 
                  to="/analytics" 
                  icon={<BarChart2 size={20} />} 
                  label="Analytics" 
                  onNavigate={handleClose}
                  isMobile={true}
                />
                
                <NavLink 
                  to="/history" 
                  icon={<History size={20} />} 
                  label="Call History" 
                  onNavigate={handleClose}
                  isMobile={true}
                />
                
                <NavLink 
                  to="/profile" 
                  icon={<User size={20} />} 
                  label="Profile" 
                  onNavigate={handleClose}
                  isMobile={true}
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
        
        <div className="flex-1 flex justify-center">
          <Logo text={true} />
        </div>
      </div>
      
      {/* Add top margin to content */}
      <div className="h-16"></div>
    </>
  );
};

export default MobileNavbar;
