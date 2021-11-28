import React from "react";
import {
  useColorMode,
  Flex,
  VStack,
  Heading,
  Spacer,
  Link,
  Text,
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
