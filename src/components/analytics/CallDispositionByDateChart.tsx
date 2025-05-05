
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from '@/components/ui/chart';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

interface CallDispositionByDateData {
  date: string;
  status: string;
  count: number;
  color: string;
}

interface CallDispositionByDateChartProps {
  data: CallDispositionByDateData[];
  isLoading?: boolean;
}

const CallDispositionByDateChart: React.FC<CallDispositionByDateChartProps> = ({ 
  data, 
  isLoading = false
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle><Skeleton className="h-6 w-3/4" /></CardTitle>
          <CardDescription><Skeleton className="h-4 w-1/2" /></CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Call Disposition by Date</CardTitle>
          <CardDescription>Distribution of call status by date</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-[300px]">
          <p className="text-muted-foreground">No data available</p>
        </CardContent>
      </Card>
    );
  }

  // Process data to create a nested chart
  const processedData = data.reduce((acc: Record<string, any>[], curr) => {
    // Find if we already have this date
    const existingDateEntry = acc.find(item => item.date === curr.date);
    
    if (existingDateEntry) {
      // Update existing date entry with this status
      existingDateEntry[curr.status] = curr.count;
    } else {
      // Create a new date entry
      const newEntry: Record<string, any> = {
        date: curr.date
      };
      newEntry[curr.status] = curr.count;
      acc.push(newEntry);
    }
    
    return acc;
  }, []);

  // Get unique status values for the bars
  const uniqueStatuses = Array.from(new Set(data.map(item => item.status)));
  
  // Get colors for each status
  const statusColors = uniqueStatuses.reduce((acc: Record<string, string>, status) => {
    const item = data.find(d => d.status === status);
    if (item) {
      acc[status] = item.color;
    }
    return acc;
  }, {});

  return (
    <Card>
      <CardHeader>
        <CardTitle>Call Disposition by Date</CardTitle>
        <CardDescription>Distribution of call status across dates</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ChartContainer
            config={
              Object.entries(statusColors).reduce((acc: Record<string, any>, [status, color]) => {
                acc[status] = { label: status.charAt(0).toUpperCase() + status.slice(1), color };
                return acc;
              }, {})
            }
            className="h-full w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={processedData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  content={
                    <ChartTooltipContent />
                  }
                />
                <Legend />
                {uniqueStatuses.map((status) => (
                  <Bar 
                    key={status}
                    dataKey={status} 
                    name={status.charAt(0).toUpperCase() + status.slice(1)} 
                    stackId="a"
                    fill={statusColors[status]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default CallDispositionByDateChart;
