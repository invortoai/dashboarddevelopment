
import React from 'react';
import { Check, PhoneOff, PhoneMissed, X, AlertCircle } from 'lucide-react';
import { CallDetails } from '@/types';
import { cn } from '@/lib/utils';

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
    textColor = 'text-green-500';
    Icon = Check;
  } else if (normalizedStatus.includes('busy') || normalizedStatus.includes('number busy')) {
    // Yellow for busy numbers
    bgColor = 'bg-yellow-500/20';
    textColor = 'text-yellow-500';
    Icon = PhoneOff;
  } else if (normalizedStatus.includes('not answered') || normalizedStatus.includes('no answer')) {
    // Orange for unanswered calls
    bgColor = 'bg-orange-500/20';
    textColor = 'text-orange-500';
    Icon = PhoneMissed;
  } else if (normalizedStatus.includes('error') || normalizedStatus.includes('fail')) {
    // Red for errors
    bgColor = 'bg-red-500/20';
    textColor = 'text-red-500';
    Icon = X;
  } else {
    // Gray default for other statuses
    bgColor = 'bg-gray-500/20';
    textColor = 'text-gray-500';
    Icon = AlertCircle;
  }

  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
      bgColor,
      textColor
    )}>
      {Icon && <Icon size={12} strokeWidth={2.5} />}
      <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
    </span>
  );
};
