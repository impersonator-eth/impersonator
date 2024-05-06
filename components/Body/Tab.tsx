import { Box, HStack, Badge } from "@chakra-ui/react";

const Tab = ({
  children,
  tabIndex,
  selectedTabIndex,
  setSelectedTabIndex,
  isNew = false,
}: {
  children: React.ReactNode;
  tabIndex: number;
  selectedTabIndex: number;
  setSelectedTabIndex: Function;
  isNew?: boolean;
}) => {
  return (
    <HStack
      fontWeight={"semibold"}
      color={tabIndex === selectedTabIndex ? "white" : "whiteAlpha.700"}
      role="group"
      _hover={{
        color: "whiteAlpha.900",
      }}
      cursor="pointer"
      onClick={() => setSelectedTabIndex(tabIndex)}
    >
      <Box>{children}</Box>
      {isNew && (
        <Box pb="5">
          <Badge
            variant="subtle"
            _groupHover={{
              bg: "green.500",
              color: "whiteAlpha.800",
            }}
            colorScheme="green"
            rounded={"md"}
            fontSize={"10"}
          >
            New
          </Badge>
        </Box>
      )}
    </HStack>
  );
};

export default Tab;
