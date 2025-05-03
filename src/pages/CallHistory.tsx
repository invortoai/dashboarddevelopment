import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import CallHistoryList from '@/components/call/CallHistoryList';
import { getCallHistory } from '@/services/callService';
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
  
  const fetchCallHistory = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      console.log('Fetching call history for user:', user.id);
      
      // Get the call history directly from call_log
      const result = await getCallHistory(user.id);
      
      if (result.success && result.callHistory) {
        console.log(`Retrieved ${result.callHistory.length} calls from history`);
        setCalls(result.callHistory);
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
          <Button 
            onClick={handleRefresh} 
            disabled={loading || refreshing}
            variant="outline"
          >
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </Button>
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
