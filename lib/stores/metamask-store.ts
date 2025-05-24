import { create } from "zustand";
import { BrowserProvider } from "ethers";

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
  evmProvider: BrowserProvider | null;
  walletAddress: string;
  connectMetaMask: () => Promise<void>;
  disconnectMetaMask: () => void;
}

declare global {
  interface Window {
    ethereum?: any;
  }
}

export const useMetaMaskStore = create<MetaMaskStore>((set) => ({
  metaMaskIsConnected: false,
  evmProvider: null,
  walletAddress: "",
  connectMetaMask: async () => {
    if (!window.ethereum) {
      alert("MetaMask is not installed. Please install MetaMask and try again.");
      return;
    }

    try {
      const provider = new BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();

      if (network.chainId !== BigInt("0x61")) { // Check for BSC Testnet
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [networkConfig],
        });
      }

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
})); 