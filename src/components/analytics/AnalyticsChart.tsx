
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
      <Card>
        <CardContent className="p-4 md:p-6 flex justify-center items-center h-60 md:h-72">
          <div className="h-12 w-12 rounded-full border-4 border-t-transparent border-purple animate-spin"></div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent className="p-4 md:p-6 flex justify-center items-center h-60 md:h-72">
          <p className="text-muted-foreground">No call data available to display</p>
        </CardContent>
      </Card>
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
    <Card>
      <CardContent className="p-3 md:p-6">
        <h2 className="text-lg md:text-xl font-bold mb-4">{chartTitle}</h2>
        <div className="h-60 md:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ 
                top: 10, 
                right: isMobile ? 10 : 30, 
                left: 0, 
                bottom: isMobile ? 50 : 30 
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#444" vertical={false} />
              <XAxis 
                dataKey="date" 
                tick={{ fill: '#999', fontSize: isMobile ? 10 : 12 }}
                angle={-45}
                textAnchor="end"
                height={isMobile ? 60 : 40}
              />
              <YAxis tick={{ fill: '#999', fontSize: isMobile ? 10 : 12 }} />
              <Tooltip content={(props) => <CustomTooltip {...props} dataKey={dataKey} />} />
              <Bar 
                dataKey={dataKey}
                name="Calls" 
                fill={color}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default AnalyticsChart;
