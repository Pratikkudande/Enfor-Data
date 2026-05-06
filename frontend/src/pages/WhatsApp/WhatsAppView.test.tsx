import React from 'react';

// Simple test component to verify WhatsApp page loads
const WhatsAppTest: React.FC = () => {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">WhatsApp Marketing Module</h1>
      <p className="mt-4">If you can see this, the page is loading correctly.</p>
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
        <p className="text-blue-800">Test component loaded successfully!</p>
      </div>
    </div>
  );
};

export default WhatsAppTest;
