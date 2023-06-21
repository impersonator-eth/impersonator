import { useState, useEffect } from "react";
import {
  Alert,
  AlertIcon,
  CloseButton,
  Text,
  Link,
  HStack,
} from "@chakra-ui/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDiscord } from "@fortawesome/free-brands-svg-icons";
import { ExternalLinkIcon } from "@chakra-ui/icons";

const CLOSED_KEY = "discord-notif-closed";

function NotificationBar() {
  const isClosed = localStorage.getItem(CLOSED_KEY);

  const [isVisible, setIsVisible] = useState(
    isClosed === "true" ? false : true
  );

  useEffect(() => {
    if (!isVisible) {
      localStorage.setItem(CLOSED_KEY, "true");
    }
  }, [isVisible]);

  return isVisible ? (
    <Alert status="info">
      <AlertIcon />
      <HStack flex={1}>
        <Text>Share feature requests, report bugs and be the first to</Text>{" "}
        <Text fontWeight={"semibold"}>try beta versions</Text>
        <Text> by joining us on</Text>
        <Link
          href={"https://discord.gg/4VTnuVzfmm"}
          color="cyan.300"
          isExternal
        >
          <HStack>
            <FontAwesomeIcon icon={faDiscord} size="1x" />
            <Text>Discord</Text>
            <ExternalLinkIcon />
          </HStack>
        </Link>
      </HStack>
      <CloseButton
        alignSelf="flex-start"
        position="relative"
        right={-1}
        top={-1}
        onClick={() => setIsVisible(false)}
      />
    </Alert>
  ) : (
    <></>
  );
}

export default NotificationBar;
