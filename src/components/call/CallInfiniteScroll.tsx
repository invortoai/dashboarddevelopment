
import React, { useEffect, useRef } from 'react';
import LoadingState from './LoadingState';

interface CallInfiniteScrollProps {
  isLoading: boolean;
  hasItems: boolean;
  onLoadMore?: () => void;
  isMobile: boolean;
}

const CallInfiniteScroll: React.FC<CallInfiniteScrollProps> = ({
  isLoading,
  hasItems,
  onLoadMore,
  isMobile
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  
  // Intersection observer for infinite scroll
  useEffect(() => {
    if (!isMobile || !onLoadMore) return;
    
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

  return (
    <>
      {/* Loading indicator for mobile infinite scroll */}
      {isMobile && isLoading && hasItems && <LoadingState initialLoad={false} />}
      
      {/* Observer element for infinite scroll */}
      <div ref={bottomRef} className="h-4" />
    </>
  );
};

export default CallInfiniteScroll;
