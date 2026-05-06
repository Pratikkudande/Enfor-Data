import React, { useState } from 'react';
import { CheckCircle, Circle, AlertCircle } from 'lucide-react';
import BusinessSetupStep from './Steps/BusinessSetupStep';
import PhoneVerificationStep from './Steps/PhoneVerificationStep';
import MetaAPIConnectionStep from './Steps/MetaAPIConnectionStep';
import SetupCompleteStep from './Steps/SetupCompleteStep';

interface SetupWizardProps {
  onComplete: () => void;
}

type SetupStep = 'business' | 'verification' | 'meta_api' | 'complete';

const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState<SetupStep>('business');
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [businessData, setBusinessData] = useState<any>(null);

  const steps = [
    { id: 'business', label: 'Business Setup', description: 'Register your business' },
    { id: 'verification', label: 'Phone Verification', description: 'Verify your number' },
    { id: 'meta_api', label: 'Connect WhatsApp', description: 'Link Meta API' },
    { id: 'complete', label: 'Complete', description: 'Start messaging' },
  ];

  const handleStepComplete = (step: SetupStep, data?: any) => {
    setCompletedSteps(prev => new Set([...prev, step]));
    
    if (step === 'business') {
      setBusinessData(data);
      setCurrentStep('verification');
    } else if (step === 'verification') {
      setCurrentStep('meta_api');
    } else if (step === 'meta_api') {
      setCurrentStep('complete');
    } else if (step === 'complete') {
      onComplete();
    }
  };

  const getStepIcon = (stepId: string) => {
    if (completedSteps.has(stepId)) {
      return <CheckCircle className="h-6 w-6 text-green-600" />;
    } else if (currentStep === stepId) {
      return <Circle className="h-6 w-6 text-blue-600 fill-blue-600" />;
    } else {
      return <Circle className="h-6 w-6 text-gray-300" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            WhatsApp Business Setup
          </h1>
          <p className="text-gray-600">
            Complete these steps to start sending WhatsApp messages to your clients
          </p>
        </div>

        {/* Progress Steps */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center flex-1">
                  <div className="flex items-center justify-center mb-2">
                    {getStepIcon(step.id)}
                  </div>
                  <div className="text-center">
                    <p className={`text-sm font-medium ${
                      currentStep === step.id ? 'text-blue-600' : 
                      completedSteps.has(step.id) ? 'text-green-600' : 
                      'text-gray-400'
                    }`}>
                      {step.label}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{step.description}</p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-4 ${
                    completedSteps.has(step.id) ? 'bg-green-600' : 'bg-gray-200'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          {currentStep === 'business' && (
            <BusinessSetupStep onComplete={(data) => handleStepComplete('business', data)} />
          )}
          {currentStep === 'verification' && (
            <PhoneVerificationStep 
              phoneNumber={businessData?.phone_number}
              onComplete={() => handleStepComplete('verification')} 
            />
          )}
          {currentStep === 'meta_api' && (
            <MetaAPIConnectionStep onComplete={() => handleStepComplete('meta_api')} />
          )}
          {currentStep === 'complete' && (
            <SetupCompleteStep onComplete={() => handleStepComplete('complete')} />
          )}
        </div>

        {/* Help Section */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-blue-900 mb-1">Need Help?</h3>
              <p className="text-sm text-blue-700">
                Follow our step-by-step guide to get your Meta WhatsApp credentials. 
                <a href="#" className="underline ml-1">View Documentation</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetupWizard;
