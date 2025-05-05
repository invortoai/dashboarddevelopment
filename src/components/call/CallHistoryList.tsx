import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatPhoneNumber } from '@/utils/phoneUtils';
import { formatToIST } from '@/utils/dateUtils';
import { CallDetails } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination';
import { Check, PhoneOff, PhoneMissed, X, Search, Calendar } from 'lucide-react';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger 
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from '@/components/ui/date-picker';

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
  
  // Handle date selection with DateRange support
  const handleDateSelect = (date: Date | DateRange | undefined) => {
    // We're only interested in single date selection in this component
    if (date instanceof Date) {
      setSelectedDate(date);
    } else if (!date) {
      setSelectedDate(undefined);
    }
    // Ignore DateRange and other types as we don't use them here
  };
  
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

  if (isLoading && calls.length === 0) {
    return (
      <div className="flex justify-center p-8">
        <div className="h-8 w-8 rounded-full border-4 border-t-transparent border-purple animate-spin"></div>
      </div>
    );
  }

  if (calls.length === 0) {
    return (
      <div className="text-center p-8">
        <p>No call history found.</p>
        <Link to="/dashboard">
          <Button className="mt-4">Make a Call</Button>
        </Link>
      </div>
    );
  }

  const renderPagination = () => {
    // Don't show pagination if there's only 1 page or on mobile (where we use infinite scroll)
    if (totalPages <= 1 || isMobile) return null;
    
    return (
      <Pagination className="mt-4">
        <PaginationContent>
          {/* Previous button */}
          {currentPage > 1 ? (
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => onPageChange(currentPage - 1)} 
                className="cursor-pointer"
                aria-label="Go to previous page" 
              />
            </PaginationItem>
          ) : (
            <PaginationItem>
              <PaginationPrevious 
                className="opacity-50 cursor-not-allowed" 
                aria-disabled="true" 
                aria-label="No previous page available"
              />
            </PaginationItem>
          )}
          
          {/* Page numbers - only shown on desktop */}
          {!isMobile && Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            // Show pages around current page
            let pageNum: number;
            
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }
            
            return (
              <PaginationItem key={pageNum}>
                <PaginationLink
                  isActive={pageNum === currentPage}
                  onClick={() => onPageChange(pageNum)}
                  className="cursor-pointer"
                  aria-label={`Page ${pageNum}`}
                >
                  {pageNum}
                </PaginationLink>
              </PaginationItem>
            );
          })}
          
          {/* Next button */}
          {currentPage < totalPages ? (
            <PaginationItem>
              <PaginationNext 
                onClick={() => onPageChange(currentPage + 1)} 
                className="cursor-pointer"
                aria-label="Go to next page" 
              />
            </PaginationItem>
          ) : (
            <PaginationItem>
              <PaginationNext 
                className="opacity-50 cursor-not-allowed" 
                aria-disabled="true"
                aria-label="No next page available" 
              />
            </PaginationItem>
          )}
        </PaginationContent>
      </Pagination>
    );
  };

  return (
    <div className="space-y-4">
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-2 justify-between mb-4">
        <div className="relative w-full sm:w-1/3">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by number, developer or project..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-10 gap-1">
                <Calendar className="h-4 w-4" />
                {selectedDate ? formatToIST(selectedDate).split(' ')[0] : 'Date Filter'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <DatePicker
                selected={selectedDate}
                onSelect={handleDateSelect}
                mode="single"
              />
            </PopoverContent>
          </Popover>
          
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
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
          
          {(searchTerm || selectedDate || selectedStatus !== 'all') && (
            <Button variant="ghost" size="sm" onClick={resetFilters} className="h-10">
              Clear
            </Button>
          )}
        </div>
      </div>
      
      {/* Display total count for mobile */}
      {isMobile && totalCalls !== undefined && (
        <div className="text-sm text-muted-foreground mb-2">
          Total records: {totalCalls}
        </div>
      )}
      
      {/* Fix: Update the ScrollArea implementation for mobile view */}
      <div className="w-full">
        {isMobile ? (
          <div className="overflow-auto">
            <div className="min-w-[800px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Developer</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Number</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCalls.map((call) => (
                    <TableRow key={call.id} className="hover:bg-muted/50">
                      <TableCell>
                        {call.createdAt ? formatToIST(call.createdAt) : 
                         call.callTime ? formatToIST(call.callTime) : '-'}
                      </TableCell>
                      <TableCell>{call.developer}</TableCell>
                      <TableCell>{call.project}</TableCell>
                      <TableCell>{formatPhoneNumber(call.number)}</TableCell>
                      <TableCell>
                        {call.callDuration ? `${call.callDuration} seconds` : '-'}
                      </TableCell>
                      <TableCell>
                        <CallStatusBadge call={call} />
                      </TableCell>
                      <TableCell>
                        <Link to={`/history/${call.id}`}>
                          <Button variant="outline" size="sm">
                            Details
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : (
          <ScrollArea className="w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Developer</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Number</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCalls.map((call) => (
                  <TableRow key={call.id} className="hover:bg-muted/50">
                    <TableCell>
                      {call.createdAt ? formatToIST(call.createdAt) : 
                       call.callTime ? formatToIST(call.callTime) : '-'}
                    </TableCell>
                    <TableCell>{call.developer}</TableCell>
                    <TableCell>{call.project}</TableCell>
                    <TableCell>{formatPhoneNumber(call.number)}</TableCell>
                    <TableCell>
                      {call.callDuration ? `${call.callDuration} seconds` : '-'}
                    </TableCell>
                    <TableCell>
                      <CallStatusBadge call={call} />
                    </TableCell>
                    <TableCell>
                      <Link to={`/history/${call.id}`}>
                        <Button variant="outline" size="sm">
                          Details
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </div>
      
      {/* Pagination controls for desktop */}
      {renderPagination()}
      
      {/* Loading indicator for mobile infinite scroll */}
      {isMobile && isLoading && calls.length > 0 && (
        <div className="flex justify-center py-4">
          <div className="h-6 w-6 rounded-full border-2 border-t-transparent border-purple animate-spin"></div>
        </div>
      )}
      
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

const CallStatusBadge: React.FC<{ call: CallDetails }> = ({ call }) => {
  // Get the raw status from the database
  const status = call.callStatus || 'pending';
  
  // Determine badge color and icon based on status text
  let bgColor: string = '';
  let textColor: string = '';
  let Icon: React.ElementType | null = null;
  
  // Normalized status for comparison
  const normalizedStatus = status.toLowerCase();
  
  if (normalizedStatus.includes('answered') || normalizedStatus.includes('complete') || normalizedStatus.includes('completed')) {
    // Green for answered calls
    bgColor = 'bg-green-500/20';
    textColor = 'text-green-600';
    Icon = Check;
  } else if (normalizedStatus.includes('busy') || normalizedStatus.includes('number busy')) {
    // Yellow for busy numbers
    bgColor = 'bg-yellow-500/20';
    textColor = 'text-yellow-600';
    Icon = PhoneOff;
  } else if (normalizedStatus.includes('not answered') || normalizedStatus.includes('no answer')) {
    // Orange for unanswered calls
    bgColor = 'bg-orange-500/20';
    textColor = 'text-orange-600';
    Icon = PhoneMissed;
  } else if (normalizedStatus.includes('error') || normalizedStatus.includes('fail')) {
    // Red for errors
    bgColor = 'bg-red-500/20';
    textColor = 'text-red-600';
    Icon = X;
  } else {
    // Gray default for other statuses
    bgColor = 'bg-gray-500/20';
    textColor = 'text-gray-500';
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${bgColor} ${textColor}`}>
      {Icon && <Icon size={14} />}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

export default CallHistoryList;
