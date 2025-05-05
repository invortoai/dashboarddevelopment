
import React from 'react';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination';

interface CallPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isMobile: boolean;
}

const CallPagination: React.FC<CallPaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  isMobile
}) => {
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

export default CallPagination;
