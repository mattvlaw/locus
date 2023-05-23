import React, { useState } from 'react';
import { Box, VStack } from '@chakra-ui/react';
import { Resizable } from 're-resizable';
import Toolbox from './Toolbox';
import ContentEditor from '../../editor/components/ContentEditor';

const MainAreaColumns = () => {
  return (
    <Box display="flex" width="100%" height="100%">
      <Resizable
        defaultSize={{
            width: '80%',
            height: '100%',
          }}
        handleStyles={{ right: { zIndex: 1 } }}
        maxWidth="90%"
        minWidth="1"
        enable={{
          top: false,
          right: true,
          bottom: false,
          left: false,
          topRight: false,
          bottomRight: false,
          bottomLeft: false,
          topLeft: false
        }}
      >
        <Box width="100%" height="100%" bg="blue.100" p={0} overflow="auto">
          
          <Box bg="white" height="100%" boxShadow="md" border="2px" borderColor="gray.300">
                         
              <ContentEditor />
            
          </Box>
          
        </Box>
      </Resizable>
        <Box 
            width="100%" 
            minWidth="10%"
            height="100%" 
            bg="green.100" 
            p={0} 
            display="flex"
            overflow="auto">
          <Toolbox />
        </Box>
    </Box>
  );
};

export default MainAreaColumns;
