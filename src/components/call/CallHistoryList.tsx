
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { formatPhoneNumber } from '@/utils/phoneUtils';
import { formatToIST } from '@/utils/dateUtils';
import { CallDetails } from '@/types';

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
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-border">
            <th className="p-3">Date & Time</th>
            <th className="p-3">Developer</th>
            <th className="p-3">Number</th>
            <th className="p-3">Duration</th>
            <th className="p-3">Status</th>
            <th className="p-3">Action</th>
          </tr>
        </thead>
        <tbody>
          {calls.map((call) => (
            <tr key={call.id} className="border-b border-border hover:bg-muted/50">
              <td className="p-3">{formatToIST(call.createdAt)}</td>
              <td className="p-3">{call.developer}</td>
              <td className="p-3">{formatPhoneNumber(call.number)}</td>
              <td className="p-3">
                {call.callDuration ? `${call.callDuration} seconds` : '-'}
              </td>
              <td className="p-3">
                <CallStatusBadge status={getCallStatus(call)} />
              </td>
              <td className="p-3">
                <Link to={`/history/${call.id}`}>
                  <Button variant="outline" size="sm">
                    Details
                  </Button>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const getCallStatus = (call: CallDetails): 'completed' | 'in-progress' | 'initiated' | 'failed' => {
  if (call.callDuration) return 'completed';
  if (call.callStatus === 'yes') return 'in-progress';
  if (call.callAttempted) return call.callLogId ? 'initiated' : 'failed';
  return 'initiated';
};

const CallStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  let bgColor = '';
  let textColor = '';
  
  switch (status) {
    case 'completed':
      bgColor = 'bg-green-500/20';
      textColor = 'text-green-500';
      break;
    case 'in-progress':
      bgColor = 'bg-blue-500/20';
      textColor = 'text-blue-500';
      break;
    case 'initiated':
      bgColor = 'bg-yellow-500/20';
      textColor = 'text-yellow-500';
      break;
    case 'failed':
      bgColor = 'bg-red-500/20';
      textColor = 'text-red-500';
      break;
    default:
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
