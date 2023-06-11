import { Button, useToast } from "@chakra-ui/react";
import { CopyIcon } from "@chakra-ui/icons";

const CopyToClipboard = ({ txt }: { txt: string }) => {
  const toast = useToast();

  return (
    <Button
      onClick={() => {
        navigator.clipboard.writeText(txt);
        toast({
          title: "Copied to clipboard",
          status: "success",
          isClosable: true,
          duration: 1000,
        });
      }}
      size="sm"
    >
      <CopyIcon />
    </Button>
  );
};

export default CopyToClipboard;
