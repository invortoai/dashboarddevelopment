
import React from 'react';
import { Check, PhoneOff, PhoneMissed, X } from 'lucide-react';
import { CallDetails } from '@/types';

interface CallStatusBadgeProps {
  call: CallDetails;
}

export const CallStatusBadge: React.FC<CallStatusBadgeProps> = ({ call }) => {
  // Get the raw status from the database
  const status = call.callStatus || 'pending';
  
  // Determine badge color and icon based on status text
  let bgColor: string = '';
  let textColor: string = '';
  let Icon: React.ElementType | null = null;
  
  // Normalized status for comparison
  const normalizedStatus = status.toLowerCase();
  
  if (normalizedStatus.includes('answered') || normalizedStatus.includes('complete') || normalizedStatus.includes('completed')) {
    // Green for answered calls
    bgColor = 'bg-green-500/20';
    textColor = 'text-green-600';
    Icon = Check;
  } else if (normalizedStatus.includes('busy') || normalizedStatus.includes('number busy')) {
    // Yellow for busy numbers
    bgColor = 'bg-yellow-500/20';
    textColor = 'text-yellow-600';
    Icon = PhoneOff;
  } else if (normalizedStatus.includes('not answered') || normalizedStatus.includes('no answer')) {
    // Orange for unanswered calls
    bgColor = 'bg-orange-500/20';
    textColor = 'text-orange-600';
    Icon = PhoneMissed;
  } else if (normalizedStatus.includes('error') || normalizedStatus.includes('fail')) {
    // Red for errors
    bgColor = 'bg-red-500/20';
    textColor = 'text-red-600';
    Icon = X;
  } else {
    // Gray default for other statuses
    bgColor = 'bg-gray-500/20';
    textColor = 'text-gray-500';
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${bgColor} ${textColor}`}>
      {Icon && <Icon size={14} />}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};
