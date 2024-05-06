import {
  Box,
  Center,
  Button,
  VStack,
  CircularProgress,
} from "@chakra-ui/react";

interface LoadingParams {
  isConnected: boolean;
  setLoading: (value: boolean) => void;
  reset: (persistUri?: boolean) => void;
}

function Loading({ isConnected, setLoading, reset }: LoadingParams) {
  return (
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
  );
}

export default Loading;
