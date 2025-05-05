
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
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={`h-10 gap-1 ${isMobile ? 'flex-1 min-w-[110px]' : ''}`}
        >
          <Calendar className="h-4 w-4" />
          {selectedDate 
            ? isMobile 
              ? formatToIST(selectedDate).split(' ')[0].substring(0, 7) + "..." // Shortened for mobile
              : formatToIST(selectedDate).split(' ')[0] 
            : isMobile ? 'Date' : 'Date Filter'
          }
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align={isMobile ? "center" : "start"}>
        <DatePicker
          selected={selectedDate}
          onSelect={handleDateSelect}
          mode="single"
        />
      </PopoverContent>
    </Popover>
  );
};

export default DateFilter;
