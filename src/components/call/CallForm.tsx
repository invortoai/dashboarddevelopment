
import React, { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { validatePhoneNumber } from '@/utils/phoneUtils';
import { useAuth } from '@/context/AuthContext';
import { phone } from 'lucide-react';

interface CallFormProps {
  onCallInitiated: (callData: { number: string; developer: string; project: string }) => void;
}

const formSchema = z.object({
  phoneNumber: z.string().refine(validatePhoneNumber, {
    message: 'Phone number must be exactly 10 digits with no spaces or special characters',
  }),
  developer: z.string().min(1, {
    message: 'Developer name is required',
  }),
  project: z.string().min(1, {
    message: 'Project name is required',
  }),
});

type FormData = z.infer<typeof formSchema>;

const CallForm: React.FC<CallFormProps> = ({ onCallInitiated }) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phoneNumber: '',
      developer: '',
      project: '',
    },
  });

  const onSubmit = (data: FormData) => {
    setIsSubmitting(true);
    
    onCallInitiated({
      number: data.phoneNumber,
      developer: data.developer,
      project: data.project,
    });
  };

  const isInsufficientCredits = user && user.credit < 10;

  return (
    <Card className="bg-card">
      <CardContent className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">New Call</h2>
          <p className="text-muted-foreground">Fill in the details below to trigger a call</p>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="10-digit number without spaces" 
                      {...field} 
                      type="tel"
                      maxLength={10}
                      inputMode="numeric"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="developer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Developer Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter developer name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="project"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter project name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {isInsufficientCredits && (
              <div className="p-3 bg-destructive/10 border border-destructive rounded text-destructive text-sm">
                You don't have enough credits to make a call. Minimum 10 credits required.
              </div>
            )}
            
            <div className="flex justify-between items-center">
              <div className="text-sm">
                Available Credits: <span className="font-bold">{user?.credit || 0}</span>
              </div>
              <Button 
                type="submit" 
                className="bg-purple hover:bg-purple-dark gap-2"
                disabled={isSubmitting || isInsufficientCredits}
              >
                <phone size={18} />
                {isSubmitting ? 'Initiating Call...' : 'Trigger Call'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default CallForm;
