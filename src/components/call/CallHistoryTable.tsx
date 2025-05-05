
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CallDetails } from '@/types';
import { formatPhoneNumber } from '@/utils/phoneUtils';
import { formatToIST } from '@/utils/dateUtils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import CallStatusBadge from './CallStatusBadge';

interface CallHistoryTableProps {
  calls: CallDetails[];
}

const CallHistoryTable: React.FC<CallHistoryTableProps> = ({ calls }) => {
  return (
    <div className="w-full">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date & Time</TableHead>
            <TableHead>Developer</TableHead>
            <TableHead>Number</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {calls.map((call) => (
            <TableRow key={call.id} className="hover:bg-muted/50">
              <TableCell>
                {call.createdAt ? formatToIST(call.createdAt) : 
                call.callTime ? formatToIST(call.callTime) : '-'}
              </TableCell>
              <TableCell>{call.developer}</TableCell>
              <TableCell>{formatPhoneNumber(call.number)}</TableCell>
              <TableCell>
                {call.callDuration ? `${call.callDuration} seconds` : '-'}
              </TableCell>
              <TableCell>
                <CallStatusBadge call={call} />
              </TableCell>
              <TableCell>
                <Link to={`/history/${call.id}`}>
                  <Button variant="outline" size="sm">
                    Details
                  </Button>
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default CallHistoryTable;
