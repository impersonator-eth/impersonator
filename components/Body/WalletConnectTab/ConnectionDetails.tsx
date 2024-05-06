import { Box, Text, Button, VStack, Avatar, Link } from "@chakra-ui/react";
import { SessionTypes } from "@walletconnect/types";

interface ConnectionDetailsParams {
  web3WalletSession: SessionTypes.Struct;
  killSession: () => void;
}

function ConnectionDetails({
  web3WalletSession,
  killSession,
}: ConnectionDetailsParams) {
  return (
    <>
      <Box mt={4} fontSize={24} fontWeight="semibold">
        ✅ Connected To:
      </Box>
      <VStack>
        <Avatar src={web3WalletSession.peer?.metadata?.icons[0]} />
        <Text fontWeight="bold">{web3WalletSession.peer?.metadata?.name}</Text>
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
          <Button onClick={() => killSession()}>Disconnect ☠</Button>
        </Box>
      </VStack>
    </>
  );
}

export default ConnectionDetails;
