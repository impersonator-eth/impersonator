import { GridItem, Center, Image, Text } from "@chakra-ui/react";
import { SafeDappInfo } from "../../../../types";

interface DappTileParams {
  initIFrame: (_inputAppUrl?: string | undefined) => Promise<void>;
  setInputAppUrl: (value: string | undefined) => void;
  closeSafeApps: () => void;
  dapp: SafeDappInfo;
}

function DappTile({
  initIFrame,
  setInputAppUrl,
  closeSafeApps,
  dapp,
}: DappTileParams) {
  return (
    <GridItem
      border="2px solid"
      borderColor={"gray.500"}
      bg={"white"}
      color={"black"}
      _hover={{
        cursor: "pointer",
        bgColor: "gray.600",
        color: "white",
      }}
      rounded="lg"
      onClick={() => {
        initIFrame(dapp.url);
        setInputAppUrl(dapp.url);
        closeSafeApps();
      }}
    >
      <Center flexDir={"column"} h="100%" p="1rem">
        <Image bg="white" w="2rem" src={dapp.iconUrl} borderRadius="full" />
        <Text mt="0.5rem" textAlign={"center"}>
          {dapp.name}
        </Text>
      </Center>
    </GridItem>
  );
}

export default DappTile;
