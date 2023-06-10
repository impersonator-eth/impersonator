import {
  FormControl,
  HStack,
  FormLabel,
  Tooltip,
  Box,
  Text,
  Input,
} from "@chakra-ui/react";
import { InfoIcon } from "@chakra-ui/icons";

interface URIInputParams {
  uri: string;
  setUri: (value: string) => void;
  bg: string;
  isConnected: boolean;
}

function URIInput({ uri, setUri, bg, isConnected }: URIInputParams) {
  return (
    <FormControl my={4}>
      <HStack>
        <FormLabel>WalletConnect URI</FormLabel>
        <Tooltip
          label={
            <>
              <Text>Visit any dApp and select WalletConnect.</Text>
              <Text>
                Click "Copy to Clipboard" beneath the QR code, and paste it
                here.
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
          bg={bg}
          isDisabled={isConnected}
        />
      </Box>
    </FormControl>
  );
}

export default URIInput;
