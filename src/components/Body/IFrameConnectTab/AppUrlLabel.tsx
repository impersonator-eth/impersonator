import { FormLabel, Tooltip, Text, Box } from "@chakra-ui/react";
import { InfoIcon } from "@chakra-ui/icons";

function AppUrlLabel() {
  return (
    <>
      <FormLabel>dapp URL</FormLabel>
      <Tooltip
        label={
          <>
            <Text>Paste the URL of dapp you want to connect to</Text>
            <Text>
              Note: Some dapps might not support it, so use WalletConnect in
              that case
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
    </>
  );
}

export default AppUrlLabel;
