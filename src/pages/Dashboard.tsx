
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import CallForm from '@/components/call/CallForm';
import CallStatus from '@/components/call/CallStatus';
import CallResult from '@/components/call/CallResult';
import { initiateCall } from '@/services/callService';
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
        
        // Real implementation would use webhooks to receive updates from the external call service
        // This would update the status based on actual call progress
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
