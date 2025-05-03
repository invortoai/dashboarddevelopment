
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

interface CallHistoryListProps {
  calls: CallDetails[];
  isLoading: boolean;
}

const CallHistoryList: React.FC<CallHistoryListProps> = ({ calls, isLoading }) => {
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

  return (
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
  );
};

const CallStatusBadge: React.FC<{ call: CallDetails }> = ({ call }) => {
  // Determine call status based on data presence and callStatus field
  const hasCompletionIndicators = 
    (call.callDuration && call.callDuration > 0) || 
    !!call.transcript || 
    !!call.callRecording || 
    !!call.summary;
  
  const hasError = call.callStatus?.includes('error');
  
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
  } else if (call.callStatus?.includes('in-progress')) {
    status = 'in-progress';
    bgColor = 'bg-blue-500/20';
    textColor = 'text-blue-500';
  } else if (call.callAttempted && call.callLogId) {
    status = 'initiated';
    bgColor = 'bg-yellow-500/20';
    textColor = 'text-yellow-500';
  } else {
    status = 'unknown';
    bgColor = 'bg-gray-500/20';
    textColor = 'text-gray-500';
  }

  return (
    <span className={`inline-block px-2 py-1 rounded text-xs ${bgColor} ${textColor}`}>
      {hasError ? 'Failed' : status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

export default CallHistoryList;
