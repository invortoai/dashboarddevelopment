
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const EmptyState: React.FC = () => {
  return (
    <div className="text-center p-8">
      <p>No call history found.</p>
      <Link to="/dashboard">
        <Button className="mt-4">Make a Call</Button>
      </Link>
    </div>
  );
};

export default EmptyState;
