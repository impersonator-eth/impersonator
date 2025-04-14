import { useState, useEffect } from "react";
import {
  Alert,
  AlertIcon,
  CloseButton,
  Text,
  Link,
  HStack,
  Center,
  useBreakpointValue,
} from "@chakra-ui/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDiscord } from "@fortawesome/free-brands-svg-icons";
import { ExternalLinkIcon } from "@chakra-ui/icons";
import axios from "axios";

const CLOSED_KEY = "new-ui-notif-closed";

function NotificationBar() {
  const fontSize = useBreakpointValue({ base: "xs", sm: "sm", md: "md" });
  const padding = useBreakpointValue({ base: 2, sm: 2, md: 3 });

  // const isClosed = localStorage.getItem(CLOSED_KEY);

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
    <Alert
      status="info"
      bg={"blackAlpha.400"}
      py={padding}
      px={4}
      borderBottom="1px solid"
      borderColor="whiteAlpha.200"
      w="100%"
      borderRadius={0}
      margin={0}
    >
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
            <Text fontSize={fontSize}>Support on</Text>

            <HStack ml={-0.5} fontWeight="bold">
              <Text fontSize={fontSize}>Gitcoin Grants</Text>
              <ExternalLinkIcon fontSize={fontSize} />
            </HStack>
          </HStack>
        </Link>
      </Center>
    </Alert>
  ) : null;
}

export default NotificationBar;
