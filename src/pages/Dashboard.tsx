
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import CallForm from '@/components/call/CallForm';
import CallStatus from '@/components/call/CallStatus';
import CallResult from '@/components/call/CallResult';
import { initiateCall, updateCallStatus, updateCallCompletion } from '@/services/callService';
import { useAuth } from '@/context/AuthContext';
import { CallDetails } from '@/types';
import { useToast } from '@/hooks/use-toast';

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
        
        // Start polling for call status updates
        startPollingCallStatus(result.callDetails.id);
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
  
  // Function to poll call status
  const startPollingCallStatus = (callId: string) => {
    // Mock API call delay
    // In a real application, you'd make actual API calls to check status
    setTimeout(() => {
      // Simulated response for call attempted with call log ID
      const callLogId = `CL-${Math.floor(100000 + Math.random() * 900000)}`;
      
      // Update the call status
      updateCallStatus(callId, {
        callAttempted: true,
        callLogId,
        callStatus: 'yes',
        callTime: new Date().toISOString(),
      }).then(() => {
        setCallData((prev) => prev ? { ...prev, callLogId } : null);
        setCallStatus('in-progress');
        
        // Simulate call completion after 15-30 seconds
        const completionDelay = 15000 + Math.random() * 15000;
        
        setTimeout(() => {
          const callDuration = Math.floor(completionDelay / 1000);
          const creditsConsumed = Math.ceil(callDuration / 60) * 10;
          
          // Update call with completion data
          updateCallCompletion(callId, user.id, {
            summary: "Call completed successfully. The developer discussed project requirements and timelines.",
            callRecording: "https://example.com/recordings/demo-call.mp3",
            transcript: "Agent: Hello, this is a test call.\nDeveloper: Hi there, I'm calling about the project.",
            callDuration,
            creditsConsumed,
          }).then(() => {
            setCallStatus('completed');
            setCallResult({
              id: callId,
              userId: user.id,
              number: callData?.number || '',
              developer: callData?.developer || '',
              project: callData?.project || '',
              callAttempted: true,
              callLogId,
              callStatus: 'completed',
              summary: "Call completed successfully. The developer discussed project requirements and timelines.",
              callRecording: "https://example.com/recordings/demo-call.mp3",
              transcript: "Agent: Hello, this is a test call.\nDeveloper: Hi there, I'm calling about the project.",
              callDuration,
              callTime: new Date().toISOString(),
              creditsConsumed,
              createdAt: new Date().toISOString()
            });
          });
        }, completionDelay);
      });
    }, 5000);
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
          // Disable the form when a call is in progress
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
