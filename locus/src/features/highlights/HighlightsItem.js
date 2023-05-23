import React from 'react';
import { useDispatch } from 'react-redux';
import { ListItem, Text, Box } from '@chakra-ui/react';
import { setScrollTo } from '../editor/editorSlice';

const HighlightsItem = ({ highlight }) => {
    const dispatch = useDispatch();

    const handleClick = () => {
        console.log("Highlight clicked:", highlight);
        dispatch(setScrollTo(highlight));
    };

    return (
        <ListItem width="100%" mt={2} key={highlight.id} onClick={handleClick} cursor="pointer" >
            <Box bg="gray.100" width="100%"  border={"2px black solid"}>
                <Text>{highlight.content.content_metadata.text}</Text>
            </Box>
        </ListItem>
    );
};

export { HighlightsItem };