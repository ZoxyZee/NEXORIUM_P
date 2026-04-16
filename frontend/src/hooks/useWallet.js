import { useState, useCallback } from 'react';
import { connectWalletAddress } from '@/lib/api';

const DEMO_WALLET_KEY = 'nexorium_demo_wallet';

export const WALLET_OPTIONS = [
  {
    id: 'metamask',
    name: 'MetaMask',
    description: 'Widely used browser wallet for Ethereum and Polygon',
    installUrl: 'https://metamask.io/download/',
  },
  {
    id: 'rabby',
    name: 'Rabby',
    description: 'Popular EVM wallet with clearer transaction previews',
    installUrl: 'https://rabby.io/',
  },
  {
    id: 'coinbase',
    name: 'Coinbase Wallet',
    description: 'Mainstream self-custody wallet with browser extension support',
    installUrl: 'https://www.coinbase.com/wallet/articles/getting-started-extension',
  },
  {
    id: 'phantom',
    name: 'Phantom',
    description: 'Popular multi-chain wallet with an EVM browser extension',
    installUrl: 'https://phantom.com/download',
  },
  {
    id: 'demo',
    name: 'Demo Wallet',
    description: 'Stable demo address for this session',
  },
];

function createWalletUnavailableError(wallet) {
  const error = new Error(`${wallet.name} is not installed in this browser`);
  error.code = 'WALLET_NOT_INSTALLED';
  error.walletId = wallet.id;
  error.installUrl = wallet.installUrl;
  return error;
}

function getEthereumProviders() {
  if (typeof window === 'undefined') return [];

  const providers = [];
  const injected = window.ethereum;
  if (injected?.providers?.length) {
    providers.push(...injected.providers);
  } else if (injected) {
    providers.push(injected);
  }

  const phantomEthereum = window.phantom?.ethereum;
  if (phantomEthereum && !providers.includes(phantomEthereum)) {
    providers.push(phantomEthereum);
  }

  return providers;
}

function getInjectedProvider(walletType) {
  const providers = getEthereumProviders();

  const matchers = {
    metamask: (provider) => provider?.isMetaMask,
    rabby: (provider) => provider?.isRabby,
    coinbase: (provider) => provider?.isCoinbaseWallet,
    phantom: (provider) => provider?.isPhantom || provider === window.phantom?.ethereum,
  };

  return providers.find(matchers[walletType]) || null;
}

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

      if (type === 'demo') {
        address = createDemoWallet();
      } else {
        const wallet = WALLET_OPTIONS.find((option) => option.id === type);
        const provider = getInjectedProvider(type);
        if (!provider) {
          throw createWalletUnavailableError(wallet || { id: type, name: 'Selected wallet' });
        }
        const accounts = await provider.request({ method: 'eth_requestAccounts' });
        address = accounts?.[0];
        if (!address) {
          throw new Error('No wallet account was selected');
        }
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
