import { Box } from "@chakra-ui/react";

const Tab = ({
  children,
  tabIndex,
  selectedTabIndex,
  setSelectedTabIndex,
}: {
  children: React.ReactNode;
  tabIndex: number;
  selectedTabIndex: number;
  setSelectedTabIndex: Function;
}) => {
  return (
    <Box
      fontWeight={"semibold"}
      color={tabIndex === selectedTabIndex ? "white" : "whiteAlpha.700"}
      _hover={{
        color: "whiteAlpha.900",
      }}
      cursor="pointer"
      onClick={() => setSelectedTabIndex(tabIndex)}
    >
      {children}
    </Box>
  );
};

export default Tab;
