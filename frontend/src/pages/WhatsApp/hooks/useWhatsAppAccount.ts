import { useState, useEffect } from 'react';
import { whatsappApi, WhatsAppAccount } from '../../../services/whatsappApi';

export const useWhatsAppAccount = () => {
  const [account, setAccount] = useState<WhatsAppAccount | null>(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAccount = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await whatsappApi.getAccount();
      setAccount(response.account);
      setConnected(response.connected);
    } catch (err: any) {
      console.error('Failed to load WhatsApp account:', err);
      setError(err.message || 'Failed to load account');
      setConnected(false);
      setAccount(null);
    } finally {
      setLoading(false);
    }
  };

  const connectAccount = async (phoneNumber: string, displayName: string) => {
    try {
      setLoading(true);
      setError(null);
      await whatsappApi.connectAccount({ phone_number: phoneNumber, display_name: displayName });
      await loadAccount();
      return true;
    } catch (err: any) {
      console.error('Failed to connect account:', err);
      setError(err.message || 'Failed to connect account');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const disconnectAccount = async () => {
    try {
      setLoading(true);
      setError(null);
      await whatsappApi.disconnectAccount();
      setAccount(null);
      setConnected(false);
      return true;
    } catch (err: any) {
      console.error('Failed to disconnect account:', err);
      setError(err.message || 'Failed to disconnect account');
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccount();
  }, []);

  return {
    account,
    connected,
    loading,
    error,
    loadAccount,
    refreshAccount: loadAccount, // Alias for clarity
    connectAccount,
    disconnectAccount,
  };
};
