
import React from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import SearchFilter from './SearchFilter';
import DateFilter from './DateFilter';
import StatusFilter from './StatusFilter';
import { DateRange } from 'react-day-picker';

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
  return (
    <div className="flex flex-col sm:flex-row gap-3 justify-between mb-4">
      <SearchFilter searchTerm={searchTerm} onSearchChange={onSearchChange} />
      
      <div className="flex flex-wrap gap-2 items-center">
        <DateFilter selectedDate={selectedDate} onDateSelect={onDateSelect} />
        
        <StatusFilter 
          statusOptions={statusOptions} 
          selectedStatus={selectedStatus} 
          onStatusChange={onStatusChange}
        />
        
        {hasActiveFilters && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onResetFilters} 
            className="h-10 px-3 flex items-center gap-1 border-dashed"
          >
            <X className="h-4 w-4" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
};

export default FilterBar;
