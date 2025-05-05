
import React from 'react';
import { Button } from '@/components/ui/button';
import SearchFilter from './SearchFilter';
import DateFilter from './DateFilter';
import StatusFilter from './StatusFilter';
import { useIsMobile } from '@/hooks/use-mobile';

interface FilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedDate: Date | undefined;
  onDateSelect: (date: Date | undefined) => void;
  statusOptions: string[];
  selectedStatus: string;
  onStatusChange: (value: string) => void;
  onResetFilters: () => void;
  hasActiveFilters: boolean;
}

const FilterBar: React.FC<FilterBarProps> = ({
  searchTerm,
  onSearchChange,
  selectedDate,
  onDateSelect,
  statusOptions,
  selectedStatus,
  onStatusChange,
  onResetFilters,
  hasActiveFilters
}) => {
  const isMobile = useIsMobile();

  return (
    <div className="flex flex-col sm:flex-row gap-2 justify-between mb-4">
      <SearchFilter searchTerm={searchTerm} onSearchChange={onSearchChange} />
      
      <div className={`flex ${isMobile ? 'flex-wrap' : ''} gap-2`}>
        <DateFilter selectedDate={selectedDate} onDateSelect={onDateSelect} />
        
        <StatusFilter 
          statusOptions={statusOptions} 
          selectedStatus={selectedStatus} 
          onStatusChange={onStatusChange}
        />
        
        {hasActiveFilters && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onResetFilters} 
            className={`h-10 ${isMobile ? 'w-auto' : ''}`}
          >
            Clear
          </Button>
        )}
      </div>
    </div>
  );
};

export default FilterBar;
