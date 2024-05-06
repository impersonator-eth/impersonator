import { Box } from "@chakra-ui/react";
import { Select as RSelect, SingleValue } from "chakra-react-select";
import { SelectedNetworkOption } from "../../types";

interface NetworkOption {
  name: string;
  rpcs: string[];
  chainId: number;
}

interface NetworkInputParams {
  primaryNetworkOptions: NetworkOption[];
  secondaryNetworkOptions: NetworkOption[];
  selectedNetworkOption: SingleValue<SelectedNetworkOption>;
  setSelectedNetworkOption: (value: SingleValue<SelectedNetworkOption>) => void;
}

function NetworkInput({
  primaryNetworkOptions,
  secondaryNetworkOptions,
  selectedNetworkOption,
  setSelectedNetworkOption,
}: NetworkInputParams) {
  return (
    <Box mt={4} cursor="pointer">
      <RSelect
        options={[
          {
            label: "",
            options: primaryNetworkOptions.map((network) => ({
              label: network.name,
              value: network.chainId,
            })),
          },
          {
            label: "",
            options: secondaryNetworkOptions.map((network) => ({
              label: network.name,
              value: network.chainId,
            })),
          },
        ]}
        value={selectedNetworkOption}
        onChange={setSelectedNetworkOption}
        placeholder="Select chain..."
        size="md"
        tagVariant="solid"
        chakraStyles={{
          menuList: (provided) => ({
            ...provided,
            bg: "brand.black",
          }),
          option: (provided, state) => ({
            ...provided,
            color: "white",
            bg: state.isFocused ? "whiteAlpha500" : "brand.lightBlack",
          }),
          groupHeading: (provided, state) => ({
            ...provided,
            h: "1px",
            borderTop: "1px solid white",
            bg: "brand.black",
          }),
        }}
        closeMenuOnSelect
        useBasicStyles
      />
    </Box>
  );
}

export default NetworkInput;
