
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

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
      displayLabel = "Minutes";
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
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex justify-center items-center h-72">
          <div className="h-12 w-12 rounded-full border-4 border-t-transparent border-purple animate-spin"></div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 flex justify-center items-center h-72">
          <p className="text-muted-foreground">No call data available to display</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-xl font-bold mb-4">Daily Call Volume</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#444" vertical={false} />
              <XAxis 
                dataKey="date" 
                tick={{ fill: '#999' }}
                angle={-45}
                textAnchor="end"
              />
              <YAxis tick={{ fill: '#999' }} />
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
