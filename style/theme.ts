import { extendTheme, ThemeConfig } from "@chakra-ui/react";

const colors = {
  brand: {
    black: "#101010",
    lightBlack: "#1a1a1a",
  },
};

const config: ThemeConfig = {
  initialColorMode: "dark",
  useSystemColorMode: false,
};

const theme = extendTheme({
  styles: {
    global: {
      body: {
        bg: "brand.black",
        color: "white",
      },
    },
  },
  config,
  colors,
});

export default theme;
