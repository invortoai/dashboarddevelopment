
import { useEffect, useState } from 'react';
import { CallDetails } from '@/types';

interface UseCallFiltersProps {
  calls: CallDetails[];
}

export const useCallFilters = ({ calls }: UseCallFiltersProps) => {
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
  
  // Reset filters
  const resetFilters = () => {
    setSearchTerm('');
    setSelectedDate(undefined);
    setSelectedStatus('all');
  };

  // Determine if there are any active filters
  const hasActiveFilters = searchTerm !== '' || selectedDate !== undefined || selectedStatus !== 'all';

  return {
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
  };
};
