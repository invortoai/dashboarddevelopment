
import React, { useState } from 'react';
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
import { Phone } from 'lucide-react';
import { validatePhoneNumber } from '@/utils/phoneUtils';

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
    }
  };

  return (
    <Card className="w-full shadow-md mb-6 bg-background">
      <CardHeader className="bg-muted/50 dark:bg-gray-800">
        <CardTitle className="text-xl flex items-center gap-2">
          <Phone className="h-5 w-5" />
          Initiate Call
        </CardTitle>
        <CardDescription>
          Enter the details below to initiate a new call
        </CardDescription>
      </CardHeader>
      
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
            {disabled ? 'Call in Progress...' : 'Trigger Call'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default CallForm;
