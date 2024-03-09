import {
  FormControl,
  FormLabel,
  InputGroup,
  Input,
  InputRightElement,
  Button,
  HStack,
  useDisclosure,
} from "@chakra-ui/react";
import { DeleteIcon } from "@chakra-ui/icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBook } from "@fortawesome/free-solid-svg-icons";
import AddressBook from "./AddressBook";

interface AddressInputParams {
  showAddress: string;
  setShowAddress: (value: string) => void;
  setAddress: (value: string) => void;
  setIsAddressValid: (value: boolean) => void;
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
  isAddressValid,
  selectedTabIndex,
  isConnected,
  appUrl,
  isIFrameLoading,
  updateAddress,
}: AddressInputParams) {
  const {
    isOpen: isAddressBookOpen,
    onOpen: openAddressBook,
    onClose: closeAddressBook,
  } = useDisclosure();

  return (
    <FormControl>
      <FormLabel>Enter Address or ENS to Impersonate</FormLabel>
      <HStack>
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
            bg={"brand.lightBlack"}
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
        <Button onClick={openAddressBook}>
          <FontAwesomeIcon icon={faBook} />
        </Button>
        <AddressBook
          isAddressBookOpen={isAddressBookOpen}
          closeAddressBook={closeAddressBook}
          showAddress={showAddress}
          setShowAddress={setShowAddress}
          setAddress={setAddress}
        />
      </HStack>
    </FormControl>
  );
}

export default AddressInput;
