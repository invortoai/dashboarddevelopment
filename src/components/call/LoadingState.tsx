
import React from 'react';

interface LoadingStateProps {
  initialLoad?: boolean;
}

const LoadingState: React.FC<LoadingStateProps> = ({ initialLoad = true }) => {
  return (
    <div className={`flex justify-center ${initialLoad ? 'p-8' : 'py-4'}`}>
      <div className={`${initialLoad ? 'h-8 w-8' : 'h-6 w-6'} rounded-full border-4 border-t-transparent border-purple animate-spin`}></div>
    </div>
  );
};

export default LoadingState;
