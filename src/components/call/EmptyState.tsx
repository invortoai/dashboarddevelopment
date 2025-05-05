
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PhoneCall } from 'lucide-react';

const EmptyState: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center space-y-4 border border-dashed border-muted rounded-lg bg-muted/5">
      <div className="bg-muted/20 p-4 rounded-full">
        <PhoneCall className="h-8 w-8 text-muted-foreground" />
      </div>
      <div>
        <h3 className="text-lg font-medium">No call history found</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Once you make calls, they will appear here.
        </p>
      </div>
      <Link to="/dashboard">
        <Button className="mt-4">Make a Call</Button>
      </Link>
    </div>
  );
};

export default EmptyState;
