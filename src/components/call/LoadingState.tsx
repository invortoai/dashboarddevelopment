
import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  initialLoad?: boolean;
}

const LoadingState: React.FC<LoadingStateProps> = ({ initialLoad = true }) => {
  return (
    <div className={`flex flex-col items-center justify-center ${initialLoad ? 'p-12' : 'py-4'}`}>
      <Loader2 className={`${initialLoad ? 'h-10 w-10' : 'h-6 w-6'} text-primary animate-spin`} />
      <p className="text-sm text-muted-foreground mt-2">
        {initialLoad ? 'Loading call history...' : 'Loading more calls...'}
      </p>
    </div>
  );
};

export default LoadingState;
