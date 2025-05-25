import { create } from "zustand";
import { ethers } from "ethers";
import { persist } from "zustand/middleware";

// Network configuration for BNB Smart Chain Testnet
const networkConfig = {
  chainId: "0x61", // 97 in decimal
  chainName: "BNB Smart Chain Testnet",
  nativeCurrency: {
    name: "BNB",
    symbol: "tBNB",
    decimals: 18,
  },
  rpcUrls: ["https://data-seed-prebsc-1-s1.bnbchain.org:8545"],
  blockExplorerUrls: ["https://testnet.bscscan.com"],
};

interface MetaMaskStore {
  metaMaskIsConnected: boolean;
  evmProvider: ethers.providers.Web3Provider | null;
  walletAddress: string;
  connectMetaMask: () => Promise<void>;
  disconnectMetaMask: () => void;
  initializeMetaMask: () => Promise<void>;
}

declare global {
  interface Window {
    ethereum?: any;
  }
}

export const useMetaMaskStore = create<MetaMaskStore>()(
  persist(
    (set) => ({
      metaMaskIsConnected: false,
      evmProvider: null,
      walletAddress: "",

      initializeMetaMask: async () => {
        if (typeof window === 'undefined' || !window.ethereum) return;

        try {
          // Check if already connected
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = await provider.getSigner();
            const address = await signer.getAddress();

            set(() => ({
              evmProvider: provider,
              metaMaskIsConnected: true,
              walletAddress: address,
            }));
          }

          // Setup event listeners for account and chain changes
          window.ethereum.on('accountsChanged', async (accounts: string[]) => {
            if (accounts.length === 0) {
              set(() => ({
                metaMaskIsConnected: false,
                evmProvider: null,
                walletAddress: "",
              }));
            } else {
              const provider = new ethers.providers.Web3Provider(window.ethereum);
              const signer = await provider.getSigner();
              const address = await signer.getAddress();

              set(() => ({
                evmProvider: provider,
                metaMaskIsConnected: true,
                walletAddress: address,
              }));
            }
          });

          window.ethereum.on('chainChanged', () => {
            // Reload the page when chain changes
            window.location.reload();
          });

        } catch (error) {
          console.error("Error initializing MetaMask:", error);
        }
      },

      connectMetaMask: async () => {
        if (!window.ethereum) {
          alert("MetaMask is not installed. Please install MetaMask and try again.");
          return;
        }

        try {
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          const network = await provider.getNetwork();

          if (network.chainId !== 97) { // Check for BSC Testnet
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [networkConfig],
            });
          }

          // Request account access
          await window.ethereum.request({ method: 'eth_requestAccounts' });
          
          const signer = await provider.getSigner();
          const address = await signer.getAddress();
          console.log("Signer retrieved:", signer);

          set(() => ({
            evmProvider: provider,
            metaMaskIsConnected: true,
            walletAddress: address,
          }));
        } catch (error: any) {
          console.error("Error connecting to MetaMask:", error);

          if (error.code === 4001) {
            alert("Connection request was rejected.");
          } else {
            alert("Failed to connect to MetaMask. Check the console for details.");
          }
        }
      },

      disconnectMetaMask: () => {
        set(() => ({
          metaMaskIsConnected: false,
          evmProvider: null,
          walletAddress: "",
        }));
      },
    }),
    {
      name: 'metamask-storage', // unique name for the storage
      partialize: (state) => ({ 
        metaMaskIsConnected: state.metaMaskIsConnected,
        walletAddress: state.walletAddress,
      }), // only persist these fields
    }
  )
); 