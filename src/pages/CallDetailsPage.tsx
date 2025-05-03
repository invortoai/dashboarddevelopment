
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import CallDetailsComponent from '@/components/call/CallDetails';
import { Button } from '@/components/ui/button';
import { getCallLogData, submitFeedback, viewRecording, viewTranscript } from '@/services/callService';
import { getCallStatusFromDetails } from '@/services/call/callStatus';
import { useAuth } from '@/context/AuthContext';
import { CallDetails } from '@/types';
import { useToast } from '@/hooks/use-toast';

const CallDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [callDetails, setCallDetails] = useState<CallDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submittingFeedback, setSubmittingFeedback] = useState<boolean>(false);
  
  useEffect(() => {
    const fetchCallDetails = async () => {
      if (!user || !id) return;
      
      try {
        setLoading(true);
        console.log('Fetching call details for ID:', id);
        
        // Get status directly from call_details table
        const statusResult = await getCallStatusFromDetails(id);
        console.log('Status result from call_details:', statusResult);
        
        // Get data from call_log
        const result = await getCallLogData(id);
        
        if (result.success && result.callData) {
          console.log('Call log data fetched:', result.callData);
          
          // Combine data, with call_details status data taking precedence
          const combinedData = {
            ...result.callData,
            ...(statusResult.success && statusResult.callData ? statusResult.callData : {})
          };
          
          console.log('Combined call details:', combinedData);
          setCallDetails(combinedData);
        } else {
          console.error('Failed to fetch call log data:', result.message);
          toast({
            title: "Error",
            description: result.message,
            variant: "destructive",
          });
          navigate('/history');
        }
      } catch (error) {
        console.error('Error fetching call details:', error);
        toast({
          title: "Error",
          description: "Failed to load call details. Redirecting to call history.",
          variant: "destructive",
        });
        navigate('/history');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCallDetails();
    
    // Set up a polling interval to check for updates
    const intervalId = setInterval(() => {
      if (id && user) {
        console.log('Polling for call details updates');
        fetchCallDetails();
      }
    }, 30000); // Poll every 30 seconds
    
    return () => clearInterval(intervalId);
  }, [id, user, navigate, toast]);
  
  const handleFeedbackSubmit = async (feedback: string) => {
    if (!user || !id || !feedback.trim()) return;
    
    try {
      setSubmittingFeedback(true);
      const result = await submitFeedback(user.id, id, feedback);
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Feedback submitted successfully.",
        });
        
        // Refresh call details to get the updated feedback
        const updatedResult = await getCallLogData(id);
        if (updatedResult.success && updatedResult.callData) {
          setCallDetails(updatedResult.callData);
        }
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setSubmittingFeedback(false);
    }
  };
  
  const handleRecordingView = async () => {
    if (!user || !id) return;
    
    try {
      await viewRecording(user.id, id);
    } catch (error) {
      console.error('Error recording view activity:', error);
    }
  };
  
  const handleTranscriptView = async () => {
    if (!user || !id) return;
    
    try {
      await viewTranscript(user.id, id);
      
      // Show the transcript view
      document.querySelector('.transcript-view')?.classList.remove('hidden');
    } catch (error) {
      console.error('Error recording transcript view activity:', error);
    }
  };
  
  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-full">
          <div className="h-12 w-12 rounded-full border-4 border-t-transparent border-purple animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }
  
  if (!callDetails) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-full">
          <p className="text-lg text-muted-foreground mb-4">Call details not found</p>
          <Button onClick={() => navigate('/history')}>
            Back to Call History
          </Button>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Call Details</h1>
          <div className="flex gap-2">
            {id && (
              <Button variant="secondary" onClick={async () => {
                if (id) {
                  setLoading(true);
                  const result = await getCallLogData(id);
                  if (result.success && result.callData) {
                    setCallDetails(result.callData);
                    toast({
                      title: "Success",
                      description: "Call data refreshed successfully.",
                    });
                  }
                  setLoading(false);
                }
              }}>
                Refresh Data
              </Button>
            )}
            <Button variant="outline" onClick={() => navigate('/history')}>
              Back to Call History
            </Button>
          </div>
        </div>
        
        <CallDetailsComponent
          callDetails={callDetails}
          onFeedbackSubmit={handleFeedbackSubmit}
          onRecordingView={handleRecordingView}
          onTranscriptView={handleTranscriptView}
          isSubmittingFeedback={submittingFeedback}
        />
      </div>
    </DashboardLayout>
  );
};

export default CallDetailsPage;
