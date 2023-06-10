import { Button } from "@chakra-ui/react";
import { CopyIcon } from "@chakra-ui/icons";

const CopyToClipboard = ({ txt }: { txt: string }) => (
  <Button
    onClick={() => {
      navigator.clipboard.writeText(txt);
    }}
    size="sm"
  >
    <CopyIcon />
  </Button>
);

export default CopyToClipboard;
