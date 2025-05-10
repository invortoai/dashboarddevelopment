import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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
import { AlertTriangle, Info } from 'lucide-react';
import { 
  getClientIP, 
  getLocationFromIP,
  checkRateLimit
} from '@/utils/authErrorLogger';
import { supabase } from '@/services/supabaseClient';

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
  const { signIn, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [clientIP, setClientIP] = useState<string | null>(null);
  const [clientLocation, setClientLocation] = useState<string | null>(null);
  const [rateLimited, setRateLimited] = useState<{limited: boolean, remainingSeconds: number}>({
    limited: false,
    remainingSeconds: 0
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/analytics';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  // Fetch client IP on component mount
  useEffect(() => {
    const fetchClientDetails = async () => {
      try {
        const ip = await getClientIP();
        setClientIP(ip);
        
        if (ip && ip !== 'unknown') {
          const location = await getLocationFromIP(ip);
          setClientLocation(location);
          console.log(`Login attempted from: ${location}`);
        }
      } catch (error) {
        console.error("Failed to fetch client details:", error);
      }
    };
    
    fetchClientDetails();
  }, []);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phoneNumber: '',
      password: '',
    },
  });

  // Create countdown timer for rate limiting
  useEffect(() => {
    if (!rateLimited.limited || rateLimited.remainingSeconds <= 0) return;
    
    const timer = setInterval(() => {
      setRateLimited(prev => ({
        ...prev,
        remainingSeconds: prev.remainingSeconds - 1
      }));
    }, 1000);
    
    return () => clearInterval(timer);
  }, [rateLimited.limited, rateLimited.remainingSeconds]);

  // Check server-side rate limiting before submission
  const checkServerRateLimit = async (phone: string): Promise<boolean> => {
    try {
      // Instead of using the RPC function directly, we'll query the auth_error_logs table
      const { data, error } = await supabase
        .from('auth_error_logs')
        .select('attempt_time')
        .eq('phone_number', phone)
        .eq('attempt_type', 'login')
        .gte('attempt_time', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // Last hour
        .order('attempt_time', { ascending: false });
      
      if (error) {
        console.error("Error checking rate limit:", error);
        return false;
      }
      
      // If there are 5 or more failed attempts in the last hour, rate limit
      if (data && data.length >= 5) {
        setRateLimited({
          limited: true,
          remainingSeconds: 3600 // 1 hour in seconds
        });
        return true;
      }
      
      return false;
    } catch (err) {
      console.error("Failed to check server-side rate limiting:", err);
      return false;
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setLoginError(null); // Reset any previous errors
    
    try {
      // Clean phone number of any spaces or special characters
      const cleanPhone = data.phoneNumber.replace(/\D/g, '');
      
      // Check if this phone number has been rate limited on server
      const isRateLimited = await checkServerRateLimit(cleanPhone);
      if (isRateLimited) {
        setLoginError(`Too many failed attempts. Please try again later.`);
        setIsSubmitting(false);
        return;
      }
      
      // Security enhancement: Log login location
      console.log(`Login attempt from ${clientLocation || 'unknown location'}`);
      
      await signIn(cleanPhone, data.password, clientIP, clientLocation);
      
      // If we get here, login was successful
      console.log("Login successful");
      const from = location.state?.from?.pathname || '/analytics';
      navigate(from, { replace: true });
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
        
        {rateLimited.limited && (
          <Alert variant="warning" className="bg-yellow-100 border-yellow-300">
            <Info className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-700">
              Account temporarily locked for security. Try again in {rateLimited.remainingSeconds} seconds.
            </AlertDescription>
          </Alert>
        )}
        
        {clientLocation && (
          <div className="text-center text-sm text-muted-foreground">
            <p>Signing in from {clientLocation}</p>
          </div>
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
                      disabled={rateLimited.limited}
                      onChange={(e) => {
                        // Only allow numbers
                        const value = e.target.value.replace(/\D/g, '');
                        field.onChange(value);
                      }}
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
                    <Input 
                      type="password" 
                      placeholder="Enter your password" 
                      {...field} 
                      disabled={rateLimited.limited}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              className="w-full bg-purple hover:bg-purple-dark" 
              disabled={isSubmitting || rateLimited.limited}
            >
              {isSubmitting ? 'Logging in...' : rateLimited.limited ? `Try again in ${rateLimited.remainingSeconds}s` : 'Login'}
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
