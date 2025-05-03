import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import CallForm from '@/components/call/CallForm';
import CallStatus from '@/components/call/CallStatus';
import { initiateCall, getCallLogData, syncCallLogToCallDetails, submitFeedback } from '@/services/callService';
import { getCallStatusFromDetails } from '@/services/call/callStatus';
import { useAuth } from '@/context/AuthContext';
import { CallDetails } from '@/types';
import { useToast } from '@/hooks/use-toast';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [callData, setCallData] = useState<{
    number: string;
    developer: string;
    project: string;
    callId?: string;
    callLogId?: string;
  } | null>(null);
  const [callStatus, setCallStatus] = useState<'initiating' | 'in-progress' | 'completed' | null>(null);
  const [callResult, setCallResult] = useState<CallDetails | null>(null);
  const [lastPolled, setLastPolled] = useState<Date | null>(null);
  const [rawStatus, setRawStatus] = useState<string | null>(null);
  
  // Function to handle call initiation
  const handleCallInitiate = async (data: { number: string; developer: string; project: string }) => {
    if (!user) return;
    
    try {
      const result = await initiateCall(user.id, data.number, data.developer, data.project);
      
      if (result.success && result.callDetails) {
        setCallData({
          number: data.number,
          developer: data.developer,
          project: data.project,
          callId: result.callDetails.id,
        });
        setCallStatus('initiating');
        
        toast({
          title: "Call Initiated",
          description: "Call has been initiated successfully. Please wait for the status to update.",
        });
        
        // Start polling for updates
        if (result.callDetails.id) {
          startPollingForUpdates(result.callDetails.id);
        }
      } else {
        toast({
          title: "Call Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error initiating call:', error);
      toast({
        title: "Call Failed",
        description: "An unexpected error occurred. Please try again later.",
        variant: "destructive",
      });
    }
  };
  
  // Function to poll for updates and sync data between call_log and call_details
  const startPollingForUpdates = useCallback((callId: string) => {
    // Setup polling interval to check for updates (every 3 seconds)
    const intervalId = setInterval(async () => {
      try {
        const now = new Date();
        console.log('Polling for updates for call ID:', callId, 'at', now.toISOString());
        setLastPolled(now);
        
        // First sync data from call_log to call_details to ensure consistency
        const syncResult = await syncCallLogToCallDetails(callId);
        console.log('Sync result:', syncResult);
        
        // Get status directly from call_details table
        const statusResult = await getCallStatusFromDetails(callId);
        
        if (statusResult.success) {
          console.log('Updated status information:', statusResult);
          
          // Store raw status for display purposes
          if (statusResult.callStatus) {
            setRawStatus(statusResult.callStatus);
          }
          
          // Get full call data from call_log 
          const callLogResult = await getCallLogData(callId);
          
          if (callLogResult.success && callLogResult.callData) {
            const callDetails = {
              ...callLogResult.callData,
              ...statusResult.callData
            };
            console.log('Combined call data:', callDetails);
            
            // Update callData with callLogId if available
            if (callDetails.callLogId && callData) {
              setCallData(prev => prev ? { ...prev, callLogId: callDetails.callLogId } : null);
            }
            
            // Determine call status based on various fields
            if (statusResult.isComplete || 
                callDetails.callStatus === 'completed' || 
                callDetails.callDuration) {
              console.log('Call completed, stopping polling');
              setCallStatus('completed');
              setCallResult(callDetails);
              clearInterval(intervalId); // Stop polling once completed
            } else if (callDetails.callStatus === 'in-progress' || 
                      callDetails.callStatus === 'yes' || 
                      callDetails.callAttempted) {
              setCallStatus('in-progress');
              console.log('Call in progress');
            }
          }
        }
      } catch (error) {
        console.error('Error during polling:', error);
      }
    }, 3000); // Poll every 3 seconds
    
    // Return cleanup function
    return () => clearInterval(intervalId);
  }, [callData]);
  
  // Reset the call state
  const resetCallState = () => {
    setCallData(null);
    setCallStatus(null);
    setCallResult(null);
    setLastPolled(null);
    setRawStatus(null);
  };

  // Handle feedback submission
  const handleFeedbackSubmit = async (feedback: string) => {
    if (!user || !callData?.callId) return;
    
    try {
      const result = await submitFeedback(user.id, callData.callId, feedback);
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Feedback submitted successfully.",
        });
        
        // Refresh call details to show the updated feedback
        if (callData.callId) {
          const updatedResult = await getCallLogData(callData.callId);
          if (updatedResult.success && updatedResult.callData) {
            setCallResult(updatedResult.callData);
          }
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
    }
  };

  // Handle view details navigation
  const handleViewDetails = () => {
    if (callData?.callId) {
      navigate(`/history/${callData.callId}`);
    }
  };
  
  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Call Dashboard</h1>
        
        {/* Only show the call form when no call is in progress */}
        <CallForm 
          onCallInitiated={handleCallInitiate} 
          disabled={callStatus !== null && callStatus !== 'completed'} 
        />
        
        {callData && callStatus && (
          <CallStatus 
            number={callData.number}
            developer={callData.developer}
            status={callStatus}
            callLogId={callData.callLogId}
            lastPolled={lastPolled}
            rawStatus={rawStatus || undefined}
            callResult={callResult || undefined}
            onFeedbackSubmit={handleFeedbackSubmit}
            onViewDetails={handleViewDetails}
            onClose={resetCallState}
            isPopup={true} // Explicitly set to true for call from dashboard
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
