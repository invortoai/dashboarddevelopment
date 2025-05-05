
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, subDays } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import AnalyticsChart from '@/components/analytics/AnalyticsChart';
import { Button } from '@/components/ui/button';
import { Phone } from 'lucide-react';
import { getDailyCallStats } from '@/services/call/analytics';
import { useToast } from '@/hooks/use-toast';

interface DailyCallData {
  date: string;
  count: number;
  duration: number;
  credits: number;
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
        // Get actual call data from getDailyCallStats service
        const result = await getDailyCallStats(user.id);
        
        if (result.success && result.stats) {
          // Filter data based on the selected time range
          const days = timeRange === '30days' ? 30 : timeRange === '90days' ? 90 : 7;
          const cutoffDate = subDays(new Date(), days);
          
          const filteredStats = filterStatsByDateRange(result.stats, cutoffDate);
          setChartData(filteredStats);
          
          console.log('Analytics chart data:', filteredStats);
        } else {
          toast({
            title: 'Error',
            description: result.message || 'Failed to fetch call data',
            variant: 'destructive',
          });
        }
        
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
  
  // Function to filter stats by date range
  const filterStatsByDateRange = (stats: DailyCallData[], cutoffDate: Date): DailyCallData[] => {
    // Create date objects for comparison
    return stats.filter(stat => {
      // Convert "MMM dd" format to a date object in the current year
      const currentYear = new Date().getFullYear();
      const [month, day] = stat.date.split(' ');
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const monthIndex = monthNames.indexOf(month);
      
      if (monthIndex === -1) return false;
      
      const statDate = new Date(currentYear, monthIndex, parseInt(day));
      return statDate >= cutoffDate;
    });
  };
  
  const getTotalCalls = (): number => {
    return chartData.reduce((total, day) => total + day.count, 0);
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
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-3 md:space-y-0">
          <h1 className="text-2xl md:text-3xl font-bold">Welcome, {user?.name || 'User'}</h1>
          
          <div className="flex flex-col md:flex-row gap-3 md:gap-4 items-start md:items-center">
            <Button 
              onClick={handleMakeCallsClick}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 w-full md:w-auto"
            >
              <Phone size={16} />
              Make Calls
            </Button>
            
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-full md:w-32">
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">7 Days</SelectItem>
                <SelectItem value="30days">30 Days</SelectItem>
                <SelectItem value="90days">90 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Calls</CardTitle>
              <CardDescription className="text-xl md:text-2xl font-bold">{getTotalCalls()}</CardDescription>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Duration</CardTitle>
              <CardDescription className="text-xl md:text-2xl font-bold">{getTotalDuration()} secs</CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="sm:col-span-2 md:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Credits Used</CardTitle>
              <CardDescription className="text-xl md:text-2xl font-bold">{getTotalCredits()}</CardDescription>
            </CardHeader>
          </Card>
        </div>
        
        <Tabs defaultValue="calls" className="w-full">
          <TabsList className="w-full md:w-auto">
            <TabsTrigger value="calls" className="flex-1 md:flex-none">Calls</TabsTrigger>
            <TabsTrigger value="duration" className="flex-1 md:flex-none">Duration</TabsTrigger>
            <TabsTrigger value="credits" className="flex-1 md:flex-none">Credits</TabsTrigger>
          </TabsList>
          
          <TabsContent value="calls" className="pt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-center">Call Volume</CardTitle>
                <CardDescription className="text-center">
                  Number of calls over time
                </CardDescription>
              </CardHeader>
              <CardContent className="py-4 px-2 md:px-6">
                <AnalyticsChart 
                  data={chartData} 
                  isLoading={isLoading}
                  dataKey="count"
                  color="#8854d0"
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="duration" className="pt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-center">Call Duration</CardTitle>
                <CardDescription className="text-center">
                  Total call duration in seconds
                </CardDescription>
              </CardHeader>
              <CardContent className="py-4 px-2 md:px-6">
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
                <CardTitle className="text-center">Credits Used</CardTitle>
                <CardDescription className="text-center">
                  Total credits consumed
                </CardDescription>
              </CardHeader>
              <CardContent className="py-4 px-2 md:px-6">
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
