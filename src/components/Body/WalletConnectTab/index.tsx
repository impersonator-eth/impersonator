import { Center, Button } from "@chakra-ui/react";
import { IClientMeta } from "@walletconnect/legacy-types";
import { SessionTypes } from "@walletconnect/types";
import ConnectionDetails from "./ConnectionDetails";
import LegacyConnectionDetails from "./LegacyConnectionDetails";
import Loading from "./Loading";
import URIInput from "./URIInput";

interface WalletConnectTabParams {
  uri: string;
  setUri: (value: string) => void;
  bg: string;
  isConnected: boolean;
  initWalletConnect: () => void;
  loading: boolean;
  setLoading: (value: boolean) => void;
  reset: (persistUri?: boolean) => void;
  killSession: () => void;
  legacyPeerMeta: IClientMeta | undefined;
  web3WalletSession: SessionTypes.Struct | undefined;
}

function WalletConnectTab({
  uri,
  setUri,
  bg,
  isConnected,
  initWalletConnect,
  loading,
  setLoading,
  reset,
  legacyPeerMeta,
  killSession,
  web3WalletSession,
}: WalletConnectTabParams) {
  return (
    <>
      <URIInput
        uri={uri}
        setUri={setUri}
        bg={bg}
        isConnected={isConnected}
        initWalletConnect={initWalletConnect}
      />
      <Center>
        <Button onClick={() => initWalletConnect()} isDisabled={isConnected}>
          Connect
        </Button>
      </Center>
      {loading && (
        <Loading
          isConnected={isConnected}
          setLoading={setLoading}
          reset={reset}
        />
      )}
      {legacyPeerMeta && isConnected && (
        <LegacyConnectionDetails
          legacyPeerMeta={legacyPeerMeta}
          killSession={killSession}
        />
      )}
      {web3WalletSession && isConnected && (
        <ConnectionDetails
          web3WalletSession={web3WalletSession}
          killSession={killSession}
        />
      )}
    </>
  );
}

export default WalletConnectTab;
