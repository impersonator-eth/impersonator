import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Center,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  SimpleGrid,
  Spinner,
  useDisclosure,
} from "@chakra-ui/react";
import axios from "axios";
import DappsSearch from "./DappsSearch";
import DappTile from "./DappTile";
import { SafeDappInfo } from "../../../../types";

interface SupportedDappsParams {
  networkId: number;
  initIFrame: (_inputAppUrl?: string | undefined) => Promise<void>;
  setInputAppUrl: (value: string | undefined) => void;
}

function SupportedDapps({
  networkId,
  initIFrame,
  setInputAppUrl,
}: SupportedDappsParams) {
  const {
    isOpen: isSafeAppsOpen,
    onOpen: openSafeAapps,
    onClose: closeSafeApps,
  } = useDisclosure();

  const [safeDapps, setSafeDapps] = useState<{
    [networkId: number]: SafeDappInfo[];
  }>({});
  const [searchSafeDapp, setSearchSafeDapp] = useState<string>();
  const [filteredSafeDapps, setFilteredSafeDapps] = useState<SafeDappInfo[]>();

  useEffect(() => {
    const fetchSafeDapps = async (networkId: number) => {
      const response = await axios.get<SafeDappInfo[]>(
        `https://safe-client.safe.global/v1/chains/${networkId}/safe-apps`
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

  return (
    <>
      <Box pb="0.5rem">
        <Button size="sm" onClick={openSafeAapps}>
          Supported dapps
        </Button>
      </Box>

      <Modal isOpen={isSafeAppsOpen} onClose={closeSafeApps} isCentered>
        <ModalOverlay bg="none" backdropFilter="auto" backdropBlur="3px" />
        <ModalContent
          minW={{
            base: 0,
            sm: "30rem",
            md: "40rem",
            lg: "60rem",
          }}
          bg={"brand.lightBlack"}
        >
          <ModalHeader>Select a dapp</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {(!safeDapps || !safeDapps[networkId]) && (
              <Center py="3rem" w="100%">
                <Spinner />
              </Center>
            )}
            <Box pb="2rem" px={{ base: 0, md: "2rem" }}>
              {safeDapps && safeDapps[networkId] && (
                <DappsSearch
                  searchSafeDapp={searchSafeDapp}
                  setSearchSafeDapp={setSearchSafeDapp}
                />
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
                      <DappTile
                        key={i}
                        initIFrame={initIFrame}
                        setInputAppUrl={setInputAppUrl}
                        closeSafeApps={closeSafeApps}
                        dapp={dapp}
                      />
                    ))}
                </SimpleGrid>
              </Box>
            </Box>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}

export default SupportedDapps;
