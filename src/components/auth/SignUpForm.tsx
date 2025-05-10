import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { getClientIP, getLocationFromIP } from '@/utils/authErrorLogger';

// Password regex patterns
const hasUppercase = /[A-Z]/;
const hasLowercase = /[a-z]/;
const hasNumber = /[0-9]/;
const hasSpecialChar = /[!@#$]/;

// Password strength calculation
const getPasswordStrength = (password: string): { score: number, label: string, color: string } => {
  if (!password) return { score: 0, label: '', color: 'bg-gray-300' };
  
  let score = 0;
  
  if (password.length >= 6) score += 1;
  if (password.length >= 10) score += 1;
  if (hasUppercase.test(password)) score += 1;
  if (hasLowercase.test(password)) score += 1;
  if (hasNumber.test(password)) score += 1;
  if (hasSpecialChar.test(password)) score += 1;
  
  if (score <= 2) return { score: Math.max(10, score * 20), label: 'Weak', color: 'bg-red-500' };
  if (score <= 4) return { score: Math.max(40, score * 20), label: 'Moderate', color: 'bg-yellow-500' };
  return { score: Math.max(70, score * 20), label: 'Strong', color: 'bg-green-500' };
};

const formSchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters',
  }),
  phoneNumber: z.string().regex(/^\d{10}$/, {
    message: 'Phone number must be exactly 10 digits with no spaces or special characters',
  }),
  password: z.string()
    .min(6, { message: 'Password must be at least 6 characters' })
    .regex(hasUppercase, { message: 'Password must contain at least one uppercase letter' })
    .regex(hasLowercase, { message: 'Password must contain at least one lowercase letter' })
    .regex(hasNumber, { message: 'Password must contain at least one number' })
    .regex(hasSpecialChar, { message: 'Password must contain at least one special character (!@#$)' }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof formSchema>;

const SignUpForm: React.FC = () => {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState<{ score: number, label: string, color: string }>({ score: 0, label: '', color: 'bg-gray-300' });
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [clientIP, setClientIP] = useState<string | null>(null);
  const [clientLocation, setClientLocation] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      phoneNumber: '',
      password: '',
      confirmPassword: '',
    },
    mode: 'onChange',
  });

  const watchPassword = form.watch('password');
  
  React.useEffect(() => {
    if (watchPassword) {
      setPasswordStrength(getPasswordStrength(watchPassword));
    } else {
      setPasswordStrength({ score: 0, label: '', color: 'bg-gray-300' });
    }
  }, [watchPassword]);

  // Fetch client IP on component mount
  React.useEffect(() => {
    const fetchClientDetails = async () => {
      try {
        const ip = await getClientIP();
        setClientIP(ip);
        
        if (ip && ip !== 'unknown') {
          const location = await getLocationFromIP(ip);
          setClientLocation(location);
          console.log(`Signup attempted from: ${location}`);
        }
      } catch (error) {
        console.error("Failed to fetch client details:", error);
      }
    };
    
    fetchClientDetails();
  }, []);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setSignupError(null);
    
    try {
      console.log("Attempting signup with phone:", data.phoneNumber);
      // Clean phone number of any spaces or special characters
      const cleanPhone = data.phoneNumber.replace(/\D/g, '');
      
      // Call signUp with correctly ordered parameters (name, phoneNumber, password, clientIP, clientLocation)
      await signUp(
        data.name,          // name
        cleanPhone,         // phoneNumber
        data.password,      // password  
        clientIP,           // clientIP
        clientLocation      // clientLocation
      );
      
      console.log("Signup successful for:", data.name);
      navigate('/analytics');
    } catch (error: any) {
      console.error('Sign up error details:', {
        message: error.message, 
        phoneNumber: data.phoneNumber.substring(0, 3) + '***' + data.phoneNumber.substring(7), // Log partial phone for debugging
        name: data.name
      });
      
      let errorMessage = error.message || "Could not create account";
      
      // Enhance error messages for common issues
      if (errorMessage.includes("exists")) {
        errorMessage = "A user with this phone number already exists. Please try logging in instead.";
      }
      
      setSignupError(errorMessage);
      toast({
        variant: "destructive",
        title: "Sign Up Failed",
        description: errorMessage
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
          <h2 className="text-2xl font-bold text-white">Create an account</h2>
          <p className="text-sm text-muted-foreground">
            Enter your information to get started
          </p>
        </div>
        
        {signupError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{signupError}</AlertDescription>
          </Alert>
        )}
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
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
                    <div className="relative">
                      <Input 
                        type={passwordVisible ? "text" : "password"} 
                        placeholder="Create a password" 
                        {...field}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                        onClick={() => setPasswordVisible(!passwordVisible)}
                      >
                        {passwordVisible ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </FormControl>
                  
                  {watchPassword && (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs">Password strength:</span>
                        <span className={`text-xs font-medium ${
                          passwordStrength.label === 'Weak' ? 'text-red-500' : 
                          passwordStrength.label === 'Moderate' ? 'text-yellow-500' : 
                          'text-green-500'
                        }`}>
                          {passwordStrength.label}
                        </span>
                      </div>
                      <Progress value={passwordStrength.score} className={`h-1 ${passwordStrength.color}`} />
                      
                      <div className="grid grid-cols-2 gap-1 text-xs mt-2">
                        <div className="flex items-center gap-1">
                          {hasUppercase.test(watchPassword) ? 
                            <CheckCircle2 className="h-3 w-3 text-green-500" /> : 
                            <XCircle className="h-3 w-3 text-red-500" />
                          }
                          <span>Uppercase</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {hasLowercase.test(watchPassword) ? 
                            <CheckCircle2 className="h-3 w-3 text-green-500" /> : 
                            <XCircle className="h-3 w-3 text-red-500" />
                          }
                          <span>Lowercase</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {hasNumber.test(watchPassword) ? 
                            <CheckCircle2 className="h-3 w-3 text-green-500" /> : 
                            <XCircle className="h-3 w-3 text-red-500" />
                          }
                          <span>Number</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {hasSpecialChar.test(watchPassword) ? 
                            <CheckCircle2 className="h-3 w-3 text-green-500" /> : 
                            <XCircle className="h-3 w-3 text-red-500" />
                          }
                          <span>Special (!@#$)</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {watchPassword.length >= 6 ? 
                            <CheckCircle2 className="h-3 w-3 text-green-500" /> : 
                            <XCircle className="h-3 w-3 text-red-500" />
                          }
                          <span>Min 6 chars</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input 
                      type={passwordVisible ? "text" : "password"} 
                      placeholder="Confirm your password" 
                      {...field} 
                    />
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
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>
        </Form>
        
        <div className="text-center text-sm">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-purple hover:text-purple-light">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignUpForm;
