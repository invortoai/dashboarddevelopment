
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from '@/components/ui/chart';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface DispositionData {
  name: string;
  value: number;
  color: string;
}

interface CallDispositionChartProps {
  data: DispositionData[];
  totalCalls: number;
  simplified?: boolean; // Add the simplified prop as optional
}

const CallDispositionChart: React.FC<CallDispositionChartProps> = ({ 
  data, 
  totalCalls,
  simplified = false // Default to false if not provided
}) => {
  if (data.length === 0) {
    return (
      <Card className={`col-span-12 ${!simplified ? 'md:col-span-6 shadow-sm h-[350px]' : ''}`}>
        <CardHeader>
          <CardTitle>Call Disposition Status</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-[250px]">
          <p className="text-muted-foreground">No data available</p>
        </CardContent>
      </Card>
    );
  }

  // For simplified view, don't wrap in a Card
  if (simplified) {
    return (
      <div className="h-full w-full">
        <ChartContainer
          config={{
            answered: { label: "Answered", color: "#22c55e" },
            "no answer": { label: "No Answer", color: "#f97316" },
            busy: { label: "Busy", color: "#eab308" },
            failed: { label: "Failed", color: "#ef4444" },
            pending: { label: "Pending", color: "#6b7280" },
          }}
          className="h-full w-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <ChartTooltip
                content={
                  <ChartTooltipContent />
                }
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    );
  }

  // Regular full view with Card wrapper
  return (
    <Card className="col-span-12 md:col-span-6 shadow-sm h-[350px]">
      <CardHeader>
        <CardTitle>Call Disposition Status</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center">
        <div className="h-[250px] w-full">
          <ChartContainer
            config={{
              answered: { label: "Answered", color: "#22c55e" },
              "no answer": { label: "No Answer", color: "#f97316" },
              busy: { label: "Busy", color: "#eab308" },
              failed: { label: "Failed", color: "#ef4444" },
              pending: { label: "Pending", color: "#6b7280" },
            }}
            className="h-full w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip
                  content={
                    <ChartTooltipContent />
                  }
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
        <div className="text-center text-sm text-muted-foreground mt-2">
          Based on {totalCalls} calls today
        </div>
      </CardContent>
    </Card>
  );
};

export default CallDispositionChart;
