import { Box, Button, Image, Text } from "@chakra-ui/react";
import { ChevronDownIcon } from "@chakra-ui/icons";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { blo } from "blo";

export const CustomConnectButton = () => {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        // Note: If your app doesn't use authentication, you
        // can remove all 'authenticationStatus' checks
        const ready: boolean = mounted && authenticationStatus !== "loading";
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus || authenticationStatus === "authenticated");
        return ready ? (
          <Box hidden={!ready}>
            {(() => {
              if (!connected) {
                return (
                  <Button colorScheme={"telegram"} onClick={openConnectModal}>
                    Connect Wallet
                  </Button>
                );
              }
              if (chain.unsupported) {
                return (
                  <Button colorScheme={"red"} onClick={openChainModal}>
                    Wrong network
                  </Button>
                );
              }

              return (
                <Box
                  display="flex"
                  py="0"
                  alignItems="center"
                  borderRadius="xl"
                >
                  <Button
                    mr={2}
                    pr={2}
                    bg={"gray.800"}
                    _hover={{
                      bg: "whiteAlpha.200",
                    }}
                    onClick={openChainModal}
                    borderRadius="xl"
                  >
                    {chain.hasIcon && (
                      <Box
                        mr={4}
                        w={6}
                        bgImg={chain.iconBackground}
                        overflow={"hidden"}
                        rounded={"full"}
                      >
                        {chain.iconUrl && (
                          <Image
                            w={6}
                            alt={chain.name ?? "Chain icon"}
                            src={chain.iconUrl}
                          />
                        )}
                      </Box>
                    )}
                    {chain.name}
                    <ChevronDownIcon ml={1} pt={1} fontSize="2xl" />
                  </Button>
                  <Button
                    onClick={openAccountModal}
                    bg="blackAlpha.500"
                    border="1px solid transparent"
                    _hover={{
                      border: "1px",
                      borderStyle: "solid",
                      borderColor: "blue.400",
                      backgroundColor: "gray.700",
                    }}
                    borderRadius="xl"
                    m="1px"
                    px={3}
                    h="38px"
                  >
                    <Text
                      color="white"
                      fontSize="md"
                      fontWeight="medium"
                      mr="2"
                    >
                      {account.displayName}
                    </Text>
                    <Image
                      src={
                        account.ensAvatar ??
                        blo(account.address as `0x${string}`)
                      }
                      w="24px"
                      h="24px"
                      rounded={"full"}
                      alt={account.displayName}
                    />
                  </Button>
                </Box>
              );
            })()}
          </Box>
        ) : null;
      }}
    </ConnectButton.Custom>
  );
};
