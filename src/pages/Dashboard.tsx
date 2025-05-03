import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import CallForm from '@/components/call/CallForm';
import CallStatus from '@/components/call/CallStatus';
import CallResult from '@/components/call/CallResult';
import { initiateCall, syncCallLogToCallDetails } from '@/services/callService';
import { useAuth } from '@/context/AuthContext';
import { CallDetails } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/services/supabaseClient';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [callData, setCallData] = useState<{
    number: string;
    developer: string;
    project: string;
    callId?: string;
    callLogId?: string;
  } | null>(null);
  const [callStatus, setCallStatus] = useState<'initiating' | 'in-progress' | 'completed' | null>(null);
  const [callResult, setCallResult] = useState<CallDetails | null>(null);
  
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
        
        // Start polling for call updates
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
  
  // Function to poll for updates from call_log
  const startPollingForUpdates = (callId: string) => {
    // Setup polling interval to check for updates (every 10 seconds)
    const intervalId = setInterval(async () => {
      try {
        // Sync data from call_log to call_details
        const syncResult = await syncCallLogToCallDetails(callId);
        
        if (syncResult.success) {
          // Check the call status after sync
          const { data, error } = await supabase
            .from('call_details')
            .select('*')
            .eq('id', callId)
            .single();
            
          if (data && !error) {
            // Process the updated data
            const callDetails: CallDetails = {
              id: data.id,
              userId: data.user_id,
              number: data.number,
              developer: data.developer,
              project: data.project,
              callAttempted: data.call_attempted,
              callLogId: data.call_log_id,
              callStatus: data.call_status,
              summary: data.summary,
              callRecording: data.call_recording,
              transcript: data.transcript,
              callDuration: data.call_duration,
              callTime: data.call_time,
              creditsConsumed: data.credits_consumed,
              feedback: data.feedback,
              createdAt: data.created_at
            };
            
            // Update the status based on the call details
            if (data.call_duration) {
              setCallStatus('completed');
              setCallResult(callDetails);
              clearInterval(intervalId); // Stop polling once completed
            } else if (data.call_status === 'yes') {
              setCallStatus('in-progress');
            }
          }
        }
      } catch (error) {
        console.error('Error during polling:', error);
      }
    }, 10000); // Poll every 10 seconds
    
    // Clean up the interval when the component unmounts
    return () => clearInterval(intervalId);
  };
  
  // Reset the call state
  const resetCallState = () => {
    setCallData(null);
    setCallStatus(null);
    setCallResult(null);
  };
  
  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Call Dashboard</h1>
        
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
          />
        )}
        
        {callResult && (
          <CallResult 
            callDetails={callResult} 
            onReset={resetCallState}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
