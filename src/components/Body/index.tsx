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
  Select,
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
import WalletConnect from "@walletconnect/client";
import { IClientMeta } from "@walletconnect/types";
import { ethers } from "ethers";
import axios from "axios";
import { useSafeInject } from "../../contexts/SafeInjectContext";
import Tab from "./Tab";
import networkInfo from "./networkInfo";

interface SafeDappInfo {
  id: number;
  url: string;
  name: string;
  iconUrl: string;
}

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
  const [networkIndex, setNetworkIndex] = useState(0);
  const [connector, setConnector] = useState<WalletConnect>();
  const [peerMeta, setPeerMeta] = useState<IClientMeta>();
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);

  const [selectedTabIndex, setSelectedTabIndex] = useState(0);
  const [isIFrameLoading, setIsIFrameLoading] = useState(false);
  const [safeDapps, setSafeDapps] = useState<{
    [networkIndex: number]: SafeDappInfo[];
  }>({});
  const [searchSafeDapp, setSearchSafeDapp] = useState<string>();
  const [filteredSafeDapps, setFilteredSafeDapps] = useState<SafeDappInfo[]>();
  const [inputAppUrl, setInputAppUrl] = useState<string>();
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
      let _connector = new WalletConnect({ session });

      if (_connector.peerMeta) {
        try {
          setConnector(_connector);
          setShowAddress(_showAddress ? _showAddress : _connector.accounts[0]);
          setAddress(_connector.accounts[0]);
          setUri(_connector.uri);
          setPeerMeta(_connector.peerMeta);
          setIsConnected(true);
          const chainId =
            (_connector.chainId as unknown as { chainID: number }).chainID ||
            _connector.chainId;

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
      new ethers.providers.JsonRpcProvider(
        `https://mainnet.infura.io/v3/${process.env.REACT_APP_INFURA_KEY}`
      )
    );

    const storedTenderlyForkId = localStorage.getItem("tenderlyForkId");
    setTenderlyForkId(storedTenderlyForkId ? storedTenderlyForkId : "");
  }, []);

  useEffect(() => {
    if (connector) {
      subscribeToEvents();
    }
    // eslint-disable-next-line
  }, [connector]);

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
    setRpcUrl(networkInfo[networkIndex].rpc);
  }, [networkIndex]);

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
    const fetchSafeDapps = async (networkIndex: number) => {
      const response = await axios.get<SafeDappInfo[]>(
        `https://safe-client.gnosis.io/v1/chains/${networkInfo[networkIndex].chainID}/safe-apps`
      );
      setSafeDapps((dapps) => ({
        ...dapps,
        [networkIndex]: response.data.filter((d) => ![29, 11].includes(d.id)), // Filter out Transaction Builder and WalletConnect
      }));
    };

    if (isSafeAppsOpen && !safeDapps[networkIndex]) {
      fetchSafeDapps(networkIndex);
    }
  }, [isSafeAppsOpen, safeDapps, networkIndex]);

  useEffect(() => {
    if (safeDapps[networkIndex]) {
      setFilteredSafeDapps(
        safeDapps[networkIndex].filter((dapp) => {
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
  }, [safeDapps, networkIndex, searchSafeDapp]);

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

  const getChainId = (networkIndex: number) => {
    return networkInfo[networkIndex].chainID;
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
            connector.approveRequest({
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

  const updateNetwork = (_networkIndex: number) => {
    setNetworkIndex(_networkIndex);

    if (selectedTabIndex === 0) {
      updateSession({
        newChainId: getChainId(_networkIndex),
      });
    } else {
      setIframeKey((key) => key + 1);
    }
  };

  const killSession = () => {
    console.log("ACTION", "killSession");

    if (connector) {
      connector.killSession();

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
      <Select
        mt={4}
        variant="filled"
        _hover={{ cursor: "pointer" }}
        value={networkIndex}
        onChange={(e) => {
          const _networkIndex = parseInt(e.target.value);
          updateNetwork(_networkIndex);
        }}
      >
        {networkInfo.map((network, i) => (
          <option value={i} key={i}>
            {network.name}
          </option>
        ))}
      </Select>
      <Center flexDir="column">
        <HStack
          mt="1rem"
          minH="3rem"
          px="1.5rem"
          spacing={"8"}
          background="gray.700"
          borderRadius="xl"
        >
          {["WalletConnect", "iFrame"].map((t, i) => (
            <Tab
              key={i}
              tabIndex={i}
              selectedTabIndex={selectedTabIndex}
              setSelectedTabIndex={setSelectedTabIndex}
            >
              {t}
            </Tab>
          ))}
        </HStack>
      </Center>
      {selectedTabIndex === 0 ? (
        <>
          <FormControl my={4}>
            <HStack>
              <FormLabel>WalletConnect URI</FormLabel>
              <Tooltip
                label={
                  <>
                    <Text>Visit any dApp and select WalletConnect.</Text>
                    <Text>
                      Click "Copy to Clipboard" beneath the QR code, and paste
                      it here.
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
      ) : (
        <>
          <FormControl my={4}>
            <HStack>
              <FormLabel>dapp URL</FormLabel>
              <Tooltip
                label={
                  <>
                    <Text>Paste the URL of dapp you want to connect to</Text>
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
              <Modal isOpen={isSafeAppsOpen} onClose={closeSafeApps} isCentered>
                <ModalOverlay
                  bg="none"
                  backdropFilter="auto"
                  backdropBlur="3px"
                />
                <ModalContent
                  minW={{ base: 0, sm: "30rem", md: "40rem", lg: "60rem" }}
                >
                  <ModalHeader>Select a dapp</ModalHeader>
                  <ModalCloseButton />
                  <ModalBody>
                    <Box
                      minH="30rem"
                      maxH="30rem"
                      overflow="scroll"
                      overflowX="auto"
                      overflowY="auto"
                    >
                      {(!safeDapps || !safeDapps[networkIndex]) && (
                        <Center py="3rem" w="100%">
                          <Spinner />
                        </Center>
                      )}
                      <Box pb="2rem" px={{ base: 0, md: "2rem" }}>
                        {safeDapps && safeDapps[networkIndex] && (
                          <Center pb="1.5rem">
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

                        <SimpleGrid columns={{ base: 2, md: 3, lg: 4 }} gap={6}>
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
                                <Center flexDir={"column"} h="100%" p="1rem">
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
            <Button onClick={() => initIFrame()} isLoading={isIFrameLoading}>
              Connect
            </Button>
          </Center>
          <Center mt="1rem" ml="-60" w="70rem">
            {appUrl && (
              <iframe
                title="app"
                src={appUrl}
                key={iframeKey}
                width="1500rem"
                height="600rem"
                style={{
                  border: "1px solid white",
                  background: "white",
                }}
                ref={iframeRef}
                onLoad={() => setIsIFrameLoading(false)}
              />
            )}
          </Center>
        </>
      )}
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
