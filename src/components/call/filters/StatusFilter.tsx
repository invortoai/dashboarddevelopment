
import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter } from 'lucide-react';
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
    <div className={isMobile ? "w-full" : "w-auto"}>
      <Select value={selectedStatus} onValueChange={onStatusChange}>
        <SelectTrigger className={`${isMobile ? "w-full" : "w-[160px]"} h-10 gap-2`}>
          <Filter className="h-4 w-4 text-muted-foreground" />
          <SelectValue placeholder="Status Filter" />
        </SelectTrigger>
        <SelectContent>
          {statusOptions.map((status) => (
            <SelectItem key={status} value={status} className="capitalize">
              {status === 'all' ? 'All Statuses' : status}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default StatusFilter;
