import { Box, Text, Button, VStack, Avatar, Link } from "@chakra-ui/react";
import { IClientMeta } from "@walletconnect/legacy-types";

interface LegacyConnectionDetailsParams {
  legacyPeerMeta: IClientMeta;
  killSession: () => void;
}

function LegacyConnectionDetails({
  legacyPeerMeta,
  killSession,
}: LegacyConnectionDetailsParams) {
  return (
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
          <Button onClick={() => killSession()}>Disconnect ☠</Button>
        </Box>
      </VStack>
    </>
  );
}

export default LegacyConnectionDetails;
