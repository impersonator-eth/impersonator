import {
  Button,
  Flex,
  Heading,
  Spacer,
  Box,
  Link,
  HStack,
  Text,
  Image,
} from "@chakra-ui/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub } from "@fortawesome/free-brands-svg-icons";

function Navbar() {
  return (
    <Flex
      py="4"
      px={["2", "4", "10", "10"]}
      borderBottom="2px"
      borderBottomColor={"gray.400"}
    >
      <Spacer flex="1" />
      <Heading
        maxW={["302px", "4xl", "4xl", "4xl"]}
        fontSize={{ base: "2xl", sm: "3xl", md: "4xl" }}
        pr="2rem"
      >
        <HStack>
          <Image src="/logo-no-bg.png" w="3rem" mr="1rem" />
          <Text>Impersonator</Text>
        </HStack>
      </Heading>
      <Flex flex="1" justifyContent="flex-end" alignItems={"center"}>
        <Box pl="1rem">
          <Link
            href={"https://github.com/apoorvlathey/impersonator"}
            isExternal
          >
            <FontAwesomeIcon icon={faGithub} size="2x" />
          </Link>
        </Box>
      </Flex>
    </Flex>
  );
}

export default Navbar;
