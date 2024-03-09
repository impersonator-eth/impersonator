import {
  Input,
  Button,
  Box,
  Text,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Tooltip,
  HStack,
  chakra,
  ListItem,
  List,
  useDisclosure,
} from "@chakra-ui/react";
import { SettingsIcon, InfoIcon } from "@chakra-ui/icons";

interface TenderlySettingsParams {
  tenderlyForkId: string;
  setTenderlyForkId: (value: string) => void;
}

function TenderlySettings({
  tenderlyForkId,
  setTenderlyForkId,
}: TenderlySettingsParams) {
  const { onOpen, onClose, isOpen } = useDisclosure();

  return (
    <Popover
      placement="bottom-start"
      isOpen={isOpen}
      onOpen={onOpen}
      onClose={onClose}
    >
      <PopoverTrigger>
        <Box>
          <Button>
            <SettingsIcon
              transition="900ms rotate ease-in-out"
              transform={isOpen ? "rotate(33deg)" : "rotate(0deg)"}
            />
          </Button>
        </Box>
      </PopoverTrigger>
      <PopoverContent
        border={0}
        bg="brand.lightBlack"
        boxShadow="xl"
        rounded="xl"
        overflowY="auto"
      >
        <Box px="1rem" py="1rem">
          <HStack>
            <Text>(optional) Tenderly Fork Id:</Text>
            <Tooltip
              label={
                <>
                  <Text>Simulate sending transactions on forked node.</Text>
                  <chakra.hr bg="gray.400" />
                  <List>
                    <ListItem>
                      Create a fork on Tenderly and grab it's id from the URL.
                    </ListItem>
                  </List>
                </>
              }
              hasArrow
              placement="top"
            >
              <InfoIcon />
            </Tooltip>
          </HStack>
          <Input
            mt="0.5rem"
            aria-label="fork-rpc"
            placeholder="xxxx-xxxx-xxxx-xxxx"
            autoComplete="off"
            value={tenderlyForkId}
            onChange={(e) => {
              setTenderlyForkId(e.target.value);
            }}
          />
        </Box>
      </PopoverContent>
    </Popover>
  );
}

export default TenderlySettings;
