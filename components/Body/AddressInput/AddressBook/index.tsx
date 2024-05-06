import { useState, useEffect } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  HStack,
  ModalCloseButton,
  ModalBody,
  Text,
  Input,
  Center,
  Button,
  Box,
} from "@chakra-ui/react";
import { DeleteIcon } from "@chakra-ui/icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSave } from "@fortawesome/free-solid-svg-icons";
import { slicedText } from "../../TransactionRequests";

const STORAGE_KEY = "address-book";

interface SavedAddressInfo {
  address: string;
  label: string;
}

interface AddressBookParams {
  isAddressBookOpen: boolean;
  closeAddressBook: () => void;
  showAddress: string;
  setShowAddress: (value: string) => void;
  setAddress: (value: string) => void;
}

function AddressBook({
  isAddressBookOpen,
  closeAddressBook,
  showAddress,
  setShowAddress,
  setAddress,
}: AddressBookParams) {
  const [newAddressInput, setNewAddressInput] = useState<string>("");
  const [newLableInput, setNewLabelInput] = useState<string>("");
  const [savedAddresses, setSavedAddresses] = useState<SavedAddressInfo[]>([]);

  useEffect(() => {
    setSavedAddresses(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"));
  }, []);

  useEffect(() => {
    setNewAddressInput(showAddress);
  }, [showAddress]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedAddresses));
  }, [savedAddresses]);

  // reset label when modal is reopened
  useEffect(() => {
    setNewLabelInput("");
  }, [isAddressBookOpen]);

  return (
    <Modal isOpen={isAddressBookOpen} onClose={closeAddressBook} isCentered>
      <ModalOverlay bg="none" backdropFilter="auto" backdropBlur="5px" />
      <ModalContent
        minW={{
          base: 0,
          sm: "30rem",
          md: "40rem",
          lg: "60rem",
        }}
        pb="6"
        bg={"brand.lightBlack"}
      >
        <ModalHeader>Address Book</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <HStack>
            <Input
              placeholder="address / ens"
              value={newAddressInput}
              onChange={(e) => setNewAddressInput(e.target.value)}
            />
            <Input
              placeholder="label"
              value={newLableInput}
              onChange={(e) => setNewLabelInput(e.target.value)}
            />
          </HStack>
          <Center mt="3">
            <Button
              colorScheme={"blue"}
              isDisabled={
                newAddressInput.length === 0 || newLableInput.length === 0
              }
              onClick={() =>
                setSavedAddresses([
                  ...savedAddresses,
                  {
                    address: newAddressInput,
                    label: newLableInput,
                  },
                ])
              }
            >
              <HStack>
                <FontAwesomeIcon icon={faSave} />
                <Text>Save</Text>
              </HStack>
            </Button>
          </Center>
          {savedAddresses.length > 0 && (
            <Box mt="6" px="20">
              <Text fontWeight={"bold"}>Select from saved addresses:</Text>
              <Box mt="3" px="10">
                {savedAddresses.map(({ address, label }, i) => (
                  <HStack key={i} mt="2">
                    <Button
                      key={i}
                      w="100%"
                      onClick={() => {
                        setShowAddress(address);
                        setAddress(address);
                        closeAddressBook();
                      }}
                    >
                      {label} (
                      {address.indexOf(".eth") >= 0
                        ? address
                        : slicedText(address)}
                      )
                    </Button>
                    <Button
                      ml="2"
                      _hover={{
                        bg: "red.500",
                      }}
                      onClick={() => {
                        const _savedAddresses = savedAddresses;
                        _savedAddresses.splice(i, 1);

                        // using spread operator, else useEffect doesn't detect state change
                        setSavedAddresses([..._savedAddresses]);
                      }}
                    >
                      <DeleteIcon />
                    </Button>
                  </HStack>
                ))}
              </Box>
            </Box>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

export default AddressBook;
