import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { formatPhoneNumber } from '@/utils/phoneUtils';
import { formatToIST } from '@/utils/dateUtils';
import { CallDetails as CallDetailsType } from '@/types';

interface CallDetailsProps {
  callDetails: CallDetailsType;
  onFeedbackSubmit: (feedback: string) => Promise<void>;
  onRecordingView: () => Promise<void>;
  onTranscriptView: () => Promise<void>;
  isSubmittingFeedback: boolean;
}

const CallDetailsComponent: React.FC<CallDetailsProps> = ({
  callDetails,
  onFeedbackSubmit,
  onRecordingView,
  onTranscriptView,
  isSubmittingFeedback
}) => {
  const [feedback, setFeedback] = useState('');
  const [showTranscript, setShowTranscript] = useState(false);
  
  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (feedback.trim()) {
      await onFeedbackSubmit(feedback);
      setFeedback('');
    }
  };
  
  const handleRecordingClick = async () => {
    await onRecordingView();
    if (callDetails.callRecording) {
      window.open(callDetails.callRecording, '_blank');
    }
  };
  
  const handleTranscriptClick = async () => {
    await onTranscriptView();
    setShowTranscript(true);
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold mb-4">Call Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Developer Name</p>
              <p className="font-medium">{callDetails.developer}</p>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Phone Number</p>
              <p className="font-medium">{formatPhoneNumber(callDetails.number)}</p>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Project Name</p>
              <p className="font-medium">{callDetails.project}</p>
            </div>
            
            {callDetails.callTime && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Call Initiated At</p>
                <p className="font-medium">{formatToIST(callDetails.callTime)}</p>
              </div>
            )}
            
            {callDetails.callStatus && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Call Status</p>
                <p className="font-medium">{callDetails.callStatus}</p>
              </div>
            )}
            
            {callDetails.callDuration !== undefined && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Call Duration</p>
                <p className="font-medium">{callDetails.callDuration} seconds</p>
              </div>
            )}
            
            {/* Ensure credits are displayed even if they're 0 */}
            {callDetails.creditsConsumed !== undefined && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Credits Used</p>
                <p className="font-medium">{callDetails.creditsConsumed}</p>
              </div>
            )}
            
            {callDetails.callLogId && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Call Log ID</p>
                <p className="font-medium">{callDetails.callLogId}</p>
              </div>
            )}
          </div>
          
          <div className="flex flex-wrap gap-3 mt-6">
            {callDetails.callRecording && (
              <Button onClick={handleRecordingClick}>
                Listen to Recording
              </Button>
            )}
            
            {callDetails.transcript && (
              <Button variant="outline" onClick={handleTranscriptClick}>
                View Transcript
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      
      {callDetails.summary && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-xl font-bold mb-4">Call Summary</h3>
            <div className="p-4 bg-muted rounded border border-border whitespace-pre-wrap">
              {callDetails.summary}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Transcript display with in-window behavior */}
      {showTranscript && callDetails.transcript && (
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Transcript</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowTranscript(false)}>
                Close
              </Button>
            </div>
            <div className="p-4 bg-muted rounded border border-border whitespace-pre-wrap max-h-96 overflow-auto">
              {callDetails.transcript}
            </div>
          </CardContent>
        </Card>
      )}
      
      <Card>
        <CardContent className="p-6">
          <h3 className="text-xl font-bold mb-4">Feedback</h3>
          
          {callDetails.feedback && (
            <div className="p-4 bg-muted rounded border border-border mb-4 whitespace-pre-wrap max-h-60 overflow-auto">
              {callDetails.feedback}
            </div>
          )}
          
          <form onSubmit={handleSubmitFeedback}>
            <div className="space-y-3">
              <Textarea
                placeholder="Add your feedback here (max 1000 characters)"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                maxLength={1000}
                className="min-h-24"
              />
              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  {feedback.length}/1000 characters
                </div>
                <Button 
                  type="submit" 
                  disabled={!feedback.trim() || isSubmittingFeedback}
                >
                  {isSubmittingFeedback ? 'Sending...' : 'Send Feedback'}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CallDetailsComponent;
