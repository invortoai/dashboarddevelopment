
import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  return (
    <Select value={selectedStatus} onValueChange={onStatusChange}>
      <SelectTrigger className="w-[150px] h-10">
        <SelectValue placeholder="Status Filter" />
      </SelectTrigger>
      <SelectContent>
        {statusOptions.map((status) => (
          <SelectItem key={status} value={status}>
            {status === 'all' ? 'All Statuses' : 
              status.charAt(0).toUpperCase() + status.slice(1)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default StatusFilter;
