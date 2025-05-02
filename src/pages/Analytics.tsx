
import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AnalyticsChart from '@/components/analytics/AnalyticsChart';
import { Card, CardContent } from '@/components/ui/card';
import { getDailyCallStats } from '@/services/callService';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

const Analytics: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [callData, setCallData] = useState<Array<{ date: string; count: number }>>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  useEffect(() => {
    const fetchCallStats = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const result = await getDailyCallStats(user.id);
        
        if (result.success && result.stats) {
          setCallData(result.stats);
        } else {
          toast({
            title: "Error",
            description: result.message,
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error fetching call statistics:', error);
        toast({
          title: "Error",
          description: "Failed to load analytics data. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchCallStats();
  }, [user, toast]);
  
  const getTotalCalls = () => callData.reduce((sum, day) => sum + day.count, 0);
  
  const getAvgCallsPerDay = () => {
    if (callData.length === 0) return 0;
    const total = getTotalCalls();
    return (total / callData.length).toFixed(1);
  };
  
  const getMostCallsDay = () => {
    if (callData.length === 0) return { date: 'N/A', count: 0 };
    return callData.reduce((max, day) => day.count > max.count ? day : max, { date: '', count: 0 });
  };
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        
        <p className="text-muted-foreground">
          Track and analyze your calling activity over time.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard title="Total Calls" value={getTotalCalls().toString()} isLoading={loading} />
          <StatCard title="Avg Calls Per Day" value={getAvgCallsPerDay()} isLoading={loading} />
          <StatCard 
            title="Most Active Day" 
            value={getMostCallsDay().date !== 'N/A' ? `${getMostCallsDay().date} (${getMostCallsDay().count})` : 'N/A'} 
            isLoading={loading} 
          />
        </div>
        
        <AnalyticsChart data={callData} isLoading={loading} />
      </div>
    </DashboardLayout>
  );
};

interface StatCardProps {
  title: string;
  value: string;
  isLoading: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, isLoading }) => (
  <Card>
    <CardContent className="p-6">
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      {isLoading ? (
        <div className="h-6 w-16 bg-muted animate-pulse rounded mt-2"></div>
      ) : (
        <p className="text-2xl font-bold mt-1">{value}</p>
      )}
    </CardContent>
  </Card>
);

export default Analytics;
