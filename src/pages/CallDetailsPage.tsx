import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import CallDetailsComponent from '@/components/call/CallDetails';
import { Button } from '@/components/ui/button';
import { getCallDetails, submitFeedback, viewRecording, viewTranscript, syncCallLogToCallDetails } from '@/services/callService';
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
        
        // Sync data from call_log to call_details before fetching
        await syncCallLogToCallDetails(id);
        
        const result = await getCallDetails(id, user.id);
        
        if (result.success && result.callDetails) {
          setCallDetails(result.callDetails);
        } else {
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
        const updatedResult = await getCallDetails(id, user.id);
        if (updatedResult.success && updatedResult.callDetails) {
          setCallDetails(updatedResult.callDetails);
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
                  await syncCallLogToCallDetails(id);
                  const result = await getCallDetails(id, user?.id || '');
                  if (result.success && result.callDetails) {
                    setCallDetails(result.callDetails);
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
