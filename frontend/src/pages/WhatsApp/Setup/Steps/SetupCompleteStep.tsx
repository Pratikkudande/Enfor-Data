import React from 'react';
import { CheckCircle, Send, Users, BarChart } from 'lucide-react';

interface SetupCompleteStepProps {
  onComplete: () => void;
}

const SetupCompleteStep: React.FC<SetupCompleteStepProps> = ({ onComplete }) => {
  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
        <CheckCircle className="h-12 w-12 text-green-600" />
      </div>

      <h2 className="text-3xl font-bold text-gray-900 mb-3">
        Setup Complete! 🎉
      </h2>
      <p className="text-lg text-gray-600 mb-8">
        Your WhatsApp Business Account is now connected and ready to use
      </p>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-blue-50 rounded-lg p-6">
          <Send className="h-8 w-8 text-blue-600 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-900 mb-2">Send Messages</h3>
          <p className="text-sm text-gray-600">
            Send individual WhatsApp messages to your clients instantly
          </p>
        </div>

        <div className="bg-purple-50 rounded-lg p-6">
          <Users className="h-8 w-8 text-purple-600 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-900 mb-2">Run Campaigns</h3>
          <p className="text-sm text-gray-600">
            Create and manage bulk messaging campaigns
          </p>
        </div>

        <div className="bg-green-50 rounded-lg p-6">
          <BarChart className="h-8 w-8 text-green-600 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-900 mb-2">Track Analytics</h3>
          <p className="text-sm text-gray-600">
            Monitor message delivery and engagement rates
          </p>
        </div>
      </div>

      {/* Quick Tips */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8 text-left">
        <h3 className="font-semibold text-gray-900 mb-3">Quick Tips:</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start">
            <span className="text-green-600 mr-2">✓</span>
            <span>Start with individual messages to test your setup</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-600 mr-2">✓</span>
            <span>Create message templates for common scenarios</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-600 mr-2">✓</span>
            <span>Monitor your message delivery rates in Analytics</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-600 mr-2">✓</span>
            <span>Keep your messages professional and relevant</span>
          </li>
        </ul>
      </div>

      {/* Limits Info */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8 text-left">
        <h3 className="font-semibold text-yellow-900 mb-2">Message Limits:</h3>
        <p className="text-sm text-yellow-800">
          <strong>Free Tier:</strong> 1,000 conversations per month<br />
          <strong>Rate Limit:</strong> 80 messages per second<br />
          <strong>Daily Limit:</strong> 1,000 messages (increases with quality rating)
        </p>
      </div>

      {/* Start Button */}
      <button
        onClick={onComplete}
        className="btn-primary px-8 py-4 text-lg font-semibold"
      >
        Start Sending Messages
      </button>

      <p className="text-sm text-gray-500 mt-4">
        You can always update your settings later
      </p>
    </div>
  );
};

export default SetupCompleteStep;
