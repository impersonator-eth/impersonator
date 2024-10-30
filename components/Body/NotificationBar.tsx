import { useState, useEffect } from "react";
import {
  Alert,
  AlertIcon,
  CloseButton,
  Text,
  Link,
  HStack,
  Center,
} from "@chakra-ui/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDiscord } from "@fortawesome/free-brands-svg-icons";
import { ExternalLinkIcon } from "@chakra-ui/icons";
import axios from "axios";

const CLOSED_KEY = "new-ui-notif-closed";

function NotificationBar() {
  const isClosed = localStorage.getItem(CLOSED_KEY);

  // const [isVisible, setIsVisible] = useState(
  //   isClosed === "true" ? false : true
  // );

  // useEffect(() => {
  //   if (!isVisible) {
  //     localStorage.setItem(CLOSED_KEY, "true");
  //   }
  // }, [isVisible]);

  // const [donor, setDonor] = useState<string>();

  // useEffect(() => {
  //   axios
  //     .get("https://api.impersonator.xyz/api")
  //     .then((res) => {
  //       setDonor(res.data);
  //     })
  //     .catch((err) => {
  //       console.log(err);
  //     });
  // }, []);

  return process.env.NEXT_PUBLIC_GITCOIN_GRANTS_ACTIVE === "true" ? (
    <Alert status="info" bg={"#151515"}>
      <Center w="100%">
        <Link
          href={process.env.NEXT_PUBLIC_GITCOIN_GRANTS_LINK}
          isExternal
          _hover={{
            textDecor: "none",
          }}
        >
          <HStack
            position="relative"
            sx={{
              "&::after": {
                content: '""',
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: "2px",
                background: "linear-gradient(90deg, #FF0080, #7928CA, #FF0080)",
                backgroundSize: "200% 100%",
                animation: "gradient 3s linear infinite",
                "@keyframes gradient": {
                  "0%": { backgroundPosition: "0% 0%" },
                  "100%": { backgroundPosition: "200% 0%" },
                },
              },
            }}
          >
            <Text>Support on</Text>

            <HStack ml={-0.5} fontWeight="bold">
              <Text>Gitcoin Grants</Text>
              <ExternalLinkIcon />
            </HStack>
          </HStack>
        </Link>
      </Center>
      {/* <CloseButton
        alignSelf="flex-start"
        position="relative"
        right={-1}
        top={-1}
        onClick={() => setIsVisible(false)}
      /> */}
    </Alert>
  ) : null;
}

export default NotificationBar;
