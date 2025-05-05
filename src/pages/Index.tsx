
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Logo from '@/components/Logo';

const Index = () => {
  useEffect(() => {
    document.body.classList.add('animated-bg');
    return () => document.body.classList.remove('animated-bg');
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      <div className="max-w-3xl w-full text-center">
        <div className="mb-6">
          <Logo className="h-16 sm:h-20 w-auto mx-auto" />
        </div>
        
        <h1 className="text-2xl md:text-5xl font-bold mb-4 text-white">
          Invorto AI
        </h1>
        
        <p className="text-base md:text-xl mb-8 text-muted-foreground max-w-2xl mx-auto px-2">
          Connect with developers instantly and track all your communications in one place
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
          <Link to="/signup" className="w-full sm:w-auto">
            <Button size="lg" className="w-full bg-purple hover:bg-purple-dark">
              Get Started
            </Button>
          </Link>
          
          <Link to="/login" className="w-full sm:w-auto">
            <Button size="lg" variant="outline" className="w-full">
              Login
            </Button>
          </Link>
        </div>
        
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 px-2">
          <FeatureCard 
            title="Automated Calls" 
            description="Trigger calls to developers with just a few clicks" 
          />
          <FeatureCard 
            title="Call Analytics" 
            description="Track and analyze your calling patterns over time" 
          />
          <FeatureCard 
            title="Detailed Records" 
            description="Access call transcripts, recordings and summaries" 
          />
        </div>
      </div>
    </div>
  );
};

const FeatureCard = ({ title, description }: { title: string; description: string }) => {
  return (
    <div className="bg-card/60 backdrop-blur-sm p-4 sm:p-6 rounded-lg border border-white/10">
      <h3 className="text-lg sm:text-xl font-bold mb-2 text-white">{title}</h3>
      <p className="text-muted-foreground text-sm sm:text-base">{description}</p>
    </div>
  );
};

export default Index;
