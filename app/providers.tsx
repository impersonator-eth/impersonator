"use client";

import "@rainbow-me/rainbowkit/styles.css";

import { CacheProvider } from "@chakra-ui/next-js";
import { ChakraProvider } from "@chakra-ui/react";
import {
  connectorsForWallets,
  RainbowKitProvider,
  darkTheme,
} from "@rainbow-me/rainbowkit";
import {
  metaMaskWallet,
  walletConnectWallet,
  rainbowWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { http, createConfig, WagmiProvider } from "wagmi";
import { mainnet, optimism, base, arbitrum } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import theme from "@/style/theme";
import { SafeInjectProvider } from "@/contexts/SafeInjectContext";

const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID!;

const connectors = connectorsForWallets(
  [
    {
      groupName: "Recommended",
      wallets: [metaMaskWallet, walletConnectWallet, rainbowWallet],
    },
  ],
  {
    appName: "Impersonator",
    projectId,
  }
);

export const wagmiConfig = createConfig({
  chains: [mainnet, optimism, base, arbitrum],
  connectors,
  transports: {
    [mainnet.id]: http(),
    [optimism.id]: http(),
    [base.id]: http(),
    [arbitrum.id]: http(),
  },
  ssr: true,
});

const queryClient = new QueryClient();

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <CacheProvider>
      <ChakraProvider theme={theme}>
        <WagmiProvider config={wagmiConfig} reconnectOnMount={false}>
          <QueryClientProvider client={queryClient}>
            <RainbowKitProvider theme={darkTheme()} modalSize={"compact"}>
              <SafeInjectProvider>{children}</SafeInjectProvider>
            </RainbowKitProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </ChakraProvider>
    </CacheProvider>
  );
};
