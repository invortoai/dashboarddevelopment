
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { formatTimeAgo } from '@/utils/dateUtils';

interface CallStatusProps {
  number: string;
  developer: string;
  status: 'initiating' | 'in-progress' | 'completed' | null;
  callLogId?: string;
  lastPolled?: Date | null;
  rawStatus?: string;
}

const CallStatus: React.FC<CallStatusProps> = ({ 
  number, 
  developer,
  status,
  callLogId,
  lastPolled,
  rawStatus
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  
  // Add timer for in-progress calls
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (status === 'in-progress' && !rawStatus?.toLowerCase().includes('error')) {
      // Start a timer that updates every second
      interval = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status, rawStatus]);
  
  // Format the timer as mm:ss
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!status) return null;

  const hasError = rawStatus?.toLowerCase().includes('error') || 
                  rawStatus?.toLowerCase().includes('busy') || 
                  rawStatus?.toLowerCase().includes('failed');
  
  return (
    <Card className="mt-4 bg-card border-2 border-purple">
      <CardContent className="p-6">
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Call Status</h3>
            {status === 'in-progress' && !hasError && (
              <span className="inline-flex items-center">
                <span className="w-2 h-2 rounded-full bg-purple mr-2 animate-pulse"></span>
                Live {elapsedSeconds > 0 && `- ${formatTime(elapsedSeconds)}`}
              </span>
            )}
            {hasError && (
              <span className="inline-flex items-center text-amber-500">
                <span className="w-2 h-2 rounded-full bg-amber-500 mr-2 animate-pulse"></span>
                Connection Issue
              </span>
            )}
          </div>

          <div className="p-4 border border-border rounded-md bg-muted">
            {status === 'initiating' && (
              <div className="flex items-center justify-center space-x-2">
                <div className="h-4 w-4 rounded-full border-2 border-t-transparent border-purple animate-spin"></div>
                <p>Initiating call...</p>
              </div>
            )}
            
            {status === 'in-progress' && !hasError && (
              <div>
                <p>
                  Call in progress with <span className="font-bold">{developer}</span> on{' '}
                  <span className="font-bold">{number}</span>. The status will be updated once the call is finished.
                </p>
                {callLogId && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Call Log ID: {callLogId}
                  </p>
                )}
                {lastPolled && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Last checked: {formatTimeAgo(lastPolled)}
                  </p>
                )}
              </div>
            )}
            
            {status === 'in-progress' && hasError && (
              <div>
                <p className="text-amber-500 font-medium mb-2">
                  Call connection issue detected
                </p>
                <p>
                  There was a problem connecting the call to <span className="font-bold">{developer}</span> on{' '}
                  <span className="font-bold">{number}</span>.
                </p>
                {rawStatus && (
                  <p className="text-xs text-muted-foreground mt-2 break-all">
                    Error: {rawStatus}
                  </p>
                )}
                <p className="text-sm mt-2">
                  Please try again in a few minutes or contact support if the issue persists.
                </p>
              </div>
            )}
            
            {status === 'completed' && (
              <div className="text-center">
                <p className="text-green-500 font-semibold mb-2">Call completed</p>
                <p className="text-sm">Call Log ID: {callLogId || 'Not available'}</p>
                <p className="text-sm mt-2">
                  Check the call history for details and recordings
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CallStatus;
