
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { formatTimeAgo } from '@/utils/dateUtils';

interface CallStatusProps {
  number: string;
  developer: string;
  status: 'initiating' | 'in-progress' | 'completed' | null;
  callLogId?: string;
  lastPolled?: Date | null;
}

const CallStatus: React.FC<CallStatusProps> = ({ 
  number, 
  developer,
  status,
  callLogId,
  lastPolled
}) => {
  if (!status) return null;

  return (
    <Card className="mt-4 bg-card border-2 border-purple">
      <CardContent className="p-6">
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Call Status</h3>
            {status === 'in-progress' && (
              <span className="inline-flex items-center">
                <span className="w-2 h-2 rounded-full bg-purple mr-2 animate-pulse"></span>
                Live
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
            
            {status === 'in-progress' && (
              <div>
                <p>
                  Call in progress with <span className="font-bold">{developer}</span> on{' '}
                  <span className="font-bold">{number}</span>. The status will be updated once the call is finished.
                </p>
                {lastPolled && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Last checked: {formatTimeAgo(lastPolled)}
                  </p>
                )}
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
