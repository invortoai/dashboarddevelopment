
import React from 'react';
import { CallDetails } from '@/types';
import CallHistoryTable from './CallHistoryTable';
import CallHistoryPagination from './CallHistoryPagination';
import CallHistoryEmptyState from './CallHistoryEmptyState';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CallHistoryListProps {
  calls: CallDetails[];
  isLoading: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const CallHistoryList: React.FC<CallHistoryListProps> = ({ 
  calls, 
  isLoading, 
  currentPage,
  totalPages,
  onPageChange 
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="h-8 w-8 rounded-full border-4 border-t-transparent border-purple animate-spin"></div>
      </div>
    );
  }

  if (calls.length === 0) {
    return <CallHistoryEmptyState />;
  }

  return (
    <div className="space-y-4">
      <ScrollArea className="h-full w-full">
        <CallHistoryTable calls={calls} />
      </ScrollArea>
      
      <div className="pt-2">
        {/* Pagination controls */}
        <CallHistoryPagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
        
        <div className="text-center text-sm text-muted-foreground mt-2">
          Showing page {currentPage} of {totalPages} ({calls.length} calls)
        </div>
      </div>
    </div>
  );
};

export default CallHistoryList;
