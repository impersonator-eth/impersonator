import React from "react";
import { Button, useColorMode, Flex, Heading, Spacer } from "@chakra-ui/react";
import { SunIcon, MoonIcon } from "@chakra-ui/icons";

function Navbar() {
  const { colorMode, toggleColorMode } = useColorMode();
  const underlineColor = { light: "gray.500", dark: "gray.400" };

  return (
    <Flex
      py="4"
      px={["2", "4", "10", "10"]}
      borderBottom="2px"
      borderBottomColor={underlineColor[colorMode]}
    >
      <Spacer flex="1" />
      <Heading maxW={["302px", "4xl", "4xl", "4xl"]}>
        🎭 Impersonator 🕵️
      </Heading>
      <Flex flex="1" justifyContent="flex-end">
        <Button onClick={toggleColorMode} rounded="full" h="40px" w="40px">
          {colorMode === "light" ? <MoonIcon /> : <SunIcon />}
        </Button>
      </Flex>
    </Flex>
  );
}

export default Navbar;
