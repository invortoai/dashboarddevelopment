
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { formatPhoneNumber } from '@/utils/phoneUtils';
import { formatToIST } from '@/utils/dateUtils';
import { CallDetails as CallDetailsType } from '@/types';
import { Headphones, FileText } from 'lucide-react';

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
    setShowTranscript(!showTranscript);
  };
  
  return (
    <div className="space-y-6">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Call Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <InfoItem label="Developer" value={callDetails.developer} />
              <InfoItem label="Phone Number" value={formatPhoneNumber(callDetails.number)} />
              <InfoItem 
                label="Call Date & Time" 
                value={
                  callDetails.createdAt ? formatToIST(callDetails.createdAt) :
                  callDetails.callTime ? formatToIST(callDetails.callTime) : '-'
                } 
              />
              {callDetails.callLogId && (
                <InfoItem label="Call Log ID" value={callDetails.callLogId} />
              )}
            </div>
            <div className="space-y-4">
              <InfoItem label="Project Name" value={callDetails.project} />
              <InfoItem 
                label="Call Status" 
                value={callDetails.callStatus || 'Pending'} 
              />
              <InfoItem 
                label="Call Duration" 
                value={callDetails.callDuration ? `${callDetails.callDuration} seconds` : '-'} 
              />
              <InfoItem 
                label="Credits Used" 
                value={String(callDetails.creditsConsumed ?? 0)} 
              />
            </div>
          </div>
          
          {(callDetails.callRecording || callDetails.transcript) && (
            <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t border-border">
              {callDetails.callRecording && (
                <Button onClick={handleRecordingClick} className="flex items-center gap-2">
                  <Headphones size={16} />
                  Listen to Recording
                </Button>
              )}
              
              {callDetails.transcript && (
                <Button 
                  variant={showTranscript ? "secondary" : "outline"} 
                  onClick={handleTranscriptClick}
                  className="flex items-center gap-2"
                >
                  <FileText size={16} />
                  {showTranscript ? "Hide Transcript" : "View Transcript"}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Transcript display with in-window behavior */}
      {showTranscript && callDetails.transcript && (
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl">Transcript</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setShowTranscript(false)}>
              Hide
            </Button>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-muted/50 rounded-md border border-border whitespace-pre-wrap max-h-96 overflow-auto">
              {callDetails.transcript}
            </div>
          </CardContent>
        </Card>
      )}
      
      {callDetails.summary && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Call Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-muted/50 rounded-md border border-border whitespace-pre-wrap">
              {callDetails.summary}
            </div>
          </CardContent>
        </Card>
      )}
      
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          {callDetails.feedback && (
            <div className="p-4 bg-muted/50 rounded-md border border-border mb-6 whitespace-pre-wrap max-h-60 overflow-auto">
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
                className="min-h-24 resize-none"
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

// Helper component for information items
const InfoItem = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-sm text-muted-foreground mb-1">{label}</p>
    <p className="font-medium">{value}</p>
  </div>
);

export default CallDetailsComponent;
