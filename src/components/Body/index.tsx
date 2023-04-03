import { useState, useEffect } from "react";
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
import { IClientMeta } from "@walletconnect/types";
// WC v2
import SignClient from "@walletconnect/sign-client";
import { parseUri } from "@walletconnect/utils";
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
  const [signClient, setSignClient] = useState<SignClient>();
  const [peerMeta, setPeerMeta] = useState<IClientMeta>();
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
          setPeerMeta(_legacySignClient.peerMeta);
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
  }, [selectedNetworkOption]);

  useEffect(() => {
    if (provider && addressFromURL && urlFromURL) {
      initIFrame();
    }
  }, [provider]);

  useEffect(() => {
    if (legacySignClient) {
      subscribeToEvents();
    }
    // eslint-disable-next-line
  }, [legacySignClient]);

  useEffect(() => {
    localStorage.setItem("tenderlyForkId", tenderlyForkId);
  }, [tenderlyForkId]);

  useEffect(() => {
    localStorage.setItem("showAddress", showAddress);
  }, [showAddress]);

  useEffect(() => {
    setIFrameAddress(address);
  }, [address]);

  useEffect(() => {
    // TODO: use random rpc if this one is slow/down?
    setRpcUrl(networksList[networkId].rpcs[0]);
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
    const _showAddress = localStorage
      ? localStorage.getItem("showAddress")
      : null;

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

  const subscribeToEvents = () => {
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
        setPeerMeta(payload.params[0].peerMeta);
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
          setSendTxnData((data) => {
            const newTxn = {
              id: payload.id,
              from: payload.params[0].from,
              to: payload.params[0].to,
              data: payload.params[0].data,
              value: payload.params[0].value
                ? parseInt(payload.params[0].value, 16).toString()
                : "0",
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
                id: payload.id,
                method: payload.method,
                params: payload.params,
              }
            );
            console.log({ res });

            // Approve Call Request
            legacySignClient.approveRequest({
              id: res.id,
              result: res.result,
            });

            toast({
              title: "Txn successful",
              description: `Hash: ${res.result}`,
              status: "success",
              position: "bottom-right",
              duration: null,
              isClosable: true,
            });
          }
        }

        // if (error) {
        //   throw error;
        // }

        // await getAppConfig().rpcEngine.router(payload, this.state, this.bindedSetState);
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
    }
  };

  const approveSession = () => {
    console.log("ACTION", "approveSession");
    if (legacySignClient) {
      let chainId = networkId;
      if (!chainId) {
        chainId = 1; // default to ETH Mainnet if no network selected
      }
      legacySignClient.approveSession({ chainId, accounts: [address] });
      setIsConnected(true);
    }
  };

  const rejectSession = () => {
    console.log("ACTION", "rejectSession");
    if (legacySignClient) {
      legacySignClient.rejectSession();
      setPeerMeta(undefined);
    }
  };

  const updateSession = ({
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

  const killSession = () => {
    console.log("ACTION", "killSession");

    if (legacySignClient) {
      legacySignClient.killSession();

      setPeerMeta(undefined);
      setIsConnected(false);
    }
  };

  const reset = () => {
    setPeerMeta(undefined);
    setIsConnected(false);
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
                            Connect ✔
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
