
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Phone, RefreshCw, AlertCircle } from 'lucide-react';
import { validatePhoneNumber } from '@/utils/phoneUtils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

export interface CallFormProps {
  onCallInitiated: (data: {
    number: string;
    developer: string;
    project: string;
  }) => void;
  disabled?: boolean;
}

const CallForm: React.FC<CallFormProps> = ({ onCallInitiated, disabled = false }) => {
  const [number, setNumber] = useState<string>('');
  const [developer, setDeveloper] = useState<string>('');
  const [project, setProject] = useState<string>('');
  const [errors, setErrors] = useState<{
    number?: string;
    developer?: string;
    project?: string;
  }>({});
  const [callStartTime, setCallStartTime] = useState<Date | null>(null);
  const [showRefreshButton, setShowRefreshButton] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (disabled && !showRefreshButton) {
      // If call is in progress, start a timer to show the refresh button after 1 minute
      if (!callStartTime) {
        setCallStartTime(new Date());
      }
      
      timer = setTimeout(() => {
        setShowRefreshButton(true);
      }, 60000); // 1 minute
    } else if (!disabled) {
      // If call is not in progress, reset the states
      setCallStartTime(null);
      setShowRefreshButton(false);
    }
    
    return () => clearTimeout(timer);
  }, [disabled, callStartTime, showRefreshButton]);

  const validateForm = (): boolean => {
    const newErrors: {
      number?: string;
      developer?: string;
      project?: string;
    } = {};
    
    if (!number.trim()) {
      newErrors.number = 'Phone number is required';
    } else if (!validatePhoneNumber(number)) {
      newErrors.number = 'Please enter a valid 10-digit phone number';
    }
    
    if (!developer.trim()) {
      newErrors.developer = 'Developer name is required';
    }
    
    if (!project.trim()) {
      newErrors.project = 'Project name is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onCallInitiated({
        number: number.trim(),
        developer: developer.trim(),
        project: project.trim(),
      });
      setCallStartTime(new Date());
    }
  };
  
  const handleRefreshCheck = async () => {
    try {
      const response = await fetch('https://n8n.srv743759.hstgr.cloud/webhook/4069d9c5-cbeb-43d8-a08b-3935ffd91f58', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          callId: 'check-status',
          timestamp: new Date().toISOString(),
        }),
      });
      
      toast({
        title: "Status Check Initiated",
        description: "Checking if your call has completed. Please refresh the page.",
      });
    } catch (error) {
      console.error('Error triggering refresh webhook:', error);
      toast({
        title: "Error",
        description: "Failed to check call status. Please try manually refreshing the page.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full shadow-md mb-6 bg-background">
      <CardHeader className="bg-muted/50 dark:bg-gray-800">
        <CardTitle className="text-xl flex items-center gap-2">
          <Phone className="h-5 w-5" />
          Initiate New Call
        </CardTitle>
        <CardDescription>
          Complete the form below to start a new call
        </CardDescription>
      </CardHeader>
      
      {showRefreshButton && disabled && (
        <div className="px-6 pt-4">
          <Alert variant="warning" className="bg-yellow-50 border-yellow-200">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertTitle className="text-yellow-600">Call may have completed</AlertTitle>
            <AlertDescription className="text-yellow-700">
              It's been over a minute since your call was initiated. Please wait for at least 1 minute after 
              the call has finished and then check if the call has completed.
              <div className="mt-2">
                <strong>Warning:</strong> Checking status while a call is still in progress may result in an error response.
              </div>
              <Button 
                onClick={handleRefreshCheck} 
                variant="outline" 
                className="mt-2 bg-white border-yellow-300 hover:bg-yellow-50"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Check Status
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4 pt-6 bg-background">
          <div className="space-y-2">
            <Label htmlFor="phone-number">Phone Number</Label>
            <Input
              id="phone-number"
              placeholder="Enter a 10-digit phone number"
              value={number}
              onChange={(e) => setNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
              maxLength={10}
              disabled={disabled}
              className={errors.number ? 'border-red-500' : ''}
            />
            {errors.number && (
              <p className="text-sm text-red-500">{errors.number}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="developer-name">Developer Name</Label>
            <Input
              id="developer-name"
              placeholder="Enter developer name"
              value={developer}
              onChange={(e) => setDeveloper(e.target.value)}
              disabled={disabled}
              className={errors.developer ? 'border-red-500' : ''}
            />
            {errors.developer && (
              <p className="text-sm text-red-500">{errors.developer}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="project-name">Project Name</Label>
            <Input
              id="project-name"
              placeholder="Enter project name"
              value={project}
              onChange={(e) => setProject(e.target.value)}
              disabled={disabled}
              className={errors.project ? 'border-red-500' : ''}
            />
            {errors.project && (
              <p className="text-sm text-red-500">{errors.project}</p>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="bg-background">
          <Button 
            type="submit" 
            className="w-full bg-purple-600 hover:bg-purple-700 text-white" 
            disabled={disabled}
          >
            {disabled ? 'Call in Progress...' : 'Start Call'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default CallForm;
