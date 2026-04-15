import { useState, useCallback } from 'react';
import { connectWalletAddress } from '@/lib/api';

const DEMO_WALLET_KEY = 'nexorium_demo_wallet';

function createDemoWallet() {
  const existing = sessionStorage.getItem(DEMO_WALLET_KEY);
  if (existing) return existing;

  const address = '0x' + Array.from({ length: 40 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
  sessionStorage.setItem(DEMO_WALLET_KEY, address);
  return address;
}

export function useWallet() {
  const [account, setAccount] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [walletType, setWalletType] = useState(null);
  const [error, setError] = useState('');

  const linkWallet = useCallback(async (address) => {
    try {
      const result = await connectWalletAddress(address);
      if (result.walletAddress) {
        setAccount(result.walletAddress);
      }
      if (result.linked === false) {
        setError(result.message || 'A different wallet is already linked');
      }
      return result;
    } catch (err) {
      const message = err.response?.data?.detail || 'Wallet connected locally, but backend link failed';
      setError(message);
      return { linked: false, walletAddress: address, message };
    }
  }, []);

  const connectWallet = useCallback(async (type = 'metamask') => {
    setConnecting(true);
    setError('');

    try {
      let address;

      if (type === 'metamask') {
        if (!window.ethereum) {
          throw new Error('MetaMask is not available. Use Demo Wallet instead.');
        }
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        address = accounts?.[0];
        if (!address) {
          throw new Error('No wallet account was selected');
        }
      } else {
        address = createDemoWallet();
      }

      setAccount(address);
      setWalletType(type);
      const result = await linkWallet(address);
      if (result.linked === false) {
        throw new Error(result.message || 'Wallet could not be linked');
      }
      return address;
    } catch (err) {
      const message = err.message || 'Wallet connection failed';
      setError(message);
      throw err;
    } finally {
      setConnecting(false);
    }
  }, [linkWallet]);

  const disconnectWallet = useCallback(() => {
    setAccount(null);
    setWalletType(null);
    setError('');
  }, []);

  const shortenAddress = useCallback((addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  }, []);

  return { account, connecting, walletType, error, connectWallet, disconnectWallet, shortenAddress };
}
