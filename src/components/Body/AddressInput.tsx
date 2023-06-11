import {
  FormControl,
  FormLabel,
  InputGroup,
  Input,
  InputRightElement,
  Button,
} from "@chakra-ui/react";
import { DeleteIcon } from "@chakra-ui/icons";

interface AddressInputParams {
  showAddress: string;
  setShowAddress: (value: string) => void;
  setAddress: (value: string) => void;
  setIsAddressValid: (value: boolean) => void;
  bg: string;
  isAddressValid: boolean;
  selectedTabIndex: number;
  isConnected: boolean;
  appUrl: string | undefined;
  isIFrameLoading: boolean;
  updateAddress: () => void;
}

function AddressInput({
  showAddress,
  setShowAddress,
  setAddress,
  setIsAddressValid,
  bg,
  isAddressValid,
  selectedTabIndex,
  isConnected,
  appUrl,
  isIFrameLoading,
  updateAddress,
}: AddressInputParams) {
  return (
    <FormControl>
      <FormLabel>Enter Address or ENS to Impersonate</FormLabel>
      <InputGroup>
        <Input
          placeholder="vitalik.eth"
          autoComplete="off"
          value={showAddress}
          onChange={(e) => {
            const _showAddress = e.target.value;
            setShowAddress(_showAddress);
            setAddress(_showAddress);
            setIsAddressValid(true); // remove inValid warning when user types again
          }}
          bg={bg}
          isInvalid={!isAddressValid}
        />
        {(selectedTabIndex === 0 && isConnected) ||
        (selectedTabIndex === 1 && appUrl && !isIFrameLoading) ? (
          <InputRightElement width="4.5rem" mr="1rem">
            <Button h="1.75rem" size="sm" onClick={updateAddress}>
              Update
            </Button>
          </InputRightElement>
        ) : (
          showAddress && (
            <InputRightElement px="1rem" mr="0.5rem">
              <Button
                h="1.75rem"
                size="sm"
                onClick={() => {
                  setShowAddress("");
                  setAddress("");
                }}
              >
                <DeleteIcon />
              </Button>
            </InputRightElement>
          )
        )}
      </InputGroup>
    </FormControl>
  );
}

export default AddressInput;
