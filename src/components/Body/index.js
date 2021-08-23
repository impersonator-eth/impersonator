import React, { useState, useEffect } from "react";
import {
  Container,
  Input,
  FormControl,
  useColorMode,
  FormLabel,
  Button,
  Box,
  Avatar,
  Text,
  Link,
  VStack,
  Spacer,
  Select,
} from "@chakra-ui/react";
import WalletConnect from "@walletconnect/client";
import networkInfo from "./networkInfo";

function Body() {
  const { colorMode } = useColorMode();
  const bgColor = { light: "white", dark: "gray.700" };

  const [address, setAddress] = useState("");
  const [uri, setUri] = useState("");
  const [chainIdIndex, setChainIdIndex] = useState(0);
  const [connector, setConnector] = useState();
  const [peerMeta, setPeerMeta] = useState();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const session = getCachedSession();

    if (session) {
      let _connector = new WalletConnect({ session });

      if (_connector.peerMeta) {
        setConnector(_connector);
        setAddress(_connector.accounts[0]);
        setUri(_connector.uri);
        setPeerMeta(_connector.peerMeta);
        setIsConnected(true);

        const chainId = _connector.chainId.chainID;
        for (let i = 0; i < networkInfo.length; i++) {
          if (networkInfo[i].chainID == chainId) {
            setChainIdIndex(i);
            break;
          }
        }
      }
    }
  }, []);

  useEffect(() => {
    if (connector) {
      subscribeToEvents();
    }
  }, [connector]);

  const getCachedSession = () => {
    const local = localStorage ? localStorage.getItem("walletconnect") : null;

    let session = null;
    if (local) {
      try {
        session = JSON.parse(local);
      } catch (error) {
        throw error;
      }
    }
    return session;
  };

  const initWalletConnect = async () => {
    try {
      let _connector = new WalletConnect({ uri });

      if (!_connector.connected) {
        await _connector.createSession();
      }

      setConnector(_connector);
      setUri(_connector.uri);
    } catch (err) {
      throw err;
    }
  };

  const subscribeToEvents = () => {
    console.log("ACTION", "subscribeToEvents");

    if (connector) {
      connector.on("session_request", (error, payload) => {
        console.log("EVENT", "session_request");

        if (error) {
          throw error;
        }

        console.log("SESSION_REQUEST", payload.params);
        setPeerMeta(payload.params[0].peerMeta);
      });

      connector.on("session_update", (error) => {
        console.log("EVENT", "session_update");

        if (error) {
          throw error;
        }
      });

      connector.on("call_request", async (error, payload) => {
        console.log("EVENT", "call_request", "method", payload.method);
        console.log("EVENT", "call_request", "params", payload.params);

        // if (error) {
        //   throw error;
        // }

        // await getAppConfig().rpcEngine.router(payload, this.state, this.bindedSetState);
      });

      connector.on("connect", (error, payload) => {
        console.log("EVENT", "connect");

        if (error) {
          throw error;
        }

        // this.setState({ connected: true });
      });

      connector.on("disconnect", (error, payload) => {
        console.log("EVENT", "disconnect");

        if (error) {
          throw error;
        }

        // this.resetApp();
      });
    }
  };

  const approveSession = () => {
    console.log("ACTION", "approveSession");
    if (connector) {
      let chainId = networkInfo[chainIdIndex].chainID;
      if (!chainId) {
        chainId = 1; // default to ETH Mainnet if no network selected
      }
      connector.approveSession({ chainId, accounts: [address] });
      setIsConnected(true);
    }
  };

  const rejectSession = () => {
    console.log("ACTION", "rejectSession");
    if (connector) {
      connector.rejectSession();
      setPeerMeta(null);
    }
  };

  const killSession = () => {
    console.log("ACTION", "killSession");
    if (connector) {
      connector.killSession();

      setPeerMeta(null);
      setIsConnected(false);
    }
  };

  return (
    <Container my="16" minW={["0", "0", "2xl", "2xl"]}>
      <FormControl>
        <FormLabel>Enter Address to Impersonate</FormLabel>
        <Input
          placeholder="Address"
          aria-label="address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          bg={bgColor[colorMode]}
          isDisabled={isConnected}
        />
      </FormControl>
      <FormControl my={4}>
        <FormLabel>WalletConnect URI</FormLabel>
        <Input
          placeholder="wc:xyz123"
          aria-label="uri"
          value={uri}
          onChange={(e) => setUri(e.target.value)}
          bg={bgColor[colorMode]}
          isDisabled={isConnected}
        />
      </FormControl>
      <Select
        mb={4}
        placeholder="Select Network"
        variant="filled"
        _hover={{ cursor: "pointer" }}
        value={chainIdIndex}
        onChange={(e) => {
          setChainIdIndex(e.target.value);
        }}
        isDisabled={isConnected}
      >
        {networkInfo.map((network, i) => (
          <option value={i} key={i}>
            {network.name}
          </option>
        ))}
      </Select>
      <Button onClick={initWalletConnect} isDisabled={isConnected}>
        Connect
      </Button>
      {peerMeta && (
        <>
          <Box mt={4} fontSize={24} fontWeight="semibold">
            {isConnected ? "✅ Connected To:" : "⚠ Allow to Connect"}
          </Box>
          <VStack>
            <Avatar src={peerMeta.icons[0]} alt={peerMeta.name} />
            <Text fontWeight="bold">{peerMeta.name}</Text>
            <Text fontSize="sm">{peerMeta.description}</Text>
            <Link href={peerMeta.url} textDecor="underline">
              {peerMeta.url}
            </Link>
            {!isConnected && (
              <Box pt={6}>
                <Button onClick={approveSession} mr={10}>
                  Approve ✔
                </Button>
                <Button onClick={rejectSession}>Reject ❌</Button>
              </Box>
            )}
            {isConnected && (
              <Box pt={6}>
                <Button onClick={killSession}>Disconnect ☠</Button>
              </Box>
            )}
          </VStack>
        </>
      )}
    </Container>
  );
}

export default Body;
