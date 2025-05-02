
import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import CallHistoryList from '@/components/call/CallHistoryList';
import { getCallHistory } from '@/services/callService';
import { useAuth } from '@/context/AuthContext';
import { CallDetails } from '@/types';
import { useToast } from '@/hooks/use-toast';

const CallHistory: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [calls, setCalls] = useState<CallDetails[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  useEffect(() => {
    const fetchCallHistory = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const result = await getCallHistory(user.id);
        
        if (result.success && result.callHistory) {
          setCalls(result.callHistory);
        } else {
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
      }
    };
    
    fetchCallHistory();
  }, [user, toast]);
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Call History</h1>
        
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
