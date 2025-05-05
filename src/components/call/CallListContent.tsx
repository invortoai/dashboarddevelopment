
import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CallDetails } from '@/types';
import { useIsMobile } from '@/hooks/use-mobile';
import CallTable from './table/CallTable';
import EmptyState from './EmptyState';
import LoadingState from './LoadingState';

interface CallListContentProps {
  calls: CallDetails[];
  filteredCalls: CallDetails[];
  isLoading: boolean;
  totalCalls?: number;
}

const CallListContent: React.FC<CallListContentProps> = ({
  calls,
  filteredCalls,
  isLoading,
  totalCalls
}) => {
  const isMobile = useIsMobile();

  if (isLoading && calls.length === 0) {
    return <LoadingState />;
  }

  if (calls.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-4">
      {/* Display total count for mobile */}
      {isMobile && totalCalls !== undefined && (
        <div className="text-sm text-muted-foreground mb-2">
          Total records: {totalCalls}
        </div>
      )}
      
      {/* Table Implementation */}
      <div className="w-full">
        {isMobile ? (
          <div className="overflow-auto">
            <div className="min-w-[800px]">
              <CallTable calls={filteredCalls} />
            </div>
          </div>
        ) : (
          <ScrollArea className="w-full">
            <CallTable calls={filteredCalls} />
          </ScrollArea>
        )}
      </div>
    </div>
  );
};

export default CallListContent;
