
import React from 'react';
import { Calendar } from 'lucide-react';
import { formatToIST } from '@/utils/dateUtils';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { DateRange } from 'react-day-picker';
import { useIsMobile } from '@/hooks/use-mobile';

interface DateFilterProps {
  selectedDate: Date | undefined;
  onDateSelect: (date: Date | undefined) => void;
}

const DateFilter: React.FC<DateFilterProps> = ({ 
  selectedDate, 
  onDateSelect 
}) => {
  const isMobile = useIsMobile();
  
  // Handle date selection with DateRange support
  const handleDateSelect = (date: Date | DateRange | undefined) => {
    // We're only interested in single date selection in this component
    if (date instanceof Date) {
      onDateSelect(date);
    } else if (!date) {
      onDateSelect(undefined);
    }
    // Ignore DateRange and other types as we don't use them here
  };

  return (
    <div className={isMobile ? "w-full" : "w-auto"}>
      <DatePicker
        selected={selectedDate}
        onSelect={handleDateSelect}
        mode="single"
      />
    </div>
  );
};

export default DateFilter;
