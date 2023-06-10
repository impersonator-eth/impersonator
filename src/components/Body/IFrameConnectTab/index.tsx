import {
  Button,
  Box,
  Center,
  Spacer,
  HStack,
  FormControl,
  Input,
} from "@chakra-ui/react";
import SupportedDapps from "./SupportedDapps";
import AppUrlLabel from "./AppUrlLabel";

interface IFrameConnectTabParams {
  networkId: number;
  initIFrame: (_inputAppUrl?: string | undefined) => Promise<void>;
  inputAppUrl: string | undefined;
  setInputAppUrl: (value: string | undefined) => void;
  appUrl: string | undefined;
  bg: string;
  isIFrameLoading: boolean;
  setIsIFrameLoading: (value: boolean) => void;
  iframeKey: number;
  iframeRef: React.RefObject<HTMLIFrameElement> | null;
}

function IFrameConnectTab({
  networkId,
  initIFrame,
  setInputAppUrl,
  inputAppUrl,
  bg,
  isIFrameLoading,
  appUrl,
  iframeKey,
  iframeRef,
  setIsIFrameLoading,
}: IFrameConnectTabParams) {
  return (
    <>
      <FormControl my={4}>
        <HStack>
          <AppUrlLabel />
          <Spacer />
          <SupportedDapps
            networkId={networkId}
            initIFrame={initIFrame}
            setInputAppUrl={setInputAppUrl}
          />
        </HStack>
        <Input
          placeholder="https://app.uniswap.org/"
          aria-label="dapp-url"
          autoComplete="off"
          value={inputAppUrl}
          onChange={(e) => setInputAppUrl(e.target.value)}
          bg={bg}
        />
      </FormControl>
      <Center>
        <Button onClick={() => initIFrame()} isLoading={isIFrameLoading}>
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
}

export default IFrameConnectTab;
