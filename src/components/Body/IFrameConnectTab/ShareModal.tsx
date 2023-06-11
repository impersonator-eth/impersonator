import {
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  Input,
} from "@chakra-ui/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShareAlt } from "@fortawesome/free-solid-svg-icons";
import CopyToClipboard from "../CopyToClipboard";

interface ShareModalParams {
  isOpen: boolean;
  onClose: () => void;
  appUrl: string;
  showAddress: string;
}

function ShareModal({
  isOpen,
  onClose,
  appUrl,
  showAddress,
}: ShareModalParams) {
  const urlToShare = `https://impersonator.xyz/?address=${showAddress}&url=${encodeURI(
    appUrl
  )}`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay bg="none" backdropFilter="auto" backdropBlur="5px" />
      <ModalContent>
        <ModalHeader>
          <HStack>
            <FontAwesomeIcon icon={faShareAlt} />
            <Text>Share</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Text>
            Share this link so that anyone can auto connect to this dapp with
            your provided address!
          </Text>
          <HStack my="3">
            <Input value={urlToShare} isReadOnly />
            <CopyToClipboard txt={urlToShare} />
          </HStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

export default ShareModal;
