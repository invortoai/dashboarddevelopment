import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatTimeAgo, formatToIST } from '@/utils/dateUtils';
import { Check, PhoneOff, PhoneMissed, X, AlertCircle, RefreshCw, MessageSquare } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { recalculateUserCredits } from '@/services/userCredits';
import { useAuth } from '@/context/AuthContext';
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog';

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
  isPopup?: boolean; // Prop to determine if it should render as a popup
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
  const { user, refreshUserData } = useAuth();
  
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

  // Helper function for status button refresh - moved inside component to access hooks
  const handleRefreshCheck = async () => {
    try {
      // First, trigger the webhook to check for updated call status
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

      // Recalculate user credits if user is logged in and call is completed
      if (user && user.id && (status === 'completed' || rawStatus?.toLowerCase().includes('complete') || rawStatus?.toLowerCase().includes('answered'))) {
        try {
          toast({
            title: "Updating credits...",
            description: "Recalculating your credit balance based on call history.",
          });

          // Perform credit recalculation
          const recalcResult = await recalculateUserCredits(user.id);
          
          if (recalcResult.success) {
            // Update user data in context
            await refreshUserData();
            console.log(`Credit balance recalculated after status refresh: ${recalcResult.newBalance} credits remaining`);
            
            toast({
              title: "Credits Updated",
              description: `Your credit balance has been recalculated to ${recalcResult.newBalance} credits.`,
            });
          } else {
            console.error('Failed to recalculate credit balance during status refresh:', recalcResult.message);
          }
        } catch (error) {
          console.error('Error recalculating credits during status refresh:', error);
        }
      } else {
        console.log('Skipping credit recalculation - call not completed or user not logged in');
      }
    } catch (error) {
      console.error('Error triggering refresh webhook:', error);
      toast({
        title: "Refresh Failed",
        description: "Could not refresh call status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const hasError = rawStatus?.toLowerCase().includes('error') || 
                  rawStatus?.toLowerCase().includes('busy') || 
                  rawStatus?.toLowerCase().includes('failed');

  const isSuccessful = status === 'completed' && 
                     !hasError && 
                     (rawStatus?.toLowerCase().includes('answered') || 
                      rawStatus?.toLowerCase().includes('complete'));
  
  if (!status) return null;
  
  const content = (
    <Card className="bg-card border-2 border-purple shadow-xl relative">
      {/* Close button positioning */}
      {((hasError || showCloseButton) && onClose) && (
        <button 
          onClick={onClose} 
          className="absolute -right-3 -top-3 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-md transition-colors z-10"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      )}
      <CardContent className="p-3 md:p-5 overflow-y-auto">
        <div className="flex flex-col space-y-3 md:space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg md:text-xl font-bold">Call Status</h3>
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

          {/* Call Log ID - smaller, more compact - ALWAYS display if available */}
          {callLogId && (
            <div className="text-center p-1.5 md:p-2 bg-muted/50 rounded-md border border-border">
              <p className="text-xs md:text-sm font-medium break-all">Call Log ID: {callLogId}</p>
            </div>
          )}

          {/* Main content area with call details - more compact */}
          <div className="p-3 md:p-4 border border-border rounded-md bg-muted overflow-y-auto max-h-[35vh] md:max-h-[40vh]">
            {status === 'initiating' && (
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="flex items-center space-x-2">
                  <div className="h-4 w-4 rounded-full border-2 border-t-transparent border-purple animate-spin"></div>
                  <p className="md:text-base">Initiating call...</p>
                </div>

                {showRefreshButton && (
                  <div className="w-full mt-2">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-2.5 mb-2">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <AlertCircle className="h-4 w-4 text-yellow-400" aria-hidden="true" />
                        </div>
                        <div className="ml-2">
                          <h3 className="text-sm font-medium text-yellow-800">Wait for call completion</h3>
                          <div className="mt-1 text-xs md:text-sm text-yellow-700">
                            <p>After your call has completed, <span className="font-bold text-yellow-900">please wait for 30 seconds</span> and then click the button below</p>
                          </div>
                          <div className="mt-2">
                            <Button 
                              variant="outline" 
                              className="bg-white hover:bg-yellow-50 border-yellow-300 text-yellow-800 text-xs md:text-sm h-8 md:h-9 px-2 md:px-3"
                              onClick={handleRefreshCheck}
                            >
                              <RefreshCw className="mr-1 h-3 w-3 md:h-4 md:w-4" />
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
                <p className="text-sm md:text-base">
                  Call in progress with <span className="font-bold">{developer}</span> on{' '}
                  <span className="font-bold">{number}</span>. Status updates when finished.
                </p>

                {showRefreshButton && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-2.5 mt-2">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <AlertCircle className="h-4 w-4 text-yellow-400" aria-hidden="true" />
                      </div>
                      <div className="ml-2">
                        <h3 className="text-xs md:text-sm font-medium text-yellow-800">Wait for call completion</h3>
                        <div className="mt-1 text-xs md:text-sm text-yellow-700">
                          <p>After your call has completed, <span className="font-bold text-yellow-900">please wait for 30 seconds</span> and click below</p>
                        </div>
                        <div className="mt-2">
                          <Button 
                            variant="outline" 
                            className="bg-white hover:bg-yellow-50 border-yellow-300 text-yellow-800 h-8 md:h-9 px-2 md:px-3 text-xs md:text-sm"
                            onClick={handleRefreshCheck}
                          >
                            <RefreshCw className="mr-1 h-3 w-3 md:h-4 md:w-4" />
                            Check Status
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {lastPolled && (
                  <p className="text-xs md:text-sm text-muted-foreground mt-2">
                    Last checked: {formatTimeAgo(lastPolled)}
                  </p>
                )}
              </div>
            )}
            
            {status === 'in-progress' && hasError && (
              <div>
                <p className="text-amber-500 font-medium mb-2 text-sm md:text-base">
                  Call connection issue detected
                </p>
                <p className="text-sm md:text-base">
                  There was a problem connecting the call to <span className="font-bold">{developer}</span> on{' '}
                  <span className="font-bold">{number}</span>.
                </p>
                {rawStatus && (
                  <p className="text-xs md:text-sm text-muted-foreground mt-1 break-all">
                    Error: {rawStatus}
                  </p>
                )}
                <p className="text-xs md:text-sm mt-1">
                  Please try again in a few minutes or contact support if the issue persists.
                </p>
              </div>
            )}
            
            {status === 'completed' && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <CallStatusBadge status={rawStatus || 'Completed'} />
                </div>

                <div className="grid grid-cols-2 gap-2 md:gap-4 mb-3 md:mb-4">
                  <div className="space-y-0.5 text-xs md:text-sm">
                    <p className="text-muted-foreground">Developer</p>
                    <p className="font-medium break-all">{developer}</p>
                  </div>
                  
                  <div className="space-y-0.5 text-xs md:text-sm">
                    <p className="text-muted-foreground">Phone Number</p>
                    <p className="font-medium break-all">{number}</p>
                  </div>
                  
                  <div className="space-y-0.5 text-xs md:text-sm">
                    <p className="text-muted-foreground">Call Date & Time</p>
                    <p className="font-medium">
                      {callResult?.createdAt ? formatToIST(callResult.createdAt) :
                       callResult?.callTime ? formatToIST(callResult.callTime) : '-'}
                    </p>
                  </div>
                  
                  {callResult?.callDuration !== undefined && (
                    <div className="space-y-0.5 text-xs md:text-sm">
                      <p className="text-muted-foreground">Call Duration</p>
                      <p className="font-medium">{callResult.callDuration} seconds</p>
                    </div>
                  )}

                  <div className="space-y-0.5 text-xs md:text-sm">
                    <p className="text-muted-foreground">Credits Used</p>
                    <p className="font-medium">{callResult?.creditsConsumed !== undefined ? callResult.creditsConsumed : '0'}</p>
                  </div>
                  
                  {callLogId && (
                    <div className="space-y-0.5 text-xs md:text-sm">
                      <p className="text-muted-foreground">Call Log ID</p>
                      <p className="font-medium">{callLogId}</p>
                    </div>
                  )}
                </div>

                {callResult?.summary && (
                  <div>
                    <h4 className="font-medium mb-1 text-xs md:text-sm">Call Summary</h4>
                    <div className="p-2 md:p-3 bg-muted/50 rounded border border-border text-xs md:text-sm whitespace-pre-wrap max-h-20 md:max-h-28 overflow-y-auto">
                      {callResult.summary}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {status === 'completed' && (
            <form onSubmit={handleFeedbackSubmit} className="mt-1">
              <div className="space-y-2 md:space-y-3">
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4 text-purple" />
                  <h4 className="font-medium text-sm md:text-base">Share Your Feedback</h4>
                </div>
                <Textarea
                  placeholder="Add your feedback here (max 1000 characters)"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  maxLength={1000}
                  className="min-h-16 md:min-h-24 resize-none text-sm md:text-base"
                />
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                  <div className="text-xs md:text-sm text-muted-foreground">
                    {feedback.length}/1000 characters
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      type="submit" 
                      disabled={!feedback.trim() || isSubmitting}
                      className="h-8 md:h-10 text-xs md:text-sm"
                      size="sm"
                    >
                      {isSubmitting ? 'Sending...' : 'Send Feedback'}
                    </Button>
                    
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onViewDetails}
                      className="h-8 md:h-10 text-xs md:text-sm whitespace-nowrap"
                      size="sm"
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>
      </CardContent>
    </Card>
  );

  // When in popup mode, render with dialog/backdrop
  if (isPopup) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-hidden">
        <div className="w-full max-w-md md:max-w-lg lg:max-w-xl">
          {content}
        </div>
      </div>
    );
  } else {
    // When not in popup mode, render as a regular component
    return content;
  }
};

// Call Status Badge Component - more compact
const CallStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  // Normalized status for comparison
  const normalizedStatus = status.toLowerCase();
  let bgColor: string = '';
  let textColor: string = '';
  let Icon: React.ElementType | null = null;
  
  if (normalizedStatus.includes('answered') || normalizedStatus.includes('complete') || normalizedStatus.includes('completed')) {
    bgColor = 'bg-green-500/20';
    textColor = 'text-green-600';
    Icon = Check;
  } else if (normalizedStatus.includes('busy') || normalizedStatus.includes('number busy')) {
    bgColor = 'bg-yellow-500/20';
    textColor = 'text-yellow-600';
    Icon = PhoneOff;
  } else if (normalizedStatus.includes('not answered') || normalizedStatus.includes('no answer')) {
    bgColor = 'bg-orange-500/20';
    textColor = 'text-orange-600';
    Icon = PhoneMissed;
  } else if (normalizedStatus.includes('error') || normalizedStatus.includes('fail')) {
    bgColor = 'bg-red-500/20';
    textColor = 'text-red-600';
    Icon = X;
  } else {
    bgColor = 'bg-gray-500/20';
    textColor = 'text-gray-500';
  }

  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs md:text-sm font-medium ${bgColor} ${textColor}`}>
      {Icon && <Icon size={12} className="md:w-3 md:h-3" />}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

export default CallStatus;
