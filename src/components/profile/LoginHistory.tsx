
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatTimeAgo } from '@/utils/dateUtils';
import { getUserLoginHistory } from '@/services/auth';
import { History } from 'lucide-react';

interface LoginHistoryProps {
  userId: string;
}

interface LoginRecord {
  timestamp: string;
  location?: string | null;
  ip_address?: string | null;
}

const LoginHistory: React.FC<LoginHistoryProps> = ({ userId }) => {
  const [history, setHistory] = useState<LoginRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLoginHistory = async () => {
      try {
        setIsLoading(true);
        const result = await getUserLoginHistory(userId);
        
        if (result.success && result.history) {
          setHistory(result.history);
        } else {
          setError(result.message);
        }
      } catch (err) {
        console.error('Error loading login history:', err);
        setError('Failed to load login history');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLoginHistory();
  }, [userId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-xl flex items-center">
            <History className="mr-2 h-5 w-5 text-muted-foreground" />
            Login History
          </CardTitle>
          <CardDescription>Your recent account login activities</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="h-8 w-8 rounded-full border-4 border-t-transparent border-purple-500 animate-spin"></div>
          </div>
        ) : error ? (
          <div className="text-center text-red-500 py-4">{error}</div>
        ) : history.length === 0 ? (
          <div className="text-center text-muted-foreground py-4">No login history available</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="hidden sm:table-cell">IP Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((record, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <div className="font-medium">{formatDate(record.timestamp)}</div>
                    <div className="text-xs text-muted-foreground">{formatTimeAgo(new Date(record.timestamp))}</div>
                  </TableCell>
                  <TableCell>{record.location || 'Unknown'}</TableCell>
                  <TableCell className="hidden sm:table-cell">{record.ip_address || 'Not recorded'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default LoginHistory;
