
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, subDays } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import AnalyticsChart from '@/components/analytics/AnalyticsChart';

interface DailyCallData {
  date: string;
  calls: number;
  duration: number;
  credits: number;
  count: number; // This is needed for the AnalyticsChart component
}

const Analytics: React.FC = () => {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState('7days');
  const [chartData, setChartData] = useState<DailyCallData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    if (!user) return;
    
    // Set loading state
    setIsLoading(true);
    
    // Generate dummy data for now
    // In a real app, this would fetch from an API
    const days = timeRange === '30days' ? 30 : timeRange === '90days' ? 90 : 7;
    const dummyData = generateDummyData(days);
    
    // Simulate API call with a small delay
    setTimeout(() => {
      setChartData(dummyData);
      setIsLoading(false);
    }, 500);
    
  }, [timeRange, user]);
  
  // Generate dummy data for the chart
  const generateDummyData = (days: number): DailyCallData[] => {
    return Array.from({ length: days }).map((_, i) => {
      const date = format(subDays(new Date(), days - i - 1), 'MMM dd');
      const calls = Math.floor(Math.random() * 5) + 1;
      const duration = Math.floor(Math.random() * 30) + 5;
      const credits = duration * 10;
      
      return {
        date,
        calls,
        duration,
        credits,
        count: calls // Set count equal to calls to match the expected type
      };
    });
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
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Call Analytics</h1>
          
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
              <CardDescription className="text-2xl font-bold">{getTotalDuration()} mins</CardDescription>
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
                  Total call duration in minutes
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
