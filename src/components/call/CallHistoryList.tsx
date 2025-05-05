
import React, { useEffect, useRef, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CallDetails } from '@/types';
import { useIsMobile } from '@/hooks/use-mobile';
import FilterBar from './filters/FilterBar';
import CallTable from './table/CallTable';
import CallPagination from './pagination/CallPagination';
import EmptyState from './EmptyState';
import LoadingState from './LoadingState';

interface CallHistoryListProps {
  calls: CallDetails[];
  isLoading: boolean;
  currentPage: number;
  totalPages: number;
  totalCalls?: number;
  onPageChange: (page: number) => void;
  onLoadMore?: () => void;
}

const CallHistoryList: React.FC<CallHistoryListProps> = ({ 
  calls, 
  isLoading, 
  currentPage,
  totalPages,
  totalCalls,
  onPageChange,
  onLoadMore
}) => {
  const isMobile = useIsMobile();
  const bottomRef = useRef<HTMLDivElement>(null);
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  
  // State for available status options
  const [statusOptions, setStatusOptions] = useState<string[]>(['all']);
  
  // Filtered calls
  const [filteredCalls, setFilteredCalls] = useState<CallDetails[]>(calls);
  
  // Extract unique status options from calls
  useEffect(() => {
    if (calls.length > 0) {
      const uniqueStatuses = new Set<string>();
      uniqueStatuses.add('all'); // Always include 'all' option
      
      calls.forEach(call => {
        if (call.callStatus) {
          // Extract the basic status type for better categorization
          let normalizedStatus = call.callStatus.toLowerCase();
          
          if (normalizedStatus.includes('answer') && !normalizedStatus.includes('no')) {
            uniqueStatuses.add('answered');
          } else if (normalizedStatus.includes('complete')) {
            uniqueStatuses.add('completed');
          } else if (normalizedStatus.includes('no answer') || normalizedStatus.includes('not answered')) {
            uniqueStatuses.add('no answer');
          } else if (normalizedStatus.includes('busy')) {
            uniqueStatuses.add('busy');
          } else if (normalizedStatus.includes('fail') || normalizedStatus.includes('error')) {
            uniqueStatuses.add('failed');
          } else if (normalizedStatus) {
            // Add any other unique status that doesn't match our predefined categories
            uniqueStatuses.add(normalizedStatus);
          }
        }
      });
      
      setStatusOptions(Array.from(uniqueStatuses));
    }
  }, [calls]);
  
  // Update filtered calls when filters change
  useEffect(() => {
    let result = [...calls];
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(call => 
        call.number.toLowerCase().includes(term) || 
        call.developer?.toLowerCase().includes(term) ||
        call.project?.toLowerCase().includes(term)
      );
    }
    
    // Apply date filter
    if (selectedDate) {
      const dateString = selectedDate.toDateString();
      result = result.filter(call => {
        const callDate = call.createdAt 
          ? new Date(call.createdAt).toDateString() 
          : call.callTime 
            ? new Date(call.callTime).toDateString() 
            : '';
        return callDate === dateString;
      });
    }
    
    // Apply status filter
    if (selectedStatus && selectedStatus !== 'all') {
      result = result.filter(call => {
        const status = (call.callStatus || '').toLowerCase();
        return status.includes(selectedStatus.toLowerCase());
      });
    }
    
    setFilteredCalls(result);
  }, [calls, searchTerm, selectedDate, selectedStatus]);
  
  // Intersection observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && isMobile && onLoadMore && !isLoading) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );
    
    if (bottomRef.current) {
      observer.observe(bottomRef.current);
    }
    
    return () => {
      if (bottomRef.current) {
        observer.unobserve(bottomRef.current);
      }
    };
  }, [onLoadMore, isLoading, isMobile]);
  
  // Reset filters
  const resetFilters = () => {
    setSearchTerm('');
    setSelectedDate(undefined);
    setSelectedStatus('all');
  };

  // Determine if there are any active filters
  const hasActiveFilters = searchTerm !== '' || selectedDate !== undefined || selectedStatus !== 'all';

  if (isLoading && calls.length === 0) {
    return <LoadingState />;
  }

  if (calls.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter Controls */}
      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedDate={selectedDate}
        onDateSelect={setSelectedDate}
        statusOptions={statusOptions}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        onResetFilters={resetFilters}
        hasActiveFilters={hasActiveFilters}
      />
      
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
      
      {/* Pagination controls */}
      <CallPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
        isMobile={isMobile}
      />
      
      {/* Loading indicator for mobile infinite scroll */}
      {isMobile && isLoading && calls.length > 0 && <LoadingState initialLoad={false} />}
      
      {/* Observer element for infinite scroll */}
      <div ref={bottomRef} className="h-4" />
      
      {!isMobile && totalCalls !== undefined && (
        <div className="text-center text-sm text-muted-foreground">
          Showing page {currentPage} of {totalPages} ({totalCalls} total records)
        </div>
      )}
    </div>
  );
};

export default CallHistoryList;
