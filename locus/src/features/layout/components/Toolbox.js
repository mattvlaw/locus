import React from 'react';
import { Box, Tabs, TabList, Tab, TabPanels, TabPanel } from '@chakra-ui/react';
import { ChatIcon, EditIcon, LinkIcon } from '@chakra-ui/icons';
import ChatBox from '../../chat/components/ChatBox';
import HighlightsList from '../../highlights/HighlightsList';

const Toolbox = () => {
  return (
    <Tabs variant="enclosed" orientation="vertical" width="100%" height="100%">
      <TabList>
        <Tab><ChatIcon /></Tab>
        <Tab><EditIcon /></Tab>
        <Tab><LinkIcon /></Tab>
      </TabList>

      <TabPanels>
        <TabPanel>
          <ChatBox />
        </TabPanel>
        <TabPanel>
          <Box p={4} bg="gray.100" borderRadius="md">
            Add a Note
          </Box>
          <HighlightsList />
        </TabPanel>
        <TabPanel>
          <Box p={4} bg="gray.100" borderRadius="md">
            Related Content
          </Box>
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
};

export default Toolbox;
