import React, { useState, useEffect } from 'react';
import { Shield, RefreshCw, CheckCircle } from 'lucide-react';
import { api } from '../../../../services/apiClient';

interface PhoneVerificationStepProps {
  phoneNumber: string;
  onComplete: () => void;
}

const PhoneVerificationStep: React.FC<PhoneVerificationStepProps> = ({ phoneNumber, onComplete }) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    // Auto-request code on mount
    requestCode();
  }, []);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const requestCode = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response: any = await api.post('/whatsapp/setup/request-verification');
      
      if (response.data?.code) {
        setVerificationCode(response.data.code);
        setCodeSent(true);
        setResendCooldown(60); // 60 seconds cooldown
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value[0];
    }

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }

    // Auto-submit when all 6 digits entered
    if (newCode.every(digit => digit !== '') && newCode.join('').length === 6) {
      handleVerify(newCode.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerify = async (codeToVerify?: string) => {
    const verifyCode = codeToVerify || code.join('');
    
    if (verifyCode.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post('/whatsapp/setup/verify-phone', { code: verifyCode });
      onComplete();
    } catch (err: any) {
      setError(err.message || 'Invalid verification code');
      setCode(['', '', '', '', '', '']);
      document.getElementById('code-0')?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    if (resendCooldown === 0) {
      setCode(['', '', '', '', '', '']);
      setError('');
      requestCode();
    }
  };

  return (
    <div>
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <Shield className="h-8 w-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify Your Phone Number</h2>
        <p className="text-gray-600">
          We've sent a 6-digit verification code to
        </p>
        <p className="text-lg font-semibold text-gray-900 mt-1">{phoneNumber}</p>
      </div>

      {/* Development: Show code */}
      {verificationCode && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>Development Mode:</strong> Your verification code is <strong className="text-lg">{verificationCode}</strong>
          </p>
          <p className="text-xs text-yellow-700 mt-1">
            In production, this will be sent via SMS/WhatsApp
          </p>
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {codeSent && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
          <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
          <p className="text-green-800 text-sm">Verification code sent successfully!</p>
        </div>
      )}

      {/* Code Input */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-4 text-center">
          Enter Verification Code
        </label>
        <div className="flex justify-center gap-3">
          {code.map((digit, index) => (
            <input
              key={index}
              id={`code-${index}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleCodeChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            />
          ))}
        </div>
      </div>

      {/* Resend Code */}
      <div className="text-center mb-8">
        <p className="text-sm text-gray-600 mb-2">Didn't receive the code?</p>
        <button
          onClick={handleResend}
          disabled={resendCooldown > 0 || loading}
          className="text-blue-600 hover:text-blue-700 font-medium text-sm disabled:text-gray-400 disabled:cursor-not-allowed flex items-center justify-center mx-auto"
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
        </button>
      </div>

      {/* Verify Button */}
      <div className="flex justify-center">
        <button
          onClick={() => handleVerify()}
          disabled={loading || code.some(digit => !digit)}
          className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Verifying...
            </>
          ) : (
            'Verify Phone Number'
          )}
        </button>
      </div>

      <p className="text-xs text-gray-500 text-center mt-6">
        Code expires in 10 minutes
      </p>
    </div>
  );
};

export default PhoneVerificationStep;
