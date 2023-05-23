import React from 'react';
import {
  Box,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useDisclosure,
  Button,
  Flex,
  useBreakpointValue,
} from '@chakra-ui/react';
import Sidebar from './Sidebar';
import FloatingButton from "./FloatingButton";
import MainArea from './MainArea';
import MainAreaColumns from './MainAreaColumns';

const ResponsiveContentList = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const isDrawer = useBreakpointValue({ base: true, lg: false });

  return (
    <Flex>
      {isDrawer ? (
        <>
          <FloatingButton onClick={onOpen} />
          <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
            <DrawerOverlay>
              <DrawerContent>
                <DrawerCloseButton />
                <DrawerHeader>Content List</DrawerHeader>
                <DrawerBody>
                  <Sidebar />
                </DrawerBody>
              </DrawerContent>
            </DrawerOverlay>
          </Drawer>
        </>
      ) : (
        <Box as="nav" width="300px" paddingRight="0">
          <Sidebar />
        </Box>
      )}
      <Box flex="1" paddingTop="0" paddingRight="4" paddingBottom="4" paddingLeft="0">
        {/* Main content area */}
        <MainAreaColumns />
      </Box>
    </Flex>
  );
};

export default ResponsiveContentList;
