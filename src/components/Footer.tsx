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
  Stack,
  Center,
} from "@chakra-ui/react";
import { ExternalLinkIcon } from "@chakra-ui/icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { faTwitter, faDiscord } from "@fortawesome/free-brands-svg-icons";

const Social = ({ icon, link }: { icon: IconProp; link: string }) => {
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
          <Stack direction={{ base: "column", md: "row" }}>
            <Box>Found the project helpful?</Box>
            <HStack>
              {process.env.REACT_APP_GITCOIN_GRANTS_ACTIVE === "true" ? (
                <>
                  <Text>Support it on</Text>
                  <Link
                    href={process.env.REACT_APP_GITCOIN_GRANTS_LINK}
                    isExternal
                  >
                    <HStack fontWeight="bold" textDecor="underline">
                      <Text>Gitcoin Grants</Text>
                      <ExternalLinkIcon />
                    </HStack>
                  </Link>
                </>
              ) : (
                <>
                  <Text>Support at</Text>
                  <Link
                    href="https://etherscan.io/address/apoorv.eth"
                    isExternal
                  >
                    <HStack fontWeight="bold" textDecor="underline">
                      <Text>apoorv.eth</Text>
                      <ExternalLinkIcon />
                    </HStack>
                  </Link>
                </>
              )}
            </HStack>
          </Stack>
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
        <Center pt="1">
          <Link
            href={"https://discord.gg/4VTnuVzfmm"}
            color="twitter.200"
            isExternal
          >
            <FontAwesomeIcon icon={faDiscord} size="2x" />
          </Link>
        </Center>
      </VStack>
      <Spacer flex="1" />
    </Flex>
  );
}

export default Footer;
