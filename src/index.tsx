import ReactDOM from "react-dom";
import App from "./App";
import { ChakraProvider } from "@chakra-ui/react";
import theme from "./theme";
import { SafeInjectProvider } from "./contexts/SafeInjectContext";

ReactDOM.render(
  <ChakraProvider theme={theme}>
    <SafeInjectProvider>
      <App />
    </SafeInjectProvider>
  </ChakraProvider>,
  document.getElementById("root")
);
