import {
  Center,
  Box,
  Text,
  chakra,
  HStack,
  Link,
  Image,
} from "@chakra-ui/react";

function BrowserExtensionTab() {
  return (
    <Center flexDir={"column"} mt="3">
      <Box w="full" fontWeight={"semibold"} fontSize={"xl"}>
        <Text>
          ⭐ Download the browser extension from:{" "}
          <chakra.a
            color="blue.200"
            href="https://chrome.google.com/webstore/detail/impersonator/hgihfkmoibhccfdohjdbklmmcknjjmgl"
            target={"_blank"}
            rel="noopener noreferrer"
          >
            Chrome Web Store
          </chakra.a>
        </Text>
      </Box>
      <HStack mt="2" w="full" fontSize={"lg"}>
        <Text>Read more:</Text>
        <Link
          color="cyan.200"
          fontWeight={"semibold"}
          href="https://twitter.com/apoorvlathey/status/1577624123177508864"
          isExternal
        >
          Launch Tweet
        </Link>
      </HStack>
      <Image mt="2" src="/extension.png" />
    </Center>
  );
}

export default BrowserExtensionTab;
