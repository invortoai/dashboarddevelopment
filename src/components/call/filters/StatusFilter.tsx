
import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useIsMobile } from '@/hooks/use-mobile';

interface StatusFilterProps {
  statusOptions: string[];
  selectedStatus: string;
  onStatusChange: (value: string) => void;
}

const StatusFilter: React.FC<StatusFilterProps> = ({
  statusOptions,
  selectedStatus,
  onStatusChange
}) => {
  const isMobile = useIsMobile();
  
  return (
    <Select value={selectedStatus} onValueChange={onStatusChange}>
      <SelectTrigger className={`h-10 ${isMobile ? 'flex-1 min-w-[110px]' : 'w-[150px]'}`}>
        <SelectValue placeholder={isMobile ? 'Status' : 'Status Filter'} />
      </SelectTrigger>
      <SelectContent>
        {statusOptions.map((status) => (
          <SelectItem key={status} value={status}>
            {status === 'all' ? (isMobile ? 'All' : 'All Statuses') : 
              status.charAt(0).toUpperCase() + status.slice(1)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default StatusFilter;
