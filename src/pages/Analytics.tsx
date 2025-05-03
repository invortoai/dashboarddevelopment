
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, subDays, parseISO } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import AnalyticsChart from '@/components/analytics/AnalyticsChart';
import { Button } from '@/components/ui/button';
import { Phone } from 'lucide-react';
import { supabase } from '@/services/supabaseClient';
import { useToast } from '@/hooks/use-toast';

interface DailyCallData {
  date: string;
  calls: number;
  duration: number;
  credits: number;
  count: number; // This is needed for the AnalyticsChart component
}

interface CallDetail {
  id: string;
  call_duration: number;
  credits_consumed: number;
  created_at: string;
}

const Analytics: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [timeRange, setTimeRange] = useState('7days');
  const [chartData, setChartData] = useState<DailyCallData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    if (!user) return;
    
    // Set loading state
    setIsLoading(true);
    
    const fetchCallData = async () => {
      try {
        const days = timeRange === '30days' ? 30 : timeRange === '90days' ? 90 : 7;
        const startDate = subDays(new Date(), days).toISOString();
        
        // Fetch actual call data from Supabase
        const { data: callDetails, error } = await supabase
          .from('call_details')
          .select('id, call_duration, credits_consumed, created_at')
          .eq('user_id', user.id)
          .gte('created_at', startDate)
          .order('created_at', { ascending: true });
        
        if (error) {
          console.error('Error fetching call data:', error);
          toast({
            title: 'Error',
            description: 'Failed to fetch call data',
            variant: 'destructive',
          });
          setIsLoading(false);
          return;
        }
        
        // Process the data to group by day
        const processedData = processCallData(callDetails || [], days);
        setChartData(processedData);
        setIsLoading(false);
      } catch (err) {
        console.error('Error in data processing:', err);
        toast({
          title: 'Error',
          description: 'Failed to process call data',
          variant: 'destructive',
        });
        setIsLoading(false);
      }
    };
    
    fetchCallData();
  }, [timeRange, user, toast]);
  
  // Process call data to group by day
  const processCallData = (callDetails: CallDetail[], days: number): DailyCallData[] => {
    // Create empty data structure for all days in the range
    const daysMap: Record<string, DailyCallData> = {};
    
    // Initialize all days in the range
    for (let i = 0; i < days; i++) {
      const date = format(subDays(new Date(), days - i - 1), 'MMM dd');
      daysMap[date] = {
        date,
        calls: 0,
        duration: 0,
        credits: 0,
        count: 0
      };
    }
    
    // Fill in actual call data
    callDetails.forEach(call => {
      const callDate = format(parseISO(call.created_at), 'MMM dd');
      
      // Only process if the date is in our range
      if (daysMap[callDate]) {
        daysMap[callDate].calls += 1;
        daysMap[callDate].count += 1;
        daysMap[callDate].duration += call.call_duration || 0;
        daysMap[callDate].credits += call.credits_consumed || 0;
      }
    });
    
    // Convert map to array and sort by date
    return Object.values(daysMap).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  };
  
  const getTotalCalls = (): number => {
    return chartData.reduce((total, day) => total + day.calls, 0);
  };
  
  const getTotalDuration = (): number => {
    return chartData.reduce((total, day) => total + day.duration, 0);
  };
  
  const getTotalCredits = (): number => {
    return chartData.reduce((total, day) => total + day.credits, 0);
  };

  const handleMakeCallsClick = () => {
    navigate('/dashboard');
  };
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Welcome, {user?.name || 'User'}</h1>
          
          <div className="flex gap-4 items-center">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">7 Days</SelectItem>
                <SelectItem value="30days">30 Days</SelectItem>
                <SelectItem value="90days">90 Days</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              onClick={handleMakeCallsClick}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
            >
              <Phone size={16} />
              Make Calls
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Calls</CardTitle>
              <CardDescription className="text-2xl font-bold">{getTotalCalls()}</CardDescription>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Duration</CardTitle>
              <CardDescription className="text-2xl font-bold">{getTotalDuration()} secs</CardDescription>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Credits Used</CardTitle>
              <CardDescription className="text-2xl font-bold">{getTotalCredits()}</CardDescription>
            </CardHeader>
          </Card>
        </div>
        
        <Tabs defaultValue="calls">
          <TabsList>
            <TabsTrigger value="calls">Calls</TabsTrigger>
            <TabsTrigger value="duration">Duration</TabsTrigger>
            <TabsTrigger value="credits">Credits</TabsTrigger>
          </TabsList>
          
          <TabsContent value="calls" className="pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Call Volume</CardTitle>
                <CardDescription>
                  Number of calls over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AnalyticsChart 
                  data={chartData} 
                  isLoading={isLoading}
                  dataKey="calls"
                  color="#8854d0"
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="duration" className="pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Call Duration</CardTitle>
                <CardDescription>
                  Total call duration in seconds
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AnalyticsChart 
                  data={chartData} 
                  isLoading={isLoading}
                  dataKey="duration"
                  color="#3b82f6"
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="credits" className="pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Credits Used</CardTitle>
                <CardDescription>
                  Total credits consumed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AnalyticsChart 
                  data={chartData} 
                  isLoading={isLoading}
                  dataKey="credits"
                  color="#ef4444"
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Analytics;
