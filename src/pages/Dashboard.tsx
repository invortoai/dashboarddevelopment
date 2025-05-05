import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import CallForm from '@/components/call/CallForm';
import CallStatus from '@/components/call/CallStatus';
import CallDispositionChart from '@/components/analytics/CallDispositionChart';
import { initiateCall, getCallLogData, syncCallLogToCallDetails, submitFeedback } from '@/services/callService';
import { getCallStatusFromDetails } from '@/services/call/callStatus';
import { useAuth } from '@/context/AuthContext';
import { CallDetails } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/services/supabaseClient';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Dashboard: React.FC = () => {
  const { user, refreshUserData } = useAuth();
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
  
  // State for call disposition data
  const [dispositionData, setDispositionData] = useState<
    Array<{ name: string; value: number; color: string }>
  >([
    { name: 'Answered', value: 0, color: '#22c55e' },
    { name: 'No Answer', value: 0, color: '#f97316' },
    { name: 'Busy', value: 0, color: '#eab308' },
    { name: 'Failed', value: 0, color: '#ef4444' },
    { name: 'Pending', value: 0, color: '#6b7280' },
  ]);
  const [totalCalls, setTotalCalls] = useState(0);
  
  // Fetch call disposition data
  useEffect(() => {
    const fetchCallDispositionData = async () => {
      if (!user) return;
      
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const { data, error } = await supabase
          .from('call_details')
          .select('call_status')
          .eq('user_id', user.id)
          .gte('created_at', today.toISOString());
          
        if (error) {
          console.error('Error fetching call disposition data:', error);
          return;
        }
        
        if (!data || data.length === 0) {
          setTotalCalls(0);
          return;
        }
        
        setTotalCalls(data.length);
        
        const statusCounts: Record<string, number> = {
          'answered': 0,
          'no answer': 0,
          'busy': 0,
          'failed': 0,
          'pending': 0
        };
        
        data.forEach(call => {
          const status = call.call_status?.toLowerCase() || 'pending';
          
          if (status.includes('answer') && !status.includes('no')) {
            statusCounts['answered']++;
          } else if (status.includes('no answer') || status.includes('not answered')) {
            statusCounts['no answer']++;
          } else if (status.includes('busy')) {
            statusCounts['busy']++;
          } else if (status.includes('fail') || status.includes('error')) {
            statusCounts['failed']++;
          } else {
            statusCounts['pending']++;
          }
        });
        
        const newData = [
          { name: 'Answered', value: statusCounts['answered'], color: '#22c55e' },
          { name: 'No Answer', value: statusCounts['no answer'], color: '#f97316' },
          { name: 'Busy', value: statusCounts['busy'], color: '#eab308' },
          { name: 'Failed', value: statusCounts['failed'], color: '#ef4444' },
          { name: 'Pending', value: statusCounts['pending'], color: '#6b7280' }
        ].filter(item => item.value > 0); // Only include statuses with values
        
        setDispositionData(newData);
      } catch (error) {
        console.error('Error in fetchCallDispositionData:', error);
      }
    };
    
    fetchCallDispositionData();
    
    // Refresh data every 5 minutes
    const intervalId = setInterval(fetchCallDispositionData, 300000);
    return () => clearInterval(intervalId);
  }, [user]);
  
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
              
              // Refresh user data to get updated credit balance
              console.log('Refreshing user data to update credit balance...');
              await refreshUserData();
              console.log('User data refreshed. Credits should be updated.');
              
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
  }, [callData, refreshUserData]);
  
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
      <div className="max-w-3xl mx-auto mb-8">
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
      
      {/* Analytics Section */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Today's Call Analytics</h2>
        
        <Tabs defaultValue="chart" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="chart">Call Distribution</TabsTrigger>
            <TabsTrigger value="status">Call Status</TabsTrigger>
          </TabsList>
          
          <TabsContent value="chart" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Call Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <CallDispositionChart 
                  data={dispositionData} 
                  totalCalls={totalCalls} 
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="status" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Call Status Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Pie Chart */}
                  <div className="flex justify-center items-center h-64">
                    <CallDispositionChart 
                      data={dispositionData} 
                      totalCalls={totalCalls}
                      simplified={true}
                    />
                  </div>
                  
                  {/* Status List */}
                  <div className="space-y-2">
                    {dispositionData.map((item) => (
                      <div key={item.name} className="flex items-center justify-between p-2 rounded bg-background border">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                          <span>{item.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{item.value}</span>
                          <span className="text-muted-foreground text-sm">
                            ({Math.round((item.value / totalCalls) * 100)}%)
                          </span>
                        </div>
                      </div>
                    ))}
                    <div className="pt-2 border-t">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">Total</span>
                        <span className="font-semibold">{totalCalls} calls</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
