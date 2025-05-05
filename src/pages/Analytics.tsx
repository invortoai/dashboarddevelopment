
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AnalyticsChart from '@/components/analytics/AnalyticsChart';
import CallStatusChart from '@/components/analytics/CallStatusChart';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getCallVolumeAnalytics, getCallDurationAnalytics, getCreditsUsedAnalytics } from '@/services/call/analytics';
import { getCallStatusAnalytics } from '@/services/call/analytics';

const Analytics: React.FC = () => {
  const { user } = useAuth();
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d'>('7d');
  const [callVolumeData, setCallVolumeData] = useState<any[]>([]);
  const [callDurationData, setCallDurationData] = useState<any[]>([]);
  const [creditsUsedData, setCreditsUsedData] = useState<any[]>([]);
  const [callStatusData, setCallStatusData] = useState<any[]>([]);
  const [loading, setLoading] = useState({
    volume: true,
    duration: true,
    credits: true,
    status: true
  });
  
  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!user) return;
      
      const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
      
      // Fetch call volume analytics
      setLoading(prev => ({ ...prev, volume: true }));
      const volumeResult = await getCallVolumeAnalytics(user.id, days);
      if (volumeResult.success && volumeResult.data) {
        setCallVolumeData(volumeResult.data);
      }
      setLoading(prev => ({ ...prev, volume: false }));
      
      // Fetch call duration analytics
      setLoading(prev => ({ ...prev, duration: true }));
      const durationResult = await getCallDurationAnalytics(user.id, days);
      if (durationResult.success && durationResult.data) {
        setCallDurationData(durationResult.data);
      }
      setLoading(prev => ({ ...prev, duration: false }));
      
      // Fetch credits used analytics
      setLoading(prev => ({ ...prev, credits: true }));
      const creditsResult = await getCreditsUsedAnalytics(user.id, days);
      if (creditsResult.success && creditsResult.data) {
        setCreditsUsedData(creditsResult.data);
      }
      setLoading(prev => ({ ...prev, credits: false }));

      // Fetch call status analytics
      setLoading(prev => ({ ...prev, status: true }));
      const statusResult = await getCallStatusAnalytics(user.id, days);
      if (statusResult.success && statusResult.data) {
        setCallStatusData(statusResult.data);
      }
      setLoading(prev => ({ ...prev, status: false }));
    };
    
    fetchAnalytics();
  }, [user, timeframe]);
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Call Analytics</h1>
        
        {/* Time frame selector */}
        <div className="flex justify-end mb-4">
          <Tabs defaultValue="7d" value={timeframe} onValueChange={(value) => setTimeframe(value as any)}>
            <TabsList>
              <TabsTrigger value="7d">Last 7 Days</TabsTrigger>
              <TabsTrigger value="30d">Last 30 Days</TabsTrigger>
              <TabsTrigger value="90d">Last 90 Days</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        {/* Analytics Charts */}
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Call Volume</CardTitle>
            </CardHeader>
            <CardContent>
              <AnalyticsChart 
                data={callVolumeData} 
                isLoading={loading.volume} 
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Call Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <CallStatusChart 
                data={callStatusData} 
                isLoading={loading.status} 
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Call Duration</CardTitle>
            </CardHeader>
            <CardContent>
              <AnalyticsChart 
                data={callDurationData} 
                isLoading={loading.duration}
                dataKey="duration"
                color="#6366f1"
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Credits Used</CardTitle>
            </CardHeader>
            <CardContent>
              <AnalyticsChart 
                data={creditsUsedData} 
                isLoading={loading.credits}
                dataKey="credits"
                color="#f59e0b"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Analytics;
