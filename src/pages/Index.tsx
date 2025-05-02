
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
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="max-w-3xl w-full text-center">
        <div className="mb-6">
          <Logo className="h-20 w-auto mx-auto" />
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">
          Call Nexus
        </h1>
        
        <p className="text-xl mb-8 text-muted-foreground max-w-2xl mx-auto">
          Connect with developers instantly and track all your communications in one place
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link to="/signup">
            <Button size="lg" className="w-full sm:w-auto bg-purple hover:bg-purple-dark">
              Get Started
            </Button>
          </Link>
          
          <Link to="/login">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              Login
            </Button>
          </Link>
        </div>
        
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
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
    <div className="bg-card/60 backdrop-blur-sm p-6 rounded-lg border border-white/10">
      <h3 className="text-xl font-bold mb-2 text-white">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
};

export default Index;
