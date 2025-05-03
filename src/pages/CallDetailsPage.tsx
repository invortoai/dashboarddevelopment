import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import CallDetailsComponent from '@/components/call/CallDetails';
import CallStatus from '@/components/call/CallStatus';
import { Button } from '@/components/ui/button';
import { getCallLogData, submitFeedback, viewRecording, viewTranscript } from '@/services/callService';
import { getCallStatusFromDetails } from '@/services/call/callStatus';
import { syncCallLogToCallDetails } from '@/services/call/syncData';
import { useAuth } from '@/context/AuthContext';
import { CallDetails } from '@/types';
import { useToast } from '@/hooks/use-toast';

const CallDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [callDetails, setCallDetails] = useState<CallDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submittingFeedback, setSubmittingFeedback] = useState<boolean>(false);
  const [lastPolled, setLastPolled] = useState<Date | null>(null);
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const [syncAttempts, setSyncAttempts] = useState<number>(0);
  
  // Define fetchCallDetails as a useCallback to avoid recreating it on each render
  const fetchCallDetails = useCallback(async () => {
    if (!user || !id) return;
    
    try {
      // We don't set loading to true here when polling to avoid UI flicker
      if (!callDetails) {
        setLoading(true);
      }
      
      console.log('Fetching call details for ID:', id);
      
      // Force sync from call_log to call_details with retries for persistent errors
      for (let attempt = 0; attempt < 3; attempt++) {
        const syncResult = await syncCallLogToCallDetails(id);
        console.log(`Sync attempt ${attempt + 1} result:`, syncResult);
        
        if (syncResult.success) {
          setSyncAttempts(0); // Reset counter on success
          break;
        }
        
        if (attempt === 2) {
          console.warn('Sync failed after multiple attempts');
          setSyncAttempts(prev => prev + 1);
        }
      }
      
      // Get status directly from call_details table
      const statusResult = await getCallStatusFromDetails(id);
      console.log('Status result from call_details:', statusResult);
      
      // Get data from call_log
      const result = await getCallLogData(id);
      
      if (result.success && result.callData) {
        console.log('Call log data fetched:', result.callData);
        
        // Combine data, with call_details status data taking precedence
        const combinedData = {
          ...result.callData,
          ...(statusResult.success && statusResult.callData ? statusResult.callData : {})
        };
        
        console.log('Combined call details:', combinedData);
        setCallDetails(combinedData);
        
        // Mark as complete if we have completion indicators
        if (statusResult.isComplete) {
          setIsComplete(true);
        }

        // Update lastPolled timestamp
        setLastPolled(new Date());
        
        if (syncAttempts > 3 && result.callData.callStatus) {
          // If sync keeps failing but we have call status from call_log, use that directly
          toast({
            title: "Sync Warning",
            description: "Using data directly from call logs due to sync issues.",
            variant: "warning",
          });
        }
      } else {
        console.error('Failed to fetch call log data:', result.message);
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
        navigate('/history');
      }
    } catch (error) {
      console.error('Error fetching call details:', error);
      toast({
        title: "Error",
        description: "Failed to load call details. Redirecting to call history.",
        variant: "destructive",
      });
      navigate('/history');
    } finally {
      setLoading(false);
    }
  }, [id, user, navigate, toast, callDetails, syncAttempts]);
  
  useEffect(() => {
    fetchCallDetails();
    
    // Set up a polling interval only when the call is not yet complete
    const intervalId = setInterval(() => {
      if (id && user && !isComplete) {
        console.log('Polling for call details updates');
        fetchCallDetails();
      }
    }, 10000); // Poll every 10 seconds
    
    return () => clearInterval(intervalId);
  }, [fetchCallDetails, id, user, isComplete]);
  
  const handleFeedbackSubmit = async (feedback: string) => {
    if (!user || !id || !feedback.trim()) return;
    
    try {
      setSubmittingFeedback(true);
      const result = await submitFeedback(user.id, id, feedback);
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Feedback submitted successfully.",
        });
        
        // Refresh call details to get the updated feedback
        const updatedResult = await getCallLogData(id);
        if (updatedResult.success && updatedResult.callData) {
          setCallDetails(updatedResult.callData);
        }
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setSubmittingFeedback(false);
    }
  };
  
  const handleRecordingView = async () => {
    if (!user || !id) return;
    
    try {
      await viewRecording(user.id, id);
    } catch (error) {
      console.error('Error recording view activity:', error);
    }
  };
  
  const handleTranscriptView = async () => {
    if (!user || !id) return;
    
    try {
      await viewTranscript(user.id, id);
    } catch (error) {
      console.error('Error recording transcript view activity:', error);
    }
  };
  
  const getCallStatusForDisplay = (): 'initiating' | 'in-progress' | 'completed' | null => {
    if (!callDetails) return null;
    
    if (isComplete) return 'completed';
    
    const statusLower = callDetails.callStatus?.toLowerCase() || '';
    
    if (statusLower.includes('error') || 
        statusLower.includes('busy') || 
        statusLower.includes('failed')) {
      return 'completed'; // Show as completed for error states
    }
    
    if (statusLower.includes('in-progress')) return 'in-progress';
    
    if (callDetails.callAttempted) return 'initiating';
    
    return null;
  };
  
  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-full">
          <div className="h-12 w-12 rounded-full border-4 border-t-transparent border-purple animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }
  
  if (!callDetails) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-full">
          <p className="text-lg text-muted-foreground mb-4">Call details not found</p>
          <Button onClick={() => navigate('/history')}>
            Back to Call History
          </Button>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Call Details</h1>
          <div className="flex gap-2">
            {id && !isComplete && (
              <Button variant="secondary" onClick={fetchCallDetails}>
                Check Status
              </Button>
            )}
            <Button variant="outline" onClick={() => navigate('/history')}>
              Back to Call History
            </Button>
          </div>
        </div>
        
        {/* Display current call status */}
        <CallStatus
          number={callDetails?.number || ''}
          developer={callDetails?.developer || ''}
          status={getCallStatusForDisplay()}
          callLogId={callDetails?.callLogId}
          lastPolled={lastPolled}
          rawStatus={callDetails?.callStatus}
        />
        
        <div className="mt-6">
          {callDetails && (
            <CallDetailsComponent
              callDetails={callDetails}
              onFeedbackSubmit={handleFeedbackSubmit}
              onRecordingView={handleRecordingView}
              onTranscriptView={handleTranscriptView}
              isSubmittingFeedback={submittingFeedback}
            />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CallDetailsPage;
