import "@rainbow-me/rainbowkit/styles.css";

import ReactDOM from "react-dom";
import App from "./App";
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
import { configureChains, createConfig, WagmiConfig } from "wagmi";
import { mainnet, optimism, base, arbitrum } from "wagmi/chains";
import { publicProvider } from "wagmi/providers/public";

import theme from "./theme";
import { SafeInjectProvider } from "./contexts/SafeInjectContext";

const { chains, publicClient } = configureChains(
  // the first chain is used by rainbowWallet to determine which chain to use
  [mainnet, optimism, base, arbitrum],
  [publicProvider()]
);

const projectId = process.env.REACT_APP_WC_PROJECT_ID!;
const connectors = connectorsForWallets([
  {
    groupName: "Recommended",
    wallets: [
      metaMaskWallet({ projectId, chains }),
      walletConnectWallet({ projectId, chains }),
      rainbowWallet({ projectId, chains }),
    ],
  },
]);

export const wagmiConfig = createConfig({
  autoConnect: false,
  connectors,
  publicClient,
});

ReactDOM.render(
  <ChakraProvider theme={theme}>
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider
        chains={chains}
        theme={darkTheme()}
        modalSize={"compact"}
      >
        <SafeInjectProvider>
          <App />
        </SafeInjectProvider>
      </RainbowKitProvider>
    </WagmiConfig>
  </ChakraProvider>,
  document.getElementById("root")
);
