import React from 'react';
import { MessageSquare } from 'lucide-react';

// Simplified WhatsApp View for debugging
const WhatsAppViewSimple: React.FC = () => {
  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center space-x-3 mb-6">
          <MessageSquare className="h-8 w-8 text-green-600" />
          <h1 className="text-3xl font-bold text-gray-900">WhatsApp Marketing</h1>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <div className="text-center">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <MessageSquare className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                WhatsApp Module Loading...
              </h2>
              <p className="text-gray-600">
                The WhatsApp Marketing module is initializing. Please wait a moment.
              </p>
            </div>
            
            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Debug Info:</strong> If you see this message, the component is loading correctly.
                The full module will load once the API connection is established.
              </p>
            </div>

            <div className="mt-6">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-900 mb-2">Troubleshooting Steps:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-yellow-800">
            <li>Check that the backend server is running on port 8080</li>
            <li>Open browser console (F12) to check for errors</li>
            <li>Verify you are logged in with a valid token</li>
            <li>Try refreshing the page</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppViewSimple;
