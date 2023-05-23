import ContentList from '../../content/components/ContentList';
import { Box, VStack, Button, Text, Tabs, TabList, Tab, TabPanels, TabPanel } from '@chakra-ui/react';
import { useDispatch } from 'react-redux';
import { popSaveStack } from '../../editor/editorSlice';

const Sidebar = () => {
  const dispatch = useDispatch();
    return (
      <Box
       boxShadow="lg"
       borderRadius="sm" 
      //  borderRight="2px"
      //  borderColor="gray.400"
       bg="white"
       p={4}
       height="100vh"
       overflowY="auto"
      >
        <Tabs variant="enclosed">
          <TabList>
            <Tab >Content</Tab>
            <Tab>Folios</Tab>
            <Tab>Document</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <ContentList />
            </TabPanel>
            <TabPanel>
              <VStack width="100%" alignItems="flex-start">
                <Text>No folios.</Text>
                <Button>+ Smart Folio</Button>
              </VStack>
              

            </TabPanel>
            <TabPanel>
              <VStack width="100%" alignItems="flex-start">
              <Button onClick={()=>dispatch(popSaveStack())}>Restore</Button>
              <p>No document selected.</p>
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    );
};

export default Sidebar;