
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { formatPhoneNumber } from '@/utils/phoneUtils';
import { formatToIST } from '@/utils/dateUtils';
import { CallDetails } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { CallStatusBadge } from './CallStatusBadge';
import { ExternalLink } from 'lucide-react';

interface CallTableProps {
  calls: CallDetails[];
}

const CallTable: React.FC<CallTableProps> = ({ calls }) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[180px]">Date & Time</TableHead>
          <TableHead>Developer</TableHead>
          <TableHead>Project</TableHead>
          <TableHead>Number</TableHead>
          <TableHead>Duration</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {calls.map((call) => (
          <TableRow key={call.id} className="hover:bg-muted/50">
            <TableCell className="font-medium">
              {call.createdAt ? formatToIST(call.createdAt) : 
               call.callTime ? formatToIST(call.callTime) : '-'}
            </TableCell>
            <TableCell>{call.developer || '-'}</TableCell>
            <TableCell>{call.project || '-'}</TableCell>
            <TableCell>{formatPhoneNumber(call.number)}</TableCell>
            <TableCell>
              {call.callDuration ? `${call.callDuration}s` : '-'}
            </TableCell>
            <TableCell>
              <CallStatusBadge call={call} />
            </TableCell>
            <TableCell className="text-right">
              <Link to={`/history/${call.id}`}>
                <Button variant="ghost" size="sm" className="h-8 gap-1">
                  Details
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default CallTable;
