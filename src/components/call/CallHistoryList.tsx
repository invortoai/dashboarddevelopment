
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { formatPhoneNumber } from '@/utils/phoneUtils';
import { formatToIST } from '@/utils/dateUtils';
import { CallDetails } from '@/types';
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
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination';

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
    // Don't show pagination if there's only 1 page
    if (totalPages <= 1) return null;
    
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
          
          {/* Page numbers */}
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            // Show pages around current page
            let pageNum: number;
            
            if (totalPages <= 5) {
              // If 5 or fewer pages, show all page numbers
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              // If near the start, show first 5 pages
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              // If near the end, show last 5 pages
              pageNum = totalPages - 4 + i;
            } else {
              // Show 2 pages before and after current page
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
          
          {/* Show ellipsis if needed */}
          {totalPages > 5 && currentPage < totalPages - 2 && (
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          )}
          
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
      <div className="overflow-x-auto">
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
                <TableCell>{formatToIST(call.createdAt)}</TableCell>
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
      
      {/* Pagination controls */}
      {renderPagination()}
      
      <div className="text-center text-sm text-muted-foreground">
        Showing page {currentPage} of {totalPages} ({calls.length} calls)
      </div>
    </div>
  );
};

const CallStatusBadge: React.FC<{ call: CallDetails }> = ({ call }) => {
  // Determine call status based on data presence and callStatus field
  const hasCompletionIndicators = 
    (call.callDuration && call.callDuration > 0) || 
    !!call.transcript || 
    !!call.callRecording || 
    !!call.summary;
  
  const hasError = call.callStatus?.toLowerCase().includes('error');
  const isInProgress = call.callStatus?.toLowerCase().includes('in-progress');
  const isInitiated = call.callAttempted && call.callLogId;
  
  let status: string;
  let bgColor: string = '';
  let textColor: string = '';
  
  if (hasCompletionIndicators) {
    status = 'completed';
    bgColor = 'bg-green-500/20';
    textColor = 'text-green-500';
  } else if (hasError) {
    status = 'failed';
    bgColor = 'bg-red-500/20';
    textColor = 'text-red-500';
  } else if (isInProgress) {
    status = 'in-progress';
    bgColor = 'bg-blue-500/20';
    textColor = 'text-blue-500';
  } else if (isInitiated) {
    status = 'initiated';
    bgColor = 'bg-yellow-500/20';
    textColor = 'text-yellow-500';
  } else if (call.callStatus) {
    // If there's a callStatus but none of the above conditions are met
    status = call.callStatus.toLowerCase();
    bgColor = 'bg-purple-500/20';
    textColor = 'text-purple-500';
  } else {
    status = 'pending';
    bgColor = 'bg-gray-500/20';
    textColor = 'text-gray-500';
  }

  return (
    <span className={`inline-block px-2 py-1 rounded text-xs ${bgColor} ${textColor}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

export default CallHistoryList;
