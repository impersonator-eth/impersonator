import {
  Center,
  InputGroup,
  Input,
  InputRightElement,
  Button,
} from "@chakra-ui/react";
import { CloseIcon } from "@chakra-ui/icons";

interface DappsSearchParams {
  searchSafeDapp: string | undefined;
  setSearchSafeDapp: (value: string) => void;
}

function DappsSearch({ searchSafeDapp, setSearchSafeDapp }: DappsSearchParams) {
  return (
    <Center pb="0.5rem">
      <InputGroup maxW="30rem">
        <Input
          placeholder="search 🔎"
          value={searchSafeDapp}
          onChange={(e) => setSearchSafeDapp(e.target.value)}
        />
        {searchSafeDapp && (
          <InputRightElement width="3rem">
            <Button
              size="xs"
              variant={"ghost"}
              onClick={() => setSearchSafeDapp("")}
            >
              <CloseIcon />
            </Button>
          </InputRightElement>
        )}
      </InputGroup>
    </Center>
  );
}

export default DappsSearch;
