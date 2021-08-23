import React, { useState, useEffect } from "react";
import {
  Container,
  InputGroup,
  Input,
  InputRightElement,
  FormControl,
  useColorMode,
  FormLabel,
  Button,
  Box,
  Avatar,
  Text,
  Link,
  VStack,
  Select,
  useToast,
  CircularProgress,
  Center,
} from "@chakra-ui/react";
import WalletConnect from "@walletconnect/client";
import { ethers } from "ethers";
import networkInfo from "./networkInfo";

function Body() {
  const { colorMode } = useColorMode();
  const bgColor = { light: "white", dark: "gray.700" };
  const toast = useToast();

  const [provider, setProvider] = useState();
  const [showAddress, setShowAddress] = useState(""); // gets displayed in input. ENS name remains as it is
  const [address, setAddress] = useState(""); // internal resolved address
  const [isAddressValid, setIsAddressValid] = useState(true);
  const [uri, setUri] = useState("");
  const [networkIndex, setNetworkIndex] = useState(0);
  const [connector, setConnector] = useState();
  const [peerMeta, setPeerMeta] = useState();
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const session = getCachedSession();
    if (session) {
      let _connector = new WalletConnect({ session });

      if (_connector.peerMeta) {
        try {
          setConnector(_connector);
          setAddress(_connector.accounts[0]);
          setUri(_connector.uri);
          setPeerMeta(_connector.peerMeta);
          setIsConnected(true);

          const chainId = _connector.chainId.chainID;
          for (let i = 0; i < networkInfo.length; i++) {
            if (getChainId(i) === chainId) {
              setNetworkIndex(i);
              break;
            }
          }
        } catch {
          console.log("Corrupt old session. Starting fresh");
          localStorage.removeItem("walletconnect");
        }
      }
    }

    setProvider(
      new ethers.providers.JsonRpcProvider(process.env.REACT_APP_PROVIDER_URL)
    );
  }, []);

  useEffect(() => {
    if (connector) {
      subscribeToEvents();
    }
  }, [connector]);

  const resolveAndValidateAddress = async () => {
    let isValid;
    let _address = address;
    if (!address) {
      isValid = false;
    } else {
      // Resolve ENS
      const resolvedAddress = await provider.resolveName(address);
      if (resolvedAddress) {
        setAddress(resolvedAddress);
        _address = resolvedAddress;
        isValid = true;
      } else if (ethers.utils.isAddress(address)) {
        isValid = true;
      } else {
        isValid = false;
      }
    }

    setIsAddressValid(isValid);
    if (!isValid) {
      toast({
        title: "Invalid Address",
        description: "Address is not an ENS or Ethereum address",
        status: "error",
        isClosable: true,
        duration: 4000,
      });
    }

    return { isValid, _address: _address };
  };

  const getChainId = (networkIndex) => {
    return networkInfo[networkIndex].chainID;
  };

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
    setLoading(true);
    const { isValid } = await resolveAndValidateAddress();

    if (isValid) {
      try {
        let _connector = new WalletConnect({ uri });

        if (!_connector.connected) {
          await _connector.createSession();
        }

        setConnector(_connector);
        setUri(_connector.uri);
      } catch (err) {
        console.error(err);
        toast({
          title: "Couldn't Connect",
          description: "Refresh DApp and Connect again",
          status: "error",
          isClosable: true,
          duration: 2000,
        });
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  };

  const subscribeToEvents = () => {
    console.log("ACTION", "subscribeToEvents");

    if (connector) {
      connector.on("session_request", (error, payload) => {
        if (loading) {
          setLoading(false);
        }
        console.log("EVENT", "session_request");

        if (error) {
          throw error;
        }

        console.log("SESSION_REQUEST", payload.params);
        setPeerMeta(payload.params[0].peerMeta);
      });

      connector.on("session_update", (error) => {
        console.log("EVENT", "session_update");
        setLoading(false);

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

        reset();
      });
    }
  };

  const approveSession = () => {
    console.log("ACTION", "approveSession");
    if (connector) {
      let chainId = getChainId(networkIndex);
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

  const updateSession = ({ newChainId, newAddress }) => {
    let _chainId = newChainId || getChainId(networkIndex);
    let _address = newAddress || address;

    if (connector && connector.connected) {
      connector.updateSession({
        chainId: _chainId,
        accounts: [_address],
      });
    } else {
      setLoading(false);
    }
  };

  const updateAddress = async () => {
    setLoading(true);
    const { isValid, _address } = await resolveAndValidateAddress();

    if (isValid) {
      updateSession({ newAddress: _address });
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

  const reset = () => {
    setPeerMeta(null);
    setIsConnected(false);
    localStorage.removeItem("walletconnect");
  };

  return (
    <Container my="16" minW={["0", "0", "2xl", "2xl"]}>
      <FormControl>
        <FormLabel>Enter Address or ENS to Impersonate</FormLabel>
        <InputGroup>
          <Input
            placeholder="Address"
            aria-label="address"
            autoComplete="off"
            value={showAddress}
            onChange={(e) => {
              const _showAddress = e.target.value;
              setShowAddress(_showAddress);
              setAddress(_showAddress);
              setIsAddressValid(true); // remove inValid warning when user types again
            }}
            bg={bgColor[colorMode]}
            isInvalid={!isAddressValid}
          />
          {isConnected && (
            <InputRightElement width="4.5rem" mr="1rem">
              <Button h="1.75rem" size="sm" onClick={updateAddress}>
                Update
              </Button>
            </InputRightElement>
          )}
        </InputGroup>
      </FormControl>
      <FormControl my={4}>
        <FormLabel>WalletConnect URI</FormLabel>
        <Input
          placeholder="wc:xyz123"
          aria-label="uri"
          autoComplete="off"
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
        value={networkIndex}
        onChange={(e) => {
          const _networkIndex = e.target.value;
          setNetworkIndex(_networkIndex);
          updateSession({ newChainId: getChainId(_networkIndex) });
        }}
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
      {loading && (
        <Center>
          <VStack>
            <Box>
              <CircularProgress isIndeterminate />
            </Box>
            {!isConnected && (
              <Box pt={6}>
                <Button
                  onClick={() => {
                    setLoading(false);
                    reset();
                  }}
                >
                  Stop Loading ☠
                </Button>
              </Box>
            )}
          </VStack>
        </Center>
      )}
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
