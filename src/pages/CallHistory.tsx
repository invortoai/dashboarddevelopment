
import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import CallHistoryList from '@/components/call/CallHistoryList';
import { getCallHistory } from '@/services/call/callLog';
import { autoSyncCallLogToDetails } from '@/services/call/syncData';
import { getCallStatusFromDetails } from '@/services/call/callStatus';
import { useAuth } from '@/context/AuthContext';
import { CallDetails } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

const CallHistory: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [calls, setCalls] = useState<CallDetails[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  
  const fetchCallHistory = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      console.log('Fetching call history for user:', user.id);
      
      // First sync all call data from call_log to call_details for consistency
      const syncResult = await autoSyncCallLogToDetails(user.id);
      if (syncResult.success) {
        setSyncStatus(`Synced ${syncResult.synced} call records`);
        console.log('Sync result:', syncResult);
      }
      
      // Get the call history with fresh data from call_details
      const result = await getCallHistory(user.id);
      
      if (result.success && result.callHistory) {
        console.log(`Retrieved ${result.callHistory.length} calls from history`);
        
        // For each call, get the updated status directly from call_details table
        const updatedCalls = await Promise.all(
          result.callHistory.map(async (call) => {
            if (call.id) {
              const statusResult = await getCallStatusFromDetails(call.id);
              if (statusResult.success && statusResult.callData) {
                console.log(`Updated status for call ${call.id}:`, statusResult.callData);
                return {
                  ...call,
                  ...statusResult.callData,
                  isComplete: statusResult.isComplete
                };
              }
            }
            return call;
          })
        );
        
        setCalls(updatedCalls);
      } else {
        console.error('Failed to fetch call history:', result.message);
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching call history:', error);
      toast({
        title: "Error",
        description: "Failed to load call history. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
      // Clear sync status after 3 seconds
      setTimeout(() => setSyncStatus(null), 3000);
    }
  };
  
  useEffect(() => {
    fetchCallHistory();
  }, [user, toast]);
  
  const handleRefresh = () => {
    setRefreshing(true);
    fetchCallHistory();
  };
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Call History</h1>
          <div className="flex items-center gap-2">
            {syncStatus && (
              <span className="text-sm text-green-500">{syncStatus}</span>
            )}
            <Button 
              onClick={handleRefresh} 
              disabled={loading || refreshing}
              variant="outline"
            >
              {refreshing ? 'Refreshing...' : 'Refresh Data'}
            </Button>
          </div>
        </div>
        
        <p className="text-muted-foreground">
          View the details of all your past calls, including recordings and transcripts.
        </p>
        
        <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
          <CallHistoryList calls={calls} isLoading={loading} />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CallHistory;
