
import React from 'react';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination';

interface CallHistoryPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const CallHistoryPagination: React.FC<CallHistoryPaginationProps> = ({ 
  currentPage, 
  totalPages, 
  onPageChange 
}) => {
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

export default CallHistoryPagination;
