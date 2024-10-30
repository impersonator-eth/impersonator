"use client";

import { useState } from "react";
import {
  Flex,
  VStack,
  Heading,
  Spacer,
  Link,
  Text,
  Alert,
  HStack,
  Stack,
  Center,
  Button,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  SimpleGrid,
  GridItem,
  Input,
  InputGroup,
  Container,
  InputRightElement,
  Box,
} from "@chakra-ui/react";
import { ExternalLinkIcon } from "@chakra-ui/icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { faTwitter, faDiscord } from "@fortawesome/free-brands-svg-icons";
import { useAccount, useNetwork } from "wagmi";
import { sendTransaction } from "wagmi/actions";
import { parseEther } from "viem";
import Confetti from "react-confetti";
import { CustomConnectButton } from "./CustomConnectButton";

const Social = ({ icon, link }: { icon: IconProp; link: string }) => {
  return (
    <Link href={link} isExternal>
      <FontAwesomeIcon icon={icon} size="lg" />
    </Link>
  );
};

function Footer() {
  const { isConnected } = useAccount();
  const { chain } = useNetwork();

  const {
    isOpen: isSupportModalOpen,
    onOpen: openSupportModal,
    onClose: closeSupportModal,
  } = useDisclosure();

  const [donateValue, setDonateValue] = useState<string>();
  const [showConfetti, setShowConfetti] = useState(false);

  const handleDonate = async (value: string) => {
    try {
      await sendTransaction({
        to: process.env.NEXT_PUBLIC_DONATION_ADDRESS!,
        value: parseEther(value),
      });
      launchConfetti();
    } catch {}
  };

  const launchConfetti = () => {
    setShowConfetti(true);
    setTimeout(() => {
      setShowConfetti(false);
    }, 5_000);
  };

  return (
    <Flex py="4" borderTop="2px" borderTopColor={"gray.400"}>
      <Spacer flex="1" />
      {showConfetti && (
        <Box zIndex={9999} position={"fixed"} top={0} left={0}>
          <Confetti
            recycle={false}
            gravity={0.15}
            numberOfPieces={2_000}
            wind={0.005}
          />
        </Box>
      )}
      <VStack>
        <Alert
          status="info"
          bg={"whiteAlpha.200"}
          color="white"
          variant="solid"
          rounded="lg"
        >
          <Stack direction={{ base: "column", md: "row" }}>
            <Center>Found the project helpful?</Center>
            <HStack>
              {process.env.NEXT_PUBLIC_GITCOIN_GRANTS_ACTIVE === "true" ? (
                <>
                  <Text>Support it on</Text>
                  <Link
                    href={process.env.NEXT_PUBLIC_GITCOIN_GRANTS_LINK}
                    isExternal
                  >
                    <HStack fontWeight="bold" textDecor="underline">
                      <Text>Gitcoin Grants</Text>
                      <ExternalLinkIcon />
                    </HStack>
                  </Link>
                </>
              ) : (
                <>
                  <Button
                    size={"sm"}
                    fontWeight={"bold"}
                    onClick={() => {
                      openSupportModal();
                    }}
                    bg={"blackAlpha.500"}
                  >
                    Support!
                  </Button>
                  <Modal
                    isOpen={isSupportModalOpen}
                    onClose={closeSupportModal}
                    isCentered
                  >
                    <ModalOverlay
                      bg="none"
                      backdropFilter="auto"
                      backdropBlur="3px"
                    />
                    <ModalContent bg={"brand.lightBlack"}>
                      <ModalHeader>Support</ModalHeader>
                      <ModalCloseButton />
                      <ModalBody pb={6}>
                        <Container>
                          <Center>
                            <CustomConnectButton />
                          </Center>
                          <Text mt={4} size="md">
                            Select amount to donate:
                          </Text>
                          <SimpleGrid mt={3} columns={3}>
                            {["0.001", "0.005", "0.01"].map((value, i) => (
                              <GridItem key={i}>
                                <Center>
                                  <Button
                                    onClick={() => handleDonate(value)}
                                    isDisabled={
                                      !isConnected || chain?.unsupported
                                    }
                                  >
                                    {value} Ξ
                                  </Button>
                                </Center>
                              </GridItem>
                            ))}
                          </SimpleGrid>
                          <Center mt={4}>or</Center>
                          <InputGroup mt={4}>
                            <Input
                              type="number"
                              placeholder="Custom amount"
                              onChange={(e) => setDonateValue(e.target.value)}
                              isDisabled={!isConnected || chain?.unsupported}
                            />
                            <InputRightElement
                              bg="gray.600"
                              fontWeight={"bold"}
                              roundedRight={"lg"}
                            >
                              Ξ
                            </InputRightElement>
                          </InputGroup>
                          <Center mt={2}>
                            <Button
                              onClick={() => {
                                if (donateValue) {
                                  handleDonate(donateValue);
                                }
                              }}
                              isDisabled={!donateValue || chain?.unsupported}
                            >
                              Donate
                            </Button>
                          </Center>
                        </Container>
                      </ModalBody>
                    </ModalContent>
                  </Modal>
                </>
              )}
            </HStack>
          </Stack>
        </Alert>
        <Heading size="md">
          Built by: <Social icon={faTwitter} link="https://x.com/apoorveth" />
          <Link href="https://x.com/apoorveth" isExternal>
            <Text decoration="underline" display="inline">
              @apoorveth
            </Text>{" "}
            <ExternalLinkIcon />
          </Link>
        </Heading>
        <Center pt="1">
          <Link
            href={"https://discord.gg/4VTnuVzfmm"}
            color="twitter.200"
            isExternal
          >
            <FontAwesomeIcon icon={faDiscord} size="2x" />
          </Link>
        </Center>
      </VStack>
      <Spacer flex="1" />
    </Flex>
  );
}

export default Footer;
