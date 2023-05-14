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
  useToast,
  CircularProgress,
  Center,
  Spacer,
  Flex,
  useDisclosure,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Tooltip,
  HStack,
  chakra,
  ListItem,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Heading,
  Collapse,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  SimpleGrid,
  GridItem,
  Image,
  Spinner,
} from "@chakra-ui/react";
import {
  SettingsIcon,
  InfoIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CopyIcon,
  DeleteIcon,
  CloseIcon,
} from "@chakra-ui/icons";
import { Select as RSelect, SingleValue } from "chakra-react-select";
// WC v1
import LegacySignClient from "@walletconnect/client";
import { IClientMeta } from "@walletconnect/legacy-types";
// WC v2
import { Core } from "@walletconnect/core";
import { Web3Wallet, IWeb3Wallet } from "@walletconnect/web3wallet";
import { SessionTypes } from "@walletconnect/types";
import { getSdkError, parseUri } from "@walletconnect/utils";
import { ethers } from "ethers";
import axios from "axios";
import networksList from "evm-rpcs-list";
import { useSafeInject } from "../../contexts/SafeInjectContext";
import Tab from "./Tab";

interface SafeDappInfo {
  id: number;
  url: string;
  name: string;
  iconUrl: string;
}

interface SelectedNetworkOption {
  label: string;
  value: number;
}

const WCMetadata = {
  name: "Impersonator",
  description: "Login to dapps as any address",
  url: "www.impersonator.xyz",
  icons: ["https://www.impersonator.xyz/favicon.ico"],
};

const core = new Core({
  projectId: process.env.REACT_APP_WC_PROJECT_ID,
});

const primaryNetworkIds = [
  1, // ETH Mainnet
  42161, // Arbitrum One
  43114, // Avalanche
  56, // BSC
  250, // Fantom Opera
  5, // Goerli Testnet
  100, // Gnosis
  10, // Optimism
  137, // Polygon
];

const primaryNetworkOptions = primaryNetworkIds.map((id) => {
  return { chainId: id, ...networksList[id.toString()] };
});
const secondaryNetworkOptions = Object.entries(networksList)
  .filter((id) => !primaryNetworkIds.includes(parseInt(id[0])))
  .map((arr) => {
    return {
      chainId: parseInt(arr[0]),
      name: arr[1].name,
      rpcs: arr[1].rpcs,
    };
  });
const allNetworksOptions = [
  ...primaryNetworkOptions,
  ...secondaryNetworkOptions,
];

const slicedText = (txt: string) => {
  return txt.length > 6
    ? `${txt.slice(0, 4)}...${txt.slice(txt.length - 2, txt.length)}`
    : txt;
};

const CopyToClipboard = ({ txt }: { txt: string }) => (
  <Button
    onClick={() => {
      navigator.clipboard.writeText(txt);
    }}
    size="sm"
  >
    <CopyIcon />
  </Button>
);

const TD = ({ txt }: { txt: string }) => (
  <Td>
    <HStack>
      <Tooltip label={txt} hasArrow placement="top">
        <Text>{slicedText(txt)}</Text>
      </Tooltip>
      <CopyToClipboard txt={txt} />
    </HStack>
  </Td>
);

function Body() {
  const { colorMode } = useColorMode();
  const bgColor = { light: "white", dark: "gray.700" };
  const addressFromURL = new URLSearchParams(window.location.search).get(
    "address"
  );
  const urlFromURL = new URLSearchParams(window.location.search).get("url");
  const chainFromURL = new URLSearchParams(window.location.search).get("chain");
  let networkIdViaURL = 1;
  if (chainFromURL) {
    for (let i = 0; i < allNetworksOptions.length; i++) {
      if (
        allNetworksOptions[i].name
          .toLowerCase()
          .includes(chainFromURL.toLowerCase())
      ) {
        networkIdViaURL = allNetworksOptions[i].chainId;
        break;
      }
    }
  }
  const toast = useToast();
  const { onOpen, onClose, isOpen } = useDisclosure();
  const { isOpen: tableIsOpen, onToggle: tableOnToggle } = useDisclosure();
  const {
    isOpen: isSafeAppsOpen,
    onOpen: openSafeAapps,
    onClose: closeSafeApps,
  } = useDisclosure();

  const {
    setAddress: setIFrameAddress,
    appUrl,
    setAppUrl,
    setRpcUrl,
    iframeRef,
    latestTransaction,
  } = useSafeInject();

  const [provider, setProvider] = useState<ethers.providers.JsonRpcProvider>();
  const [showAddress, setShowAddress] = useState(addressFromURL ?? ""); // gets displayed in input. ENS name remains as it is
  const [address, setAddress] = useState(addressFromURL ?? ""); // internal resolved address
  const [isAddressValid, setIsAddressValid] = useState(true);
  const [uri, setUri] = useState("");
  const [networkId, setNetworkId] = useState(networkIdViaURL);
  const [selectedNetworkOption, setSelectedNetworkOption] = useState<
    SingleValue<SelectedNetworkOption>
  >({
    label: networksList[networkIdViaURL].name,
    value: networkIdViaURL,
  });
  // WC v1
  const [legacySignClient, setLegacySignClient] = useState<LegacySignClient>();
  // WC v2
  const [web3wallet, setWeb3Wallet] = useState<IWeb3Wallet>();
  const [web3WalletSession, setWeb3WalletSession] =
    useState<SessionTypes.Struct>();
  const [legacyPeerMeta, setLegacyPeerMeta] = useState<IClientMeta>();
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);

  const tabs = ["WalletConnect", "iFrame", "Extension"];
  const [selectedTabIndex, setSelectedTabIndex] = useState(urlFromURL ? 1 : 0);
  const [isIFrameLoading, setIsIFrameLoading] = useState(false);
  const [safeDapps, setSafeDapps] = useState<{
    [networkId: number]: SafeDappInfo[];
  }>({});
  const [searchSafeDapp, setSearchSafeDapp] = useState<string>();
  const [filteredSafeDapps, setFilteredSafeDapps] = useState<SafeDappInfo[]>();
  const [inputAppUrl, setInputAppUrl] = useState<string | undefined>(
    urlFromURL ?? undefined
  );
  const [iframeKey, setIframeKey] = useState(0); // hacky way to reload iframe when key changes

  const [tenderlyForkId, setTenderlyForkId] = useState("");
  const [sendTxnData, setSendTxnData] = useState<
    {
      id: number;
      from: string;
      to: string;
      data: string;
      value: string;
    }[]
  >([]);

  useEffect(() => {
    // WC V1
    const { session, _showAddress } = getCachedSession();
    if (session) {
      let _legacySignClient = new LegacySignClient({ session });

      if (_legacySignClient.peerMeta) {
        try {
          setLegacySignClient(_legacySignClient);
          setShowAddress(
            _showAddress ? _showAddress : _legacySignClient.accounts[0]
          );
          setAddress(_legacySignClient.accounts[0]);
          setUri(_legacySignClient.uri);
          setLegacyPeerMeta(_legacySignClient.peerMeta);
          setIsConnected(true);
          const chainId =
            (_legacySignClient.chainId as unknown as { chainID: number })
              .chainID || _legacySignClient.chainId;

          setNetworkId(chainId);
        } catch {
          console.log("Corrupt old session. Starting fresh");
          localStorage.removeItem("walletconnect");
        }
      }
    }
    // WC V2
    initWeb3Wallet(true, _showAddress);

    setProvider(
      new ethers.providers.JsonRpcProvider(
        `https://mainnet.infura.io/v3/${process.env.REACT_APP_INFURA_KEY}`
      )
    );

    const storedTenderlyForkId = localStorage.getItem("tenderlyForkId");
    setTenderlyForkId(storedTenderlyForkId ? storedTenderlyForkId : "");
  }, []);

  useEffect(() => {
    updateNetwork((selectedNetworkOption as SelectedNetworkOption).value);
    // eslint-disable-next-line
  }, [selectedNetworkOption]);

  useEffect(() => {
    if (provider && addressFromURL && urlFromURL) {
      initIFrame();
    }
    // eslint-disable-next-line
  }, [provider]);

  useEffect(() => {
    if (legacySignClient || web3wallet) {
      subscribeToEvents();
    }
    // eslint-disable-next-line
  }, [legacySignClient, web3wallet]);

  useEffect(() => {
    localStorage.setItem("tenderlyForkId", tenderlyForkId);
  }, [tenderlyForkId]);

  useEffect(() => {
    localStorage.setItem("showAddress", showAddress);
  }, [showAddress]);

  useEffect(() => {
    setIFrameAddress(address);
    // eslint-disable-next-line
  }, [address]);

  useEffect(() => {
    // TODO: use random rpc if this one is slow/down?
    setRpcUrl(networksList[networkId].rpcs[0]);
    // eslint-disable-next-line
  }, [networkId]);

  useEffect(() => {
    if (latestTransaction) {
      const newTxn = {
        from: address,
        ...latestTransaction,
      };

      setSendTxnData((data) => {
        if (data.some((d) => d.id === newTxn.id)) {
          return data;
        } else {
          return [
            { ...newTxn, value: parseInt(newTxn.value, 16).toString() },
            ...data,
          ];
        }
      });

      if (tenderlyForkId.length > 0) {
        axios
          .post("https://rpc.tenderly.co/fork/" + tenderlyForkId, {
            jsonrpc: "2.0",
            id: newTxn.id,
            method: "eth_sendTransaction",
            params: [
              {
                from: newTxn.from,
                to: newTxn.to,
                value: newTxn.value,
                data: newTxn.data,
              },
            ],
          })
          .then((res) => console.log(res.data));
      }
    }
    // eslint-disable-next-line
  }, [latestTransaction, tenderlyForkId]);

  useEffect(() => {
    const fetchSafeDapps = async (networkId: number) => {
      const response = await axios.get<SafeDappInfo[]>(
        `https://safe-client.gnosis.io/v1/chains/${networkId}/safe-apps`
      );
      setSafeDapps((dapps) => ({
        ...dapps,
        [networkId]: response.data.filter((d) => ![29, 11].includes(d.id)), // Filter out Transaction Builder and WalletConnect
      }));
    };

    if (isSafeAppsOpen && !safeDapps[networkId]) {
      fetchSafeDapps(networkId);
    }
  }, [isSafeAppsOpen, safeDapps, networkId]);

  useEffect(() => {
    if (safeDapps[networkId]) {
      setFilteredSafeDapps(
        safeDapps[networkId].filter((dapp) => {
          if (!searchSafeDapp) return true;

          return (
            dapp.name
              .toLowerCase()
              .indexOf(searchSafeDapp.toLocaleLowerCase()) !== -1 ||
            dapp.url
              .toLowerCase()
              .indexOf(searchSafeDapp.toLocaleLowerCase()) !== -1
          );
        })
      );
    } else {
      setFilteredSafeDapps(undefined);
    }
  }, [safeDapps, networkId, searchSafeDapp]);

  const initWeb3Wallet = async (
    onlyIfActiveSessions?: boolean,
    _showAddress?: string
  ) => {
    const _web3wallet = await Web3Wallet.init({
      core,
      metadata: WCMetadata,
    });

    if (onlyIfActiveSessions) {
      const sessions = _web3wallet.getActiveSessions();
      const sessionsArray = Object.values(sessions);
      if (sessionsArray.length > 0) {
        const _address =
          sessionsArray[0].namespaces["eip155"].accounts[0].split(":")[2];
        console.log({ _showAddress, _address });
        setWeb3WalletSession(sessionsArray[0]);
        setShowAddress(
          _showAddress && _showAddress.length > 0 ? _showAddress : _address
        );
        if (!(_showAddress && _showAddress.length > 0)) {
          localStorage.setItem("showAddress", _address);
        }
        setAddress(_address);
        setUri(
          `wc:${sessionsArray[0].pairingTopic}@2?relay-protocol=irn&symKey=xxxxxx`
        );
        setWeb3Wallet(_web3wallet);
        setIsConnected(true);
      }
    } else {
      setWeb3Wallet(_web3wallet);
    }

    // for debugging
    (window as any).w3 = _web3wallet;
  };

  const resolveAndValidateAddress = async () => {
    let isValid;
    let _address = address;
    if (!address) {
      isValid = false;
    } else {
      // Resolve ENS
      const resolvedAddress = await provider!.resolveName(address);
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

  const getCachedSession = () => {
    const local = localStorage ? localStorage.getItem("walletconnect") : null;
    const _showAddress = localStorage.getItem("showAddress") ?? undefined;

    let session = null;
    if (local) {
      try {
        session = JSON.parse(local);
      } catch (error) {
        throw error;
      }
    }
    return { session, _showAddress };
  };

  const initWalletConnect = async () => {
    setLoading(true);
    const { isValid } = await resolveAndValidateAddress();

    if (isValid) {
      const { version } = parseUri(uri);

      try {
        if (version === 1) {
          let _legacySignClient = new LegacySignClient({ uri });

          if (!_legacySignClient.connected) {
            await _legacySignClient.createSession();
          }

          setLegacySignClient(_legacySignClient);
          setUri(_legacySignClient.uri);
        } else {
          await initWeb3Wallet();
        }
      } catch (err) {
        console.error(err);
        toast({
          title: "Couldn't Connect",
          description: "Refresh dApp and Connect again",
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

  const initIFrame = async (_inputAppUrl = inputAppUrl) => {
    setIsIFrameLoading(true);
    if (_inputAppUrl === appUrl) {
      setIsIFrameLoading(false);
      return;
    }

    const { isValid } = await resolveAndValidateAddress();
    if (!isValid) {
      setIsIFrameLoading(false);
      return;
    }

    setAppUrl(_inputAppUrl);
  };

  const subscribeToEvents = async () => {
    console.log("ACTION", "subscribeToEvents");

    if (legacySignClient) {
      legacySignClient.on("session_request", (error, payload) => {
        if (loading) {
          setLoading(false);
        }
        console.log("EVENT", "session_request");

        if (error) {
          throw error;
        }

        console.log("SESSION_REQUEST", payload.params);
        setLegacyPeerMeta(payload.params[0].peerMeta);
        approveLegacySession();
      });

      legacySignClient.on("session_update", (error) => {
        console.log("EVENT", "session_update");
        setLoading(false);

        if (error) {
          throw error;
        }
      });

      legacySignClient.on("call_request", async (error, payload) => {
        console.log({ payload });

        if (payload.method === "eth_sendTransaction") {
          await handleSendTransaction(payload.id, payload.params);
        }
      });

      legacySignClient.on("connect", (error, payload) => {
        console.log("EVENT", "connect");

        if (error) {
          throw error;
        }

        // this.setState({ connected: true });
      });

      legacySignClient.on("disconnect", (error, payload) => {
        console.log("EVENT", "disconnect");

        if (error) {
          throw error;
        }

        reset();
      });
    } else if (web3wallet) {
      web3wallet.on("session_proposal", async (proposal) => {
        if (loading) {
          setLoading(false);
        }
        console.log("EVENT", "session_proposal", proposal);

        const { requiredNamespaces, optionalNamespaces } = proposal.params;
        const namespaceKey = "eip155";
        const requiredNamespace = requiredNamespaces[namespaceKey];
        const optionalNamespace = optionalNamespaces
          ? optionalNamespaces[namespaceKey]
          : undefined;

        let chains: string[] | undefined = requiredNamespace.chains;
        if (optionalNamespace && optionalNamespace.chains) {
          if (chains) {
            // merge chains from requiredNamespace & optionalNamespace, while avoiding duplicates
            chains = Array.from(
              new Set(chains.concat(optionalNamespace.chains))
            );
          } else {
            chains = optionalNamespace.chains;
          }
        }

        const accounts: string[] = [];
        chains?.map((chain) => {
          accounts.push(`${chain}:${address}`);
          return null;
        });
        const namespace: SessionTypes.Namespace = {
          accounts,
          chains: chains,
          methods: requiredNamespace.methods,
          events: requiredNamespace.events,
        };

        if (requiredNamespace.chains) {
          const _chainId = parseInt(requiredNamespace.chains[0].split(":")[1]);
          setSelectedNetworkOption({
            label: networksList[_chainId].name,
            value: _chainId,
          });
        }

        const session = await web3wallet.approveSession({
          id: proposal.id,
          namespaces: {
            [namespaceKey]: namespace,
          },
        });
        setWeb3WalletSession(session);
        setIsConnected(true);
      });
      try {
        await web3wallet.core.pairing.pair({ uri });
      } catch (e) {
        console.error(e);
      }

      web3wallet.on("session_request", async (event) => {
        const { topic, params, id } = event;
        const { request } = params;

        console.log("EVENT", "session_request", event);

        if (request.method === "eth_sendTransaction") {
          await handleSendTransaction(id, request.params, topic);
        } else {
          await web3wallet.respondSessionRequest({
            topic,
            response: {
              jsonrpc: "2.0",
              id: id,
              error: {
                code: 0,
                message: "Method not supported by Impersonator",
              },
            },
          });
        }
      });

      web3wallet.on("session_delete", () => {
        console.log("EVENT", "session_delete");

        reset();
      });
    }
  };

  const handleSendTransaction = async (
    id: number,
    params: any[],
    topic?: string
  ) => {
    setSendTxnData((data) => {
      const newTxn = {
        id: id,
        from: params[0].from,
        to: params[0].to,
        data: params[0].data,
        value: params[0].value ? parseInt(params[0].value, 16).toString() : "0",
      };

      if (data.some((d) => d.id === newTxn.id)) {
        return data;
      } else {
        return [newTxn, ...data];
      }
    });

    if (tenderlyForkId.length > 0) {
      const { data: res } = await axios.post(
        "https://rpc.tenderly.co/fork/" + tenderlyForkId,
        {
          jsonrpc: "2.0",
          id: id,
          method: "eth_sendTransaction",
          params: params,
        }
      );
      console.log({ res });

      // Approve Call Request
      if (legacySignClient) {
        legacySignClient.approveRequest({
          id: res.id,
          result: res.result,
        });
      } else if (web3wallet && topic) {
        await web3wallet.respondSessionRequest({
          topic,
          response: {
            jsonrpc: "2.0",
            id: res.id,
            result: res.result,
          },
        });
      }

      toast({
        title: "Txn successful",
        description: `Hash: ${res.result}`,
        status: "success",
        position: "bottom-right",
        duration: null,
        isClosable: true,
      });
    } else {
      if (web3wallet && topic) {
        await web3wallet.respondSessionRequest({
          topic,
          response: {
            jsonrpc: "2.0",
            id: id,
            error: { code: 0, message: "Method not supported by Impersonator" },
          },
        });
      }
    }
  };

  const approveLegacySession = () => {
    console.log("ACTION", "approveLegacySession");
    if (legacySignClient) {
      let chainId = networkId;
      if (!chainId) {
        chainId = 1; // default to ETH Mainnet if no network selected
      }
      legacySignClient.approveSession({ chainId, accounts: [address] });
      setIsConnected(true);
    }
  };

  // const rejectLegacySession = () => {
  //   console.log("ACTION", "rejectSession");
  //   if (legacySignClient) {
  //     legacySignClient.rejectSession();
  //     setPeerMeta(undefined);
  //   }
  // };

  const updateSession = async ({
    newChainId,
    newAddress,
  }: {
    newChainId?: number;
    newAddress?: string;
  }) => {
    let _chainId = newChainId || networkId;
    let _address = newAddress || address;

    if (legacySignClient && legacySignClient.connected) {
      legacySignClient.updateSession({
        chainId: _chainId,
        accounts: [_address],
      });
    } else if (web3wallet && web3WalletSession) {
      await web3wallet.emitSessionEvent({
        topic: web3WalletSession.topic,
        event: {
          name: _chainId !== networkId ? "chainChanged" : "accountsChanged",
          data: [_address],
        },
        chainId: `eip155:${_chainId}`,
      });
      setLoading(false);
    } else {
      setLoading(false);
    }
  };

  const updateAddress = async () => {
    if (selectedTabIndex === 0) {
      setLoading(true);
    } else {
      setIsIFrameLoading(true);
    }
    const { isValid, _address } = await resolveAndValidateAddress();

    if (isValid) {
      if (selectedTabIndex === 0) {
        updateSession({
          newAddress: _address,
        });
      } else {
        setIFrameAddress(_address);
        setIframeKey((key) => key + 1);
        setIsIFrameLoading(false);
      }
    }
  };

  const updateNetwork = (_networkId: number) => {
    setNetworkId(_networkId);

    if (selectedTabIndex === 0) {
      updateSession({
        newChainId: _networkId,
      });
    } else {
      setIframeKey((key) => key + 1);
    }
  };

  const killSession = async () => {
    console.log("ACTION", "killSession");

    if (legacySignClient) {
      legacySignClient.killSession();

      setLegacyPeerMeta(undefined);
      setIsConnected(false);
    } else if (web3wallet && web3WalletSession) {
      try {
        await web3wallet.disconnectSession({
          topic: web3WalletSession.topic,
          reason: getSdkError("USER_DISCONNECTED"),
        });
      } catch (e) {
        console.error("killSession", e);
      }
      setWeb3WalletSession(undefined);
      setUri("");
      setIsConnected(false);
    }
  };

  const reset = (persistUri?: boolean) => {
    setLegacyPeerMeta(undefined);
    setWeb3WalletSession(undefined);
    setIsConnected(false);
    if (!persistUri) {
      setUri("");
    }
    localStorage.removeItem("walletconnect");
  };

  return (
    <Container my="16" minW={["0", "0", "2xl", "2xl"]}>
      <Flex>
        <Spacer flex="1" />
        <Popover
          placement="bottom-start"
          isOpen={isOpen}
          onOpen={onOpen}
          onClose={onClose}
        >
          <PopoverTrigger>
            <Box>
              <Button>
                <SettingsIcon
                  transition="900ms rotate ease-in-out"
                  transform={isOpen ? "rotate(33deg)" : "rotate(0deg)"}
                />
              </Button>
            </Box>
          </PopoverTrigger>
          <PopoverContent
            border={0}
            boxShadow="xl"
            rounded="xl"
            overflowY="auto"
          >
            <Box px="1rem" py="1rem">
              <HStack>
                <Text>(optional) Tenderly Fork Id:</Text>
                <Tooltip
                  label={
                    <>
                      <Text>Simulate sending transactions on forked node.</Text>
                      <chakra.hr bg="gray.400" />
                      <ListItem>
                        Create a fork on Tenderly and grab it's id from the URL.
                      </ListItem>
                    </>
                  }
                  hasArrow
                  placement="top"
                >
                  <InfoIcon />
                </Tooltip>
              </HStack>
              <Input
                mt="0.5rem"
                aria-label="fork-rpc"
                placeholder="xxxx-xxxx-xxxx-xxxx"
                autoComplete="off"
                value={tenderlyForkId}
                onChange={(e) => {
                  setTenderlyForkId(e.target.value);
                }}
              />
            </Box>
          </PopoverContent>
        </Popover>
      </Flex>
      <FormControl>
        <FormLabel>Enter Address or ENS to Impersonate</FormLabel>
        <InputGroup>
          <Input
            placeholder="vitalik.eth"
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
          {((selectedTabIndex === 0 && isConnected) ||
            (selectedTabIndex === 1 && appUrl && !isIFrameLoading)) && (
            <InputRightElement width="4.5rem" mr="1rem">
              <Button h="1.75rem" size="sm" onClick={updateAddress}>
                Update
              </Button>
            </InputRightElement>
          )}
        </InputGroup>
      </FormControl>
      <Box mt={4} cursor="pointer">
        <RSelect
          options={[
            {
              label: "",
              options: primaryNetworkOptions.map((network) => ({
                label: network.name,
                value: network.chainId,
              })),
            },
            {
              label: "",
              options: secondaryNetworkOptions.map((network) => ({
                label: network.name,
                value: network.chainId,
              })),
            },
          ]}
          value={selectedNetworkOption}
          onChange={setSelectedNetworkOption}
          placeholder="Select chain..."
          size="md"
          tagVariant="solid"
          chakraStyles={{
            groupHeading: (provided, state) => ({
              ...provided,
              h: "1px",
              borderTop: "1px solid white",
            }),
          }}
          closeMenuOnSelect
          useBasicStyles
        />
      </Box>
      <Center flexDir="column">
        <HStack
          mt="1rem"
          minH="3rem"
          px="1.5rem"
          spacing={"8"}
          background="gray.700"
          borderRadius="xl"
        >
          {tabs.map((t, i) => (
            <Tab
              key={i}
              tabIndex={i}
              selectedTabIndex={selectedTabIndex}
              setSelectedTabIndex={setSelectedTabIndex}
              isNew={i === 2}
            >
              {t}
            </Tab>
          ))}
        </HStack>
      </Center>
      {(() => {
        switch (selectedTabIndex) {
          case 0:
            return (
              <>
                <FormControl my={4}>
                  <HStack>
                    <FormLabel>WalletConnect URI</FormLabel>
                    <Tooltip
                      label={
                        <>
                          <Text>Visit any dApp and select WalletConnect.</Text>
                          <Text>
                            Click "Copy to Clipboard" beneath the QR code, and
                            paste it here.
                          </Text>
                        </>
                      }
                      hasArrow
                      placement="top"
                    >
                      <Box pb="0.8rem">
                        <InfoIcon />
                      </Box>
                    </Tooltip>
                  </HStack>
                  <Box>
                    <Input
                      placeholder="wc:xyz123"
                      aria-label="uri"
                      autoComplete="off"
                      value={uri}
                      onChange={(e) => setUri(e.target.value)}
                      bg={bgColor[colorMode]}
                      isDisabled={isConnected}
                    />
                  </Box>
                </FormControl>
                <Center>
                  <Button onClick={initWalletConnect} isDisabled={isConnected}>
                    Connect
                  </Button>
                </Center>
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
                              reset(true);
                            }}
                          >
                            Stop Loading ☠
                          </Button>
                        </Box>
                      )}
                    </VStack>
                  </Center>
                )}
                {legacyPeerMeta && isConnected && (
                  <>
                    <Box mt={4} fontSize={24} fontWeight="semibold">
                      ✅ Connected To:
                    </Box>
                    <VStack>
                      <Avatar src={legacyPeerMeta.icons[0]} />
                      <Text fontWeight="bold">{legacyPeerMeta.name}</Text>
                      <Text fontSize="sm">{legacyPeerMeta.description}</Text>
                      <Link href={legacyPeerMeta.url} textDecor="underline">
                        {legacyPeerMeta.url}
                      </Link>
                      <Box pt={6}>
                        <Button onClick={() => killSession()}>
                          Disconnect ☠
                        </Button>
                      </Box>
                    </VStack>
                  </>
                )}
                {web3WalletSession && isConnected && (
                  <>
                    <Box mt={4} fontSize={24} fontWeight="semibold">
                      ✅ Connected To:
                    </Box>
                    <VStack>
                      <Avatar
                        src={web3WalletSession.peer?.metadata?.icons[0]}
                      />
                      <Text fontWeight="bold">
                        {web3WalletSession.peer?.metadata?.name}
                      </Text>
                      <Text fontSize="sm">
                        {web3WalletSession.peer?.metadata?.description}
                      </Text>
                      <Link
                        href={web3WalletSession.peer?.metadata?.url}
                        textDecor="underline"
                      >
                        {web3WalletSession.peer?.metadata?.url}
                      </Link>
                      <Box pt={6}>
                        <Button onClick={() => killSession()}>
                          Disconnect ☠
                        </Button>
                      </Box>
                    </VStack>
                  </>
                )}
              </>
            );
          case 1:
            return (
              <>
                <FormControl my={4}>
                  <HStack>
                    <FormLabel>dapp URL</FormLabel>
                    <Tooltip
                      label={
                        <>
                          <Text>
                            Paste the URL of dapp you want to connect to
                          </Text>
                          <Text>
                            Note: Some dapps might not support it, so use
                            WalletConnect in that case
                          </Text>
                        </>
                      }
                      hasArrow
                      placement="top"
                    >
                      <Box pb="0.8rem">
                        <InfoIcon />
                      </Box>
                    </Tooltip>
                    <Spacer />
                    <Box pb="0.5rem">
                      <Button size="sm" onClick={openSafeAapps}>
                        Supported dapps
                      </Button>
                    </Box>
                    <Modal
                      isOpen={isSafeAppsOpen}
                      onClose={closeSafeApps}
                      isCentered
                    >
                      <ModalOverlay
                        bg="none"
                        backdropFilter="auto"
                        backdropBlur="3px"
                      />
                      <ModalContent
                        minW={{
                          base: 0,
                          sm: "30rem",
                          md: "40rem",
                          lg: "60rem",
                        }}
                      >
                        <ModalHeader>Select a dapp</ModalHeader>
                        <ModalCloseButton />
                        <ModalBody maxH="30rem" overflow={"clip"}>
                          {(!safeDapps || !safeDapps[networkId]) && (
                            <Center py="3rem" w="100%">
                              <Spinner />
                            </Center>
                          )}
                          <Box pb="2rem" px={{ base: 0, md: "2rem" }}>
                            {safeDapps && safeDapps[networkId] && (
                              <Center pb="0.5rem">
                                <InputGroup maxW="30rem">
                                  <Input
                                    placeholder="search 🔎"
                                    value={searchSafeDapp}
                                    onChange={(e) =>
                                      setSearchSafeDapp(e.target.value)
                                    }
                                  />
                                  {searchSafeDapp && (
                                    <InputRightElement width="3rem">
                                      <Button
                                        size="xs"
                                        variant={"ghost"}
                                        onClick={() => setSearchSafeDapp("")}
                                      >
                                        <CloseIcon />
                                      </Button>
                                    </InputRightElement>
                                  )}
                                </InputGroup>
                              </Center>
                            )}
                            <Box
                              minH="30rem"
                              maxH="30rem"
                              overflow="scroll"
                              overflowX="auto"
                              overflowY="auto"
                            >
                              <SimpleGrid
                                pt="1rem"
                                columns={{ base: 2, md: 3, lg: 4 }}
                                gap={6}
                              >
                                {filteredSafeDapps &&
                                  filteredSafeDapps.map((dapp, i) => (
                                    <GridItem
                                      key={i}
                                      border="2px solid"
                                      borderColor={"gray.500"}
                                      _hover={{
                                        cursor: "pointer",
                                        bgColor: "gray.600",
                                      }}
                                      rounded="lg"
                                      onClick={() => {
                                        initIFrame(dapp.url);
                                        setInputAppUrl(dapp.url);
                                        closeSafeApps();
                                      }}
                                    >
                                      <Center
                                        flexDir={"column"}
                                        h="100%"
                                        p="1rem"
                                      >
                                        <Image
                                          w="2rem"
                                          src={dapp.iconUrl}
                                          borderRadius="full"
                                        />
                                        <Text mt="0.5rem" textAlign={"center"}>
                                          {dapp.name}
                                        </Text>
                                      </Center>
                                    </GridItem>
                                  ))}
                              </SimpleGrid>
                            </Box>
                          </Box>
                        </ModalBody>
                      </ModalContent>
                    </Modal>
                  </HStack>
                  <Input
                    placeholder="https://app.uniswap.org/"
                    aria-label="dapp-url"
                    autoComplete="off"
                    value={inputAppUrl}
                    onChange={(e) => setInputAppUrl(e.target.value)}
                    bg={bgColor[colorMode]}
                  />
                </FormControl>
                <Center>
                  <Button
                    onClick={() => initIFrame()}
                    isLoading={isIFrameLoading}
                  >
                    Connect
                  </Button>
                </Center>
                <Center
                  mt="1rem"
                  ml={{ base: "-385", sm: "-315", md: "-240", lg: "-60" }}
                  px={{ base: "10rem", lg: 0 }}
                  w="70rem"
                >
                  {appUrl && (
                    <Box
                      as="iframe"
                      w={{
                        base: "22rem",
                        sm: "45rem",
                        md: "55rem",
                        lg: "1500rem",
                      }}
                      h={{ base: "33rem", md: "35rem", lg: "38rem" }}
                      title="app"
                      src={appUrl}
                      key={iframeKey}
                      borderWidth="1px"
                      borderStyle={"solid"}
                      borderColor="white"
                      bg="white"
                      ref={iframeRef}
                      onLoad={() => setIsIFrameLoading(false)}
                    />
                  )}
                </Center>
              </>
            );
          case 2:
            return (
              <Center flexDir={"column"} mt="3">
                <Box w="full" fontWeight={"semibold"} fontSize={"xl"}>
                  <Text>
                    ⭐ Download the browser extension from:{" "}
                    <chakra.a
                      color="blue.200"
                      href="https://chrome.google.com/webstore/detail/impersonator/hgihfkmoibhccfdohjdbklmmcknjjmgl"
                      target={"_blank"}
                      rel="noopener noreferrer"
                    >
                      Chrome Web Store
                    </chakra.a>
                  </Text>
                </Box>
                <HStack mt="2" w="full" fontSize={"lg"}>
                  <Text>Read more:</Text>
                  <Link
                    color="cyan.200"
                    fontWeight={"semibold"}
                    href="https://twitter.com/apoorvlathey/status/1577624123177508864"
                    isExternal
                  >
                    Launch Tweet
                  </Link>
                </HStack>
                <Image mt="2" src="/extension.png" />
              </Center>
            );
        }
      })()}
      <Center>
        <Box
          minW={["0", "0", "2xl", "2xl"]}
          overflowX={"auto"}
          mt="2rem"
          pt="0.5rem"
          pl="1rem"
          border={"1px solid"}
          borderColor={"white.800"}
          rounded="lg"
        >
          <Flex py="2" pl="2" pr="4">
            <HStack cursor={"pointer"} onClick={tableOnToggle}>
              <Text fontSize={"xl"}>
                {tableIsOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
              </Text>
              <Heading size={"md"}>eth_sendTransactions</Heading>
              <Tooltip
                label={
                  <>
                    <Text>
                      "eth_sendTransaction" requests by the dApp are shown here
                      (latest on top)
                    </Text>
                  </>
                }
                hasArrow
                placement="top"
              >
                <Box pb="0.8rem">
                  <InfoIcon />
                </Box>
              </Tooltip>
            </HStack>
            <Flex flex="1" />
            {sendTxnData.length > 0 && (
              <Button onClick={() => setSendTxnData([])}>
                <DeleteIcon />
                <Text pl="0.5rem">Clear</Text>
              </Button>
            )}
          </Flex>
          <Collapse in={tableIsOpen} animateOpacity>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>from</Th>
                  <Th>to</Th>
                  <Th>data</Th>
                  <Th>value</Th>
                </Tr>
              </Thead>
              <Tbody>
                {sendTxnData.map((d) => (
                  <Tr key={d.id}>
                    <TD txt={d.from} />
                    <TD txt={d.to} />
                    <TD txt={d.data} />
                    <TD txt={d.value} />
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Collapse>
        </Box>
      </Center>
    </Container>
  );
}

export default Body;
