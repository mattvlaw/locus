import React from 'react';
import { useSelector } from 'react-redux';
import { Box, Text, UnorderedList, ListItem } from '@chakra-ui/react';
import { HighlightsItem} from './HighlightsItem';


const HighlightsList = () => {
    const highlights = useSelector(state => state.highlights.highlights);
    const doc_id = useSelector(state => state.editor.id);
  
    if (!doc_id) {
        return <Text>Select a Document</Text>;
    }
    else if (!highlights) {
        return <Text>No highlights</Text>;
    }
    else {
        const doc_highlights = Object.values(highlights).filter(highlight => highlight.content.content_metadata.doc_id === doc_id);
        return (
            <Box>
                <UnorderedList styleType="none" maxWidth="100%" spacing={4}>
                {doc_highlights.map((highlight) => {
                    console.log(highlight);
                    return (
                        <HighlightsItem key={highlight.id} highlight={highlight} />
                    );
                })}
                </UnorderedList>
            </Box>
        );
    }
    
}

export default HighlightsList;