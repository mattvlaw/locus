import React, { useRef } from 'react';
import { useSelector } from 'react-redux';

import { Box, VStack } from '@chakra-ui/react';

import EditorMenu from './EditorMenu';
import QuillEditor from './QuillEditor';
import HighlighterPdfViewer from './HighlighterPdfEditor';

const ContentEditor = () => {
    const quillRef = useRef();
    const content_type = useSelector((state) => state.editor.type);
    let editor = undefined;
    if(content_type === 'zotero_entry'){
        editor = (
            <VStack width="100%" alignItems="flex-start">
                <HighlighterPdfViewer />
            </VStack>
        )
    }
    else{
        editor = (
            <VStack width="100%">
                <EditorMenu quillRef={quillRef} />                
                <Box width="100%">
                    <QuillEditor quillRef={quillRef} />
                </Box>
                
            </VStack>
        )
    }
    return (
        
        <Box width="100%" height="100%" bg="blue.100" p={0} overflow="auto">
            
            <Box bg="white" height="100%" boxShadow="md" border="2px" borderColor="gray.300">
                {editor}
            </Box>
            
        </Box>
        
    );
}

export default ContentEditor;