
import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { useIsMobile } from '@/hooks/use-mobile';

interface StatusData {
  date: string;
  answered: number;
  noAnswer: number;
  busy: number;
  failed: number;
  pending: number;
  [key: string]: any;
}

interface CallStatusChartProps {
  data: StatusData[];
  isLoading?: boolean;
}

const COLORS = {
  answered: '#22c55e',  // green
  noAnswer: '#f97316',  // orange
  busy: '#eab308',      // yellow
  failed: '#ef4444',    // red
  pending: '#6b7280'    // gray
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card p-3 border border-border rounded shadow-md">
        <p className="font-semibold text-sm">{`Date: ${label}`}</p>
        {payload.map((entry: any, index: number) => (
          <p key={`status-${index}`} style={{ color: entry.color }} className="text-sm">
            {`${entry.name}: ${entry.value}`}
          </p>
        ))}
      </div>
    );
  }

  return null;
};

const CallStatusChart: React.FC<CallStatusChartProps> = ({ 
  data, 
  isLoading = false
}) => {
  const isMobile = useIsMobile();
  
  // Transform data for proper rendering in chart
  const chartData = useMemo(() => {
    return data.map(day => ({
      ...day,
      answered: day.answered || 0,
      noAnswer: day.noAnswer || 0,
      busy: day.busy || 0,
      failed: day.failed || 0,
      pending: day.pending || 0
    }));
  }, [data]);
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-60 md:h-80">
        <div className="h-12 w-12 rounded-full border-4 border-t-transparent border-purple animate-spin"></div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex justify-center items-center h-60 md:h-80">
        <p className="text-muted-foreground">No call status data available to display</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <h2 className="text-lg md:text-xl font-bold mb-4">Call Status Distribution</h2>
      <div className="h-72 md:h-96 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ 
              top: 10, 
              right: isMobile ? 10 : 30, 
              left: 0, 
              bottom: isMobile ? 50 : 30 
            }}
            stackOffset="expand"
            barCategoryGap={8}
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
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Bar dataKey="answered" stackId="status" name="Answered" fill={COLORS.answered} radius={[0, 0, 0, 0]} />
            <Bar dataKey="noAnswer" stackId="status" name="No Answer" fill={COLORS.noAnswer} radius={[0, 0, 0, 0]} />
            <Bar dataKey="busy" stackId="status" name="Busy" fill={COLORS.busy} radius={[0, 0, 0, 0]} />
            <Bar dataKey="failed" stackId="status" name="Failed" fill={COLORS.failed} radius={[0, 0, 0, 0]} />
            <Bar dataKey="pending" stackId="status" name="Pending" fill={COLORS.pending} radius={[0, 0, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CallStatusChart;
