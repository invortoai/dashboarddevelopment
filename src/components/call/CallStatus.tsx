import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatTimeAgo, formatToIST } from '@/utils/dateUtils';
import { Check, PhoneOff, PhoneMissed, X, AlertCircle, RefreshCw, MessageSquare } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface CallStatusProps {
  number: string;
  developer: string;
  status: 'initiating' | 'in-progress' | 'completed' | null;
  callLogId?: string;
  lastPolled?: Date | null;
  rawStatus?: string;
  callResult?: {
    callDuration?: number;
    creditsConsumed?: number;
    callTime?: string;
    summary?: string;
    transcript?: string;
    createdAt?: string;
  };
  onFeedbackSubmit?: (feedback: string) => Promise<void>;
  onViewDetails?: () => void;
  onClose?: () => void;
  isPopup?: boolean; // New prop to determine if it should render as a popup
}

const CallStatus: React.FC<CallStatusProps> = ({ 
  number, 
  developer,
  status,
  callLogId,
  lastPolled,
  rawStatus,
  callResult,
  onFeedbackSubmit,
  onViewDetails,
  onClose,
  isPopup = true // Default to popup mode for backward compatibility
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showRefreshButton, setShowRefreshButton] = useState<boolean>(false);
  const [showCloseButton, setShowCloseButton] = useState<boolean>(false);
  const { toast } = useToast();
  
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
    
    // Timer for showing refresh button after 30 seconds
    let refreshTimer: NodeJS.Timeout;
    if (status === 'initiating' || status === 'in-progress') {
      refreshTimer = setTimeout(() => {
        setShowRefreshButton(true);
      }, 30000); // 30 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
      if (refreshTimer) clearTimeout(refreshTimer);
    };
  }, [status, rawStatus]);

  // Show feedback toast when call is successful
  useEffect(() => {
    const isSuccessful = status === 'completed' && !hasError && 
                       (rawStatus?.toLowerCase().includes('answered') || 
                        rawStatus?.toLowerCase().includes('complete'));
    
    if (isSuccessful && isPopup) {
      toast({
        title: "Call Completed Successfully",
        description: "Please share your feedback about the call. Your input helps us improve!",
        variant: "default",
      });
      
      // Also show close button for successful calls when feedback form appears
      setShowCloseButton(true);
    }
  }, [status, rawStatus, isPopup, toast]);
  
  // Format the timer as mm:ss
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim() || !onFeedbackSubmit) return;
    
    setIsSubmitting(true);
    try {
      await onFeedbackSubmit(feedback);
      setFeedback('');
      toast({
        title: "Thank you!",
        description: "Your feedback has been submitted successfully.",
        variant: "default",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!status) return null;

  const hasError = rawStatus?.toLowerCase().includes('error') || 
                  rawStatus?.toLowerCase().includes('busy') || 
                  rawStatus?.toLowerCase().includes('failed');

  const isSuccessful = status === 'completed' && 
                     !hasError && 
                     (rawStatus?.toLowerCase().includes('answered') || 
                      rawStatus?.toLowerCase().includes('complete'));
  
  // Only render as a popup if isPopup is true
  if (isPopup) {
    return (
      <div className="fixed inset-0 bg-background/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className="w-full max-w-2xl">
          <Card className="bg-card border-2 border-purple relative">
            {/* Only show close button for error states or when feedback form is active */}
            {((hasError || showCloseButton) && onClose) && (
              <button 
                onClick={onClose} 
                className="absolute -right-2 -top-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors z-10"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            )}
            <CardContent className="p-6">
              <div className="flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold">Call Status</h3>
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
                  {isSuccessful && (
                    <span className="inline-flex items-center text-green-600">
                      <span className="w-2 h-2 rounded-full bg-green-600 mr-2 animate-pulse"></span>
                      Connection Successful
                    </span>
                  )}
                </div>

                {/* Call Log ID */}
                {callLogId && (
                  <div className="text-center p-2 bg-muted/50 rounded-md border border-border">
                    <p className="text-sm font-medium">Call Log ID: {callLogId}</p>
                  </div>
                )}

                <div className="p-4 border border-border rounded-md bg-muted">
                  {status === 'initiating' && (
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="flex items-center space-x-2">
                        <div className="h-4 w-4 rounded-full border-2 border-t-transparent border-purple animate-spin"></div>
                        <p>Initiating call...</p>
                      </div>

                      {showRefreshButton && (
                        <div className="w-full mt-4">
                          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
                            <div className="flex">
                              <div className="flex-shrink-0">
                                <AlertCircle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                              </div>
                              <div className="ml-3">
                                <h3 className="text-sm font-medium text-yellow-800">Wait for call completion</h3>
                                <div className="mt-2 text-sm text-yellow-700">
                                  <p>After your call has completed, <span className="font-bold text-yellow-900">please wait for 30 seconds</span> and then click the button below to check its status</p>
                                </div>
                                <div className="mt-4">
                                  <Button 
                                    variant="outline" 
                                    className="bg-white hover:bg-yellow-50 border-yellow-300 text-yellow-800"
                                    onClick={handleRefreshCheck}
                                  >
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Check Status
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {status === 'in-progress' && !hasError && (
                    <div>
                      <p>
                        Call in progress with <span className="font-bold">{developer}</span> on{' '}
                        <span className="font-bold">{number}</span>. The status will be updated once the call is finished.
                      </p>
                      <p className="mt-2 font-medium text-purple-700">
                        Within 30 seconds, system will let you refresh the status to get the call response, use it properly.
                      </p>

                      {showRefreshButton && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mt-4">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <AlertCircle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                            </div>
                            <div className="ml-3">
                              <h3 className="text-sm font-medium text-yellow-800">Wait for call completion</h3>
                              <div className="mt-2 text-sm text-yellow-700">
                                <p>After your call has completed, <span className="font-bold text-yellow-900">please wait for 30 seconds</span> and then click the button below to check its status</p>
                              </div>
                              <div className="mt-4">
                                <Button 
                                  variant="outline" 
                                  className="bg-white hover:bg-yellow-50 border-yellow-300 text-yellow-800"
                                  onClick={handleRefreshCheck}
                                >
                                  <RefreshCw className="mr-2 h-4 w-4" />
                                  Check Status
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
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
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <CallStatusBadge status={rawStatus || 'Completed'} />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Developer</p>
                          <p className="font-medium">{developer}</p>
                        </div>
                        
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Phone Number</p>
                          <p className="font-medium">{number}</p>
                        </div>
                        
                        {/* Date and Time section - prioritize createdAt, then fallback to callTime */}
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Call Date & Time</p>
                          <p className="font-medium">
                            {callResult?.createdAt ? formatToIST(callResult.createdAt) :
                             callResult?.callTime ? formatToIST(callResult.callTime) : '-'}
                          </p>
                        </div>
                        
                        {callResult?.callDuration !== undefined && (
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Call Duration</p>
                            <p className="font-medium">{callResult.callDuration} seconds</p>
                          </div>
                        )}

                        {/* Always show Credits Used section */}
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Credits Used</p>
                          <p className="font-medium">{callResult?.creditsConsumed !== undefined ? callResult.creditsConsumed : '0'}</p>
                        </div>
                      </div>

                      {callResult?.summary && (
                        <div className="mt-4">
                          <h4 className="font-medium mb-2">Call Summary</h4>
                          <div className="p-3 bg-muted/50 rounded border border-border text-sm whitespace-pre-wrap">
                            {callResult.summary}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {status === 'completed' && (
                  <form onSubmit={handleFeedbackSubmit} className="mt-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-purple" />
                        <h4 className="font-medium">Share Your Feedback</h4>
                      </div>
                      <Textarea
                        placeholder="Add your feedback here (max 1000 characters)"
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        maxLength={1000}
                        className="min-h-24"
                      />
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-muted-foreground">
                          {feedback.length}/1000 characters
                        </div>
                        
                        <div className="flex space-x-3">
                          <Button 
                            type="submit" 
                            disabled={!feedback.trim() || isSubmitting}
                          >
                            {isSubmitting ? 'Sending...' : 'Send Feedback'}
                          </Button>
                          
                          <Button
                            type="button"
                            variant="outline"
                            onClick={onViewDetails}
                          >
                            View Full Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  } else {
    // When not in popup mode, render as a regular component (empty as requested)
    return null;
  }
};

// Helper function for status button refresh
const handleRefreshCheck = async () => {
  try {
    const response = await fetch('https://n8n.srv743759.hstgr.cloud/webhook/4069d9c5-cbeb-43d8-a08b-3935ffd91f58', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        callId: 'check-status',
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (error) {
    console.error('Error triggering refresh webhook:', error);
  }
};

// Call Status Badge Component
const CallStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  // Normalized status for comparison
  const normalizedStatus = status.toLowerCase();
  let bgColor: string = '';
  let textColor: string = '';
  let Icon: React.ElementType | null = null;
  
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

export default CallStatus;
