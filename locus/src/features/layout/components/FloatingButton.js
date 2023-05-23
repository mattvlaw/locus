import React from "react";
import { IconButton } from "@chakra-ui/react";
import { ChevronRightIcon } from "@chakra-ui/icons";

const FloatingButton = ({ onClick }) => {
  return (
    <IconButton
      position="fixed"
      left="0"
      top="50%"
      transform="translateY(-50%)"
      variant="outline"
      colorScheme="blue"
      aria-label="Open Sidebar"
      fontSize="20px"
      icon={<ChevronRightIcon />}
      onClick={onClick}
    />
  );
};

export default FloatingButton;