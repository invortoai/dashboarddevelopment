
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useIsMobile } from '@/hooks/use-mobile';

interface AnalyticsChartProps {
  data: Array<{ date: string; count: number; [key: string]: any }>;
  isLoading?: boolean;
  dataKey?: string;
  color?: string;
}

const CustomTooltip = ({ active, payload, label, dataKey }: any) => {
  if (active && payload && payload.length) {
    // Determine the proper label for the tooltip based on dataKey
    let displayLabel = "Calls";
    if (dataKey === "duration") {
      displayLabel = "Seconds";
    } else if (dataKey === "credits") {
      displayLabel = "Credits";
    }
    
    return (
      <div className="bg-card p-3 border border-border rounded shadow-md">
        <p className="font-semibold text-sm">{`Date: ${label}`}</p>
        <p className="text-purple text-sm">{`${displayLabel}: ${payload[0].value}`}</p>
      </div>
    );
  }

  return null;
};

const AnalyticsChart: React.FC<AnalyticsChartProps> = ({ 
  data, 
  isLoading = false,
  dataKey = 'count',
  color = '#9b87f5'
}) => {
  const isMobile = useIsMobile();
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[200px] md:h-[300px]">
        <div className="h-12 w-12 rounded-full border-4 border-t-transparent border-purple animate-spin"></div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex justify-center items-center h-[200px] md:h-[300px]">
        <p className="text-muted-foreground">No call data available to display</p>
      </div>
    );
  }
  
  // Determine chart title based on dataKey
  let chartTitle = "Daily Call Volume";
  if (dataKey === "duration") {
    chartTitle = "Call Duration (seconds)";
  } else if (dataKey === "credits") {
    chartTitle = "Credits Used";
  }

  return (
    <div className="w-full">
      <h2 className="text-lg md:text-xl font-bold mb-2">{chartTitle}</h2>
      <div className="h-[180px] md:h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ 
              top: 5, 
              right: isMobile ? 5 : 20, 
              left: 0, 
              bottom: isMobile ? 40 : 25 
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#444" vertical={false} />
            <XAxis 
              dataKey="date" 
              tick={{ fill: '#999', fontSize: isMobile ? 10 : 12 }}
              angle={-45}
              textAnchor="end"
              height={isMobile ? 50 : 35}
              tickMargin={8}
            />
            <YAxis 
              tick={{ fill: '#999', fontSize: isMobile ? 10 : 12 }}
              width={30}
              tickMargin={5}
            />
            <Tooltip content={(props) => <CustomTooltip {...props} dataKey={dataKey} />} />
            <Bar 
              dataKey={dataKey}
              name="Calls" 
              fill={color}
              radius={[4, 4, 0, 0]}
              maxBarSize={50}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AnalyticsChart;
