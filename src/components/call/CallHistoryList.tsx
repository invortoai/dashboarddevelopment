
import React from 'react';
import { CallDetails } from '@/types';
import { useIsMobile } from '@/hooks/use-mobile';
import FilterBar from './filters/FilterBar';
import CallPagination from './pagination/CallPagination';
import CallListContent from './CallListContent';
import CallInfiniteScroll from './CallInfiniteScroll';
import CallPaginationInfo from './CallPaginationInfo';
import { useCallFilters } from './filters/useCallFilters';

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
  
  // Use our custom hook for filtering logic
  const {
    searchTerm,
    setSearchTerm,
    selectedDate,
    setSelectedDate,
    selectedStatus,
    setSelectedStatus,
    statusOptions,
    filteredCalls,
    resetFilters,
    hasActiveFilters
  } = useCallFilters({ calls });
  
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
      
      {/* Main Content with Table */}
      <CallListContent 
        calls={calls}
        filteredCalls={filteredCalls}
        isLoading={isLoading}
        totalCalls={totalCalls}
      />
      
      {/* Pagination controls */}
      <CallPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
        isMobile={isMobile}
      />
      
      {/* Infinite scroll for mobile */}
      <CallInfiniteScroll 
        isLoading={isLoading}
        hasItems={calls.length > 0}
        onLoadMore={onLoadMore}
        isMobile={isMobile}
      />
      
      {/* Pagination info */}
      <CallPaginationInfo
        currentPage={currentPage}
        totalPages={totalPages}
        totalCalls={totalCalls}
        isMobile={isMobile}
      />
    </div>
  );
};

export default CallHistoryList;
