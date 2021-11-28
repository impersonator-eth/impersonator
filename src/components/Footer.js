import React from "react";
import {
  useColorMode,
  Flex,
  VStack,
  Heading,
  Spacer,
  Link,
  Text,
  Alert,
  HStack,
  Box,
} from "@chakra-ui/react";
import { ExternalLinkIcon } from "@chakra-ui/icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTwitter } from "@fortawesome/free-brands-svg-icons";

const Social = ({ icon, link }) => {
  return (
    <Link href={link} isExternal>
      <FontAwesomeIcon icon={icon} size="lg" />
    </Link>
  );
};

function Footer() {
  const { colorMode } = useColorMode();
  const underlineColor = { light: "gray.500", dark: "gray.400" };

  return (
    <Flex py="4" borderTop="2px" borderTopColor={underlineColor[colorMode]}>
      <Spacer flex="1" />
      <VStack>
        <Alert status="info" variant="solid" rounded="lg">
          <Box>Found the project helpful? Support it on</Box>
          <Link href="https://gitcoin.co/grants/3613/impersonator" isExternal>
            <HStack pl="0.3rem" fontWeight="bold" textDecor="underline">
              <Text>Gitcoin Grants</Text>
              <ExternalLinkIcon />
            </HStack>
          </Link>
        </Alert>
        <Heading size="md">
          Built by:{" "}
          <Social icon={faTwitter} link="https://twitter.com/apoorvlathey" />
          <Link href="https://twitter.com/apoorvlathey" isExternal>
            <Text decoration="underline" display="inline">
              @apoorvlathey
            </Text>{" "}
            <ExternalLinkIcon />
          </Link>
        </Heading>
      </VStack>
      <Spacer flex="1" />
    </Flex>
  );
}

export default Footer;
