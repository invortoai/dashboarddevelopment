
import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useIsMobile } from '@/hooks/use-mobile';

interface SearchFilterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

const SearchFilter: React.FC<SearchFilterProps> = ({ 
  searchTerm, 
  onSearchChange 
}) => {
  const isMobile = useIsMobile();
  
  return (
    <div className={`relative ${isMobile ? 'w-full' : 'w-[300px]'} max-w-full`}>
      <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search by number or developer..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="pl-9 h-10"
      />
    </div>
  );
};

export default SearchFilter;
