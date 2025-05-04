
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { validatePhoneNumber } from '@/utils/phoneUtils';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

const formSchema = z.object({
  phoneNumber: z.string().refine(validatePhoneNumber, {
    message: 'Phone number must be exactly 10 digits with no spaces or special characters',
  }),
  password: z.string().min(1, {
    message: 'Password is required',
  }),
});

type FormData = z.infer<typeof formSchema>;

const LoginForm = () => {
  const { signIn } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const navigate = useNavigate();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phoneNumber: '',
      password: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setLoginError(null); // Reset any previous errors
    try {
      console.log("Attempting login with phone:", data.phoneNumber);
      // Clean phone number of any spaces or special characters
      const cleanPhone = data.phoneNumber.replace(/\D/g, '');
      await signIn(cleanPhone, data.password);
      
      // If successful, navigate to analytics (the app's default page)
      toast({
        title: "Login Successful",
        description: "Welcome back!",
      });
      navigate('/analytics');
    } catch (error: any) {
      console.error("Login failed:", error);
      setLoginError(error.message || "Could not log in with these credentials");
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message || "Could not log in with these credentials"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 animated-bg">
      <div className="w-full max-w-md space-y-6 rounded-lg bg-card p-6 shadow-lg">
        <div className="flex flex-col items-center space-y-2">
          <h1 className="text-3xl font-bold text-white">INVORTO AI</h1>
          <h2 className="text-2xl font-bold text-white">Welcome back</h2>
          <p className="text-sm text-muted-foreground">
            Login to your account
          </p>
        </div>
        
        {loginError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{loginError}</AlertDescription>
          </Alert>
        )}
        
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
                      placeholder="Enter your phone number" 
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
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Enter your password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              className="w-full bg-purple hover:bg-purple-dark" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Logging in...' : 'Login'}
            </Button>
          </form>
        </Form>
        
        <div className="text-center text-sm">
          Don't have an account?{' '}
          <Link to="/signup" className="font-medium text-purple hover:text-purple-light">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
