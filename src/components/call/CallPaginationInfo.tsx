
import React from 'react';

interface CallPaginationInfoProps {
  currentPage: number;
  totalPages: number;
  totalCalls?: number;
  isMobile: boolean;
}

const CallPaginationInfo: React.FC<CallPaginationInfoProps> = ({
  currentPage,
  totalPages,
  totalCalls,
  isMobile
}) => {
  if (isMobile || totalCalls === undefined) {
    return null;
  }

  return (
    <div className="text-center text-sm text-muted-foreground">
      Showing page {currentPage} of {totalPages} ({totalCalls} total records)
    </div>
  );
};

export default CallPaginationInfo;
