"use client";

import { useState, useEffect, useCallback } from "react";
import { Container, useToast, Center, Spacer, Flex } from "@chakra-ui/react";

import { SingleValue } from "chakra-react-select";
// WC v2
import { Core } from "@walletconnect/core";
import { WalletKit, IWalletKit } from "@reown/walletkit";
import { ProposalTypes, SessionTypes } from "@walletconnect/types";
import { getSdkError, parseUri } from "@walletconnect/utils";
import { ethers } from "ethers";
import axios from "axios";
import networksList from "evm-rpcs-list";
import { useSafeInject } from "../../contexts/SafeInjectContext";
import TenderlySettings from "./TenderlySettings";
import AddressInput from "./AddressInput";
import { SelectedNetworkOption, TxnDataType } from "../../types";
import NetworkInput from "./NetworkInput";
import TabsSelect from "./TabsSelect";
import WalletConnectTab from "./WalletConnectTab";
import IFrameConnectTab from "./IFrameConnectTab";
import BrowserExtensionTab from "./BrowserExtensionTab";
import TransactionRequests from "./TransactionRequests";
import NotificationBar from "./NotificationBar";

const WCMetadata = {
  name: "Impersonator",
  description: "Login to dapps as any address",
  url: "www.impersonator.xyz",
  icons: ["https://www.impersonator.xyz/favicon.ico"],
};

// Pin Core + WalletKit as cross-HMR singletons. Without this, Next.js dev
// HMR re-evaluates the module on every save and spawns a fresh Core, so two
// (or more) relay clients race for the same project ID — that's what shows
// up in the console as a "Restore will override. subscription" loop.
type WCGlobals = {
  __impersonator_wc_core?: InstanceType<typeof Core>;
  __impersonator_wc_walletkit_promise?: Promise<IWalletKit>;
};
const wcGlobals = globalThis as unknown as WCGlobals;

const core =
  wcGlobals.__impersonator_wc_core ??
  (wcGlobals.__impersonator_wc_core = new Core({
    projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID,
  }));

const getWalletKit = (): Promise<IWalletKit> =>
  wcGlobals.__impersonator_wc_walletkit_promise ??
  (wcGlobals.__impersonator_wc_walletkit_promise = WalletKit.init({
    core,
    metadata: WCMetadata,
  }));

const primaryNetworkIds = [
  1, // ETH Mainnet
  42161, // Arbitrum One
  43114, // Avalanche
  80094, // Berachain
  56, // BSC
  8453, // Base
  250, // Fantom Opera
  100, // Gnosis
  10, // Optimism
  137, // Polygon
  130, // Unichain
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

function Body() {
  // NOTE: do NOT read window/localStorage at render time. SSR has no access
  // to either, so seeding useState from them produces server/client diverge
  // and a hydration mismatch. All URL- and cache-derived state is loaded
  // post-mount in the effect below.
  const toast = useToast();

  const {
    setAddress: setIFrameAddress,
    appUrl,
    setAppUrl,
    setRpcUrl,
    iframeRef,
    latestTransaction,
  } = useSafeInject();

  const [provider, setProvider] = useState<ethers.providers.JsonRpcProvider>();
  const [showAddress, setShowAddress] = useState(""); // gets displayed in input. ENS name remains as it is
  const [address, setAddress] = useState(""); // internal resolved address
  const [isAddressValid, setIsAddressValid] = useState(true);
  const [uri, setUri] = useState("");
  const [networkId, setNetworkId] = useState(1);
  const [selectedNetworkOption, setSelectedNetworkOption] = useState<
    SingleValue<SelectedNetworkOption>
  >({
    label: networksList["1"].name,
    value: 1,
  });
  // WC v2
  const [web3wallet, setWeb3Wallet] = useState<IWalletKit>();
  const [web3WalletSession, setWeb3WalletSession] =
    useState<SessionTypes.Struct>();
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);

  const [selectedTabIndex, setSelectedTabIndex] = useState(0);
  const [isIFrameLoading, setIsIFrameLoading] = useState(false);

  const [inputAppUrl, setInputAppUrl] = useState<string | undefined>(undefined);
  const [iframeKey, setIframeKey] = useState(0); // hacky way to reload iframe when key changes

  const [tenderlyForkId, setTenderlyForkId] = useState("");
  const [sendTxnData, setSendTxnData] = useState<TxnDataType[]>([]);
  // Flips true after the mount effect has loaded URL/localStorage state.
  // Write-effects below gate on this so they don't clobber cached values
  // on the first render.
  const [hydrated, setHydrated] = useState(false);
  // `undefined` = no boot pending; a string|null is the seedAppUrl to use
  // once `provider` is ready (a one-shot signal from the mount effect).
  const [pendingIFrameBoot, setPendingIFrameBoot] = useState<
    string | null | undefined
  >(undefined);

  useEffect(() => {
    // Hydrate URL- and localStorage-derived state post-mount so SSR and the
    // first client render agree.
    const urlParams = new URLSearchParams(window.location.search);
    const addressFromURL = urlParams.get("address");
    const urlFromURL = urlParams.get("url");
    const chainFromURL = urlParams.get("chain");

    const showAddressCache = localStorage.getItem("showAddress");
    const urlFromCache = localStorage.getItem("appUrl");
    const tenderlyForkIdCache = localStorage.getItem("tenderlyForkId");

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

    const seedAddress = addressFromURL ?? showAddressCache ?? "";
    if (seedAddress) {
      setShowAddress(seedAddress);
      setAddress(seedAddress);
    }
    if (networkIdViaURL !== 1) {
      setNetworkId(networkIdViaURL);
      setSelectedNetworkOption({
        label: networksList[networkIdViaURL].name,
        value: networkIdViaURL,
      });
    }
    if (urlFromURL) {
      setSelectedTabIndex(1);
    }
    const seedAppUrl = urlFromURL ?? urlFromCache ?? undefined;
    if (seedAppUrl) {
      setInputAppUrl(seedAppUrl);
    }
    if (tenderlyForkIdCache) {
      setTenderlyForkId(tenderlyForkIdCache);
    }

    // WalletKit is a singleton — initialize exactly once on mount.
    // Avoids re-running WalletKit.init on every Connect, which previously
    // caused the events-effect below to re-pair with the current URI each
    // time and accumulate sessions on the relay.
    const _showAddress = !addressFromURL
      ? showAddressCache ?? undefined
      : undefined;
    initWeb3Wallet(true, _showAddress);

    const _provider = new ethers.providers.JsonRpcProvider(
      `https://mainnet.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_KEY}`
    );
    setProvider(_provider);

    // Defer the iframe boot to a provider-ready effect below. Stash the
    // intent in a ref-like state so that effect can pick it up.
    if (addressFromURL && urlFromURL) {
      setPendingIFrameBoot(seedAppUrl ?? null);
    }

    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (provider && pendingIFrameBoot !== undefined) {
      initIFrame(pendingIFrameBoot ?? undefined);
      setPendingIFrameBoot(undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider, pendingIFrameBoot]);

  useEffect(() => {
    updateNetwork((selectedNetworkOption as SelectedNetworkOption).value);
    // eslint-disable-next-line
  }, [selectedNetworkOption]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("tenderlyForkId", tenderlyForkId);
  }, [tenderlyForkId, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("showAddress", showAddress);
  }, [showAddress, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    if (inputAppUrl) {
      localStorage.setItem("appUrl", inputAppUrl);
    }
  }, [inputAppUrl, hydrated]);

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
          .then((res) => {
            console.log(res.data);
            toast({
              title: "Txn Simulated on Tenderly",
              description: `Hash: ${res.data.result}`,
              status: "success",
              position: "bottom-right",
              duration: null,
              isClosable: true,
            });
          });
      }
    }
    // eslint-disable-next-line
  }, [latestTransaction, tenderlyForkId]);

  const initWeb3Wallet = async (
    onlyIfActiveSessions?: boolean,
    _showAddress?: string
  ) => {
    const _web3wallet = await getWalletKit();

    if (onlyIfActiveSessions) {
      const sessions = _web3wallet.getActiveSessions();
      const sessionsArray = Object.values(sessions);
      console.log({ sessions });

      // Disconnect any extra accumulated sessions — keep only the most
      // recent. Stale sessions otherwise stay live on the relay and count
      // against our complexity budget.
      if (sessionsArray.length > 1) {
        const stale = sessionsArray.slice(0, -1);
        for (const s of stale) {
          try {
            await _web3wallet.disconnectSession({
              topic: s.topic,
              reason: getSdkError("USER_DISCONNECTED"),
            });
          } catch (e) {
            console.error("cleanup stale session", e);
          }
        }
      }

      const active = sessionsArray[sessionsArray.length - 1];
      if (active) {
        const _address =
          active.namespaces["eip155"].accounts[0].split(":")[2];
        console.log({ _showAddress, _address });
        setWeb3WalletSession(active);
        setShowAddress(
          _showAddress && _showAddress.length > 0 ? _showAddress : _address
        );
        if (!(_showAddress && _showAddress.length > 0)) {
          localStorage.setItem("showAddress", _address);
        }
        setAddress(_address);
        setUri(
          `wc:${active.pairingTopic}@2?relay-protocol=irn&symKey=xxxxxx`
        );
        setIsConnected(true);
      }
    } else if (_showAddress) {
      setShowAddress(_showAddress);
      setAddress(_showAddress);
    }

    setWeb3Wallet(_web3wallet);

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

  const initWalletConnect = async () => {
    if (loading) return; // guard against duplicate clicks during pairing
    setLoading(true);
    const { isValid } = await resolveAndValidateAddress();

    if (!isValid) {
      setLoading(false);
      return;
    }

    const { version } = parseUri(uri);

    if (version === 1) {
      toast({
        title: "Couldn't Connect",
        description:
          "The dapp is still using the deprecated WalletConnect V1",
        status: "error",
        isClosable: true,
        duration: 8000,
      });
      setLoading(false);
      return;
    }

    try {
      // Reuse the singleton WalletKit. Never call init() a second time —
      // it would spawn another SignClient on the same Core and double our
      // relay subscriptions.
      const _web3wallet = web3wallet ?? (await getWalletKit());
      if (!web3wallet) {
        setWeb3Wallet(_web3wallet);
        (window as any).w3 = _web3wallet;
      }

      // Disconnect any existing session before pairing. Otherwise each
      // Connect leaves the previous session alive on the relay.
      if (web3WalletSession) {
        try {
          await _web3wallet.disconnectSession({
            topic: web3WalletSession.topic,
            reason: getSdkError("USER_DISCONNECTED"),
          });
        } catch (e) {
          console.error("disconnect previous", e);
        }
        setWeb3WalletSession(undefined);
        setIsConnected(false);
      }

      await _web3wallet.core.pairing.pair({ uri });
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

  const onSessionProposal = useCallback(
    async (proposal) => {
      setLoading(false);
      console.log("EVENT", "session_proposal", proposal);

      const { requiredNamespaces, optionalNamespaces } = proposal.params;
      const namespaceKey = "eip155";
      const requiredNamespace = requiredNamespaces[namespaceKey] as
        | ProposalTypes.BaseRequiredNamespace
        | undefined;
      const optionalNamespace = optionalNamespaces
        ? optionalNamespaces[namespaceKey]
        : undefined;

      let chains: string[] | undefined =
        requiredNamespace === undefined ? undefined : requiredNamespace.chains;
      if (optionalNamespace && optionalNamespace.chains) {
        if (chains) {
          // merge chains from requiredNamespace & optionalNamespace, while avoiding duplicates
          chains = Array.from(new Set(chains.concat(optionalNamespace.chains)));
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
        methods:
          requiredNamespace === undefined ? [] : requiredNamespace.methods,
        events: requiredNamespace === undefined ? [] : requiredNamespace.events,
      };

      if (requiredNamespace && requiredNamespace.chains) {
        const _chainId = parseInt(requiredNamespace.chains[0].split(":")[1]);
        setSelectedNetworkOption({
          label: networksList[_chainId].name,
          value: _chainId,
        });
      }

      // If a previous session is still around, kill it before approving
      // the new one so we never have two live sessions on the relay.
      if (web3wallet) {
        const existing = Object.values(web3wallet.getActiveSessions());
        for (const s of existing) {
          try {
            await web3wallet.disconnectSession({
              topic: s.topic,
              reason: getSdkError("USER_DISCONNECTED"),
            });
          } catch (e) {
            console.error("disconnect existing on proposal", e);
          }
        }
      }

      const session = await web3wallet?.approveSession({
        id: proposal.id,
        namespaces: {
          [namespaceKey]: namespace,
        },
      });
      setWeb3WalletSession(session);
      setIsConnected(true);
    },
    [web3wallet, address]
  );

  const handleSendTransaction = useCallback(
    async (id: number, params: any[], topic?: string) => {
      setSendTxnData((data) => {
        const newTxn = {
          id: id,
          from: params[0].from,
          to: params[0].to,
          data: params[0].data,
          value: params[0].value
            ? parseInt(params[0].value, 16).toString()
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
            id: id,
            method: "eth_sendTransaction",
            params: params,
          }
        );
        console.log({ res });

        // Approve Call Request
        if (web3wallet && topic) {
          // await web3wallet.respondSessionRequest({
          //   topic,
          //   response: {
          //     jsonrpc: "2.0",
          //     id: res.id,
          //     result: res.result,
          //   },
          // });

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

        toast({
          title: "Txn Simulated on Tenderly",
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
              error: {
                code: 0,
                message: "Method not supported by Impersonator",
              },
            },
          });
        }
      }
    },
    [tenderlyForkId, web3wallet]
  );

  const onSessionRequest = useCallback(
    async (event) => {
      const { topic, params, id } = event;
      const { request } = params;

      console.log("EVENT", "session_request", event);

      if (request.method === "eth_sendTransaction") {
        await handleSendTransaction(id, request.params, topic);
      } else {
        await web3wallet?.respondSessionRequest({
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
    },
    [web3wallet, handleSendTransaction]
  );

  const onSessionDelete = useCallback(() => {
    console.log("EVENT", "session_delete");

    reset();
  }, []);

  // Subscribe to events when the wallet is ready. Pairing is intentionally
  // NOT done here — it now lives in `initWalletConnect`, fired only by an
  // explicit user Connect. Previously, this effect re-paired with the
  // current URI whenever its callback deps changed (e.g. tenderlyForkId),
  // creating duplicate relay sessions.
  useEffect(() => {
    if (!web3wallet) return;
    web3wallet.on("session_proposal", onSessionProposal);
    web3wallet.on("session_request", onSessionRequest);
    web3wallet.on("session_delete", onSessionDelete);
    return () => {
      web3wallet.removeListener("session_proposal", onSessionProposal);
      web3wallet.removeListener("session_request", onSessionRequest);
      web3wallet.removeListener("session_delete", onSessionDelete);
    };
  }, [web3wallet, onSessionProposal, onSessionRequest, onSessionDelete]);

  const updateSession = async ({
    newChainId,
    newAddress,
  }: {
    newChainId?: number;
    newAddress?: string;
  }) => {
    let _chainId = newChainId || networkId;
    let _address = newAddress || address;

    if (web3wallet && web3WalletSession) {
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

    if (web3wallet && web3WalletSession) {
      setWeb3WalletSession(undefined);
      setUri("");
      setIsConnected(false);

      try {
        await web3wallet.disconnectSession({
          topic: web3WalletSession.topic,
          reason: getSdkError("USER_DISCONNECTED"),
        });
      } catch (e) {
        console.error("killSession", e);
      }
    }
  };

  const reset = (persistUri?: boolean) => {
    setWeb3WalletSession(undefined);
    setIsConnected(false);
    if (!persistUri) {
      setUri("");
    }
    localStorage.removeItem("walletconnect");
  };

  return (
    <>
      {/* {process.env.NEXT_PUBLIC_GITCOIN_GRANTS_ACTIVE === "true" && (
        <NotificationBar />
      )} */}
      <NotificationBar />
      <Center mt="8" fontStyle={"italic"}>
        Connect to dapps as any ETH Address!
      </Center>
      <Container mt="2" mb="16" minW={["0", "0", "2xl", "2xl"]}>
        <Flex>
          <Spacer flex="1" />
          <TenderlySettings
            tenderlyForkId={tenderlyForkId}
            setTenderlyForkId={setTenderlyForkId}
          />
        </Flex>
        <AddressInput
          showAddress={showAddress}
          setShowAddress={setShowAddress}
          setAddress={setAddress}
          setIsAddressValid={setIsAddressValid}
          isAddressValid={isAddressValid}
          selectedTabIndex={selectedTabIndex}
          isConnected={isConnected}
          appUrl={appUrl}
          isIFrameLoading={isIFrameLoading}
          updateAddress={updateAddress}
        />
        <NetworkInput
          primaryNetworkOptions={primaryNetworkOptions}
          secondaryNetworkOptions={secondaryNetworkOptions}
          selectedNetworkOption={selectedNetworkOption}
          setSelectedNetworkOption={setSelectedNetworkOption}
        />
        <TabsSelect
          selectedTabIndex={selectedTabIndex}
          setSelectedTabIndex={setSelectedTabIndex}
        />
        {(() => {
          switch (selectedTabIndex) {
            case 0:
              return (
                <WalletConnectTab
                  uri={uri}
                  setUri={setUri}
                  isConnected={isConnected}
                  initWalletConnect={initWalletConnect}
                  loading={loading}
                  setLoading={setLoading}
                  reset={reset}
                  killSession={killSession}
                  web3WalletSession={web3WalletSession}
                />
              );
            case 1:
              return (
                <IFrameConnectTab
                  networkId={networkId}
                  initIFrame={initIFrame}
                  setInputAppUrl={setInputAppUrl}
                  inputAppUrl={inputAppUrl}
                  isIFrameLoading={isIFrameLoading}
                  appUrl={appUrl}
                  iframeKey={iframeKey}
                  iframeRef={iframeRef}
                  setIsIFrameLoading={setIsIFrameLoading}
                  showAddress={showAddress}
                />
              );
            case 2:
              return <BrowserExtensionTab />;
          }
        })()}
        <Center>
          <TransactionRequests
            sendTxnData={sendTxnData}
            setSendTxnData={setSendTxnData}
            networkId={networkId}
          />
        </Center>
      </Container>
    </>
  );
}

export default Body;
