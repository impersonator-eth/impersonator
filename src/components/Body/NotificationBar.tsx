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

// const CLOSED_KEY = "discord-notif-closed";

function NotificationBar() {
  // const isClosed = localStorage.getItem(CLOSED_KEY);

  // const [isVisible, setIsVisible] = useState(
  //   isClosed === "true" ? false : true
  // );

  // useEffect(() => {
  //   if (!isVisible) {
  //     localStorage.setItem(CLOSED_KEY, "true");
  //   }
  // }, [isVisible]);

  const [donor, setDonor] = useState<string>();

  useEffect(() => {
    axios
      .get("https://api.impersonator.xyz/api")
      .then((res) => {
        setDonor(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

  return donor ? (
    <Alert status="info">
      <Center w="100%">
        <Text>
          <span style={{ fontSize: "1.2rem" }}>🏆</span> Thanks to{" "}
          <span style={{ fontWeight: "bold" }}>{donor}</span> for donating in
          Gitcoin Grants #18
        </Text>
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
