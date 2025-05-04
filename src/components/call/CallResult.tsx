
import React, { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatToIST } from '@/utils/dateUtils';
import { useNavigate } from 'react-router-dom';
import { refreshUserCredits, recalculateUserCredits } from '@/services/userCredits';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';

interface CallResultProps {
  callDetails: {
    id: string;
    number: string;
    developer: string;
    project: string;
    callDuration?: number;
    creditsConsumed?: number;
    callTime?: string;
    summary?: string;
  };
  onReset: () => void;
}

const CallResult: React.FC<CallResultProps> = ({ callDetails, onReset }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refreshUserData, user } = useAuth();

  const handleViewDetails = () => {
    navigate(`/history/${callDetails.id}`);
  };

  // Ensure that credit balance is refreshed when call results are shown
  useEffect(() => {
    // When the call result is displayed with credits consumed,
    // make sure we refresh the user's credit balance
    const updateCredits = async () => {
      if (!user || !user.id) {
        console.log('Cannot refresh credits: No user logged in');
        return;
      }
      
      if (callDetails.creditsConsumed !== undefined && callDetails.creditsConsumed > 0) {
        try {
          console.log('Performing full credit recalculation after call completion');
          // First perform a full recalculation based on call history
          const recalcResult = await recalculateUserCredits(user.id);
          
          if (recalcResult.success) {
            // Then update the auth context
            await refreshUserData();
            console.log(`Credit balance recalculated: ${recalcResult.newBalance} credits remaining`);
            
            toast({
              title: 'Credits Recalculated',
              description: `${callDetails.creditsConsumed} credits were used for this call. Your balance has been recalculated to ${recalcResult.newBalance} credits.`,
            });
          } else {
            console.error('Failed to recalculate credit balance:', recalcResult.message);
            
            // Fall back to a simple refresh as a backup
            const refreshResult = await refreshUserCredits(user.id);
            if (refreshResult.success) {
              await refreshUserData();
              toast({
                title: 'Credits Updated',
                description: `${callDetails.creditsConsumed} credits were used for this call. Your new balance is ${refreshResult.credits} credits.`,
              });
            } else {
              // As a final fallback, just refresh user data
              await refreshUserData();
              toast({
                title: 'Credits Updated',
                description: `${callDetails.creditsConsumed} credits were used for this call.`,
              });
            }
          }
        } catch (error) {
          console.error('Error updating user credit balance:', error);
          // Still try to refresh user data even if there was an error
          await refreshUserData();
        }
      }
    };
    
    // Execute the credit update
    updateCredits();
  }, [callDetails.creditsConsumed, refreshUserData, user, toast, callDetails.id]);

  if (!callDetails.callDuration) return null;

  // Calculate credits consumed if not explicitly provided
  const creditsUsed = callDetails.creditsConsumed !== undefined && callDetails.creditsConsumed !== null 
    ? callDetails.creditsConsumed 
    : (callDetails.callDuration && callDetails.callDuration > 0 
        ? Math.max(10, Math.ceil(callDetails.callDuration / 60) * 10) 
        : 10);

  return (
    <Card className="mt-4 bg-card border-2 border-purple">
      <CardContent className="p-6">
        <div className="flex flex-col space-y-4">
          <div>
            <h3 className="text-xl font-bold text-purple">Call Completed</h3>
            <p className="text-muted-foreground">
              The call has been successfully completed and details are available
            </p>
          </div>

          <div className="space-y-2 p-4 bg-muted rounded-md border border-border">
            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm text-muted-foreground">Developer:</div>
              <div className="text-sm font-medium">{callDetails.developer}</div>
              
              <div className="text-sm text-muted-foreground">Phone Number:</div>
              <div className="text-sm font-medium">{callDetails.number}</div>
              
              <div className="text-sm text-muted-foreground">Project:</div>
              <div className="text-sm font-medium">{callDetails.project}</div>
              
              <div className="text-sm text-muted-foreground">Call Time:</div>
              <div className="text-sm font-medium">
                {callDetails.callTime ? formatToIST(callDetails.callTime) : 'Not available'}
              </div>
              
              <div className="text-sm text-muted-foreground">Duration:</div>
              <div className="text-sm font-medium">
                {callDetails.callDuration ? `${callDetails.callDuration} seconds` : 'Not available'}
              </div>
              
              <div className="text-sm text-muted-foreground">Credits Used:</div>
              <div className="text-sm font-medium">{creditsUsed}</div>
            </div>
          </div>

          {callDetails.summary && (
            <div className="p-4 bg-muted rounded-md border border-border">
              <h4 className="text-sm font-semibold mb-2">Call Summary:</h4>
              <p className="text-sm">{callDetails.summary}</p>
            </div>
          )}

          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={onReset}>
              New Call
            </Button>
            <Button onClick={handleViewDetails}>
              View Full Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CallResult;
