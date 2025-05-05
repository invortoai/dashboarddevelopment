
import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
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
import { Check, PhoneOff, PhoneMissed, X } from 'lucide-react';

interface CallHistoryListProps {
  calls: CallDetails[];
  isLoading: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onLoadMore?: () => void;
}

const CallHistoryList: React.FC<CallHistoryListProps> = ({ 
  calls, 
  isLoading, 
  currentPage,
  totalPages,
  onPageChange,
  onLoadMore
}) => {
  const isMobile = useIsMobile();
  const bottomRef = useRef<HTMLDivElement>(null);
  
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
      <ScrollArea className="w-full">
        <div className="w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date & Time</TableHead>
                <TableHead>Developer</TableHead>
                <TableHead>Number</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {calls.map((call) => (
                <TableRow key={call.id} className="hover:bg-muted/50">
                  <TableCell>
                    {/* Use call.createdAt as the primary timestamp, with fallback to call.callTime */}
                    {call.createdAt ? formatToIST(call.createdAt) : 
                     call.callTime ? formatToIST(call.callTime) : '-'}
                  </TableCell>
                  <TableCell>{call.developer}</TableCell>
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
      </ScrollArea>
      
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
      
      {!isMobile && (
        <div className="text-center text-sm text-muted-foreground">
          Showing page {currentPage} of {totalPages} ({calls.length} calls)
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
