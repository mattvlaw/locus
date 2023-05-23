import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Box, HStack, Select, Input, IconButton, Icon } from '@chakra-ui/react';
import { FaRegSave, FaSearch } from 'react-icons/fa';
import { setTitle, setType, addAuthor } from '../editorSlice';
import { saveQuillDocument } from '../../content/contentSlice';


const EditorMenu = ({ quillRef }) => {
    const dispatch = useDispatch();
    const { id, title, content, type, delta, authors } = useSelector((state) => state.editor);
    const { user, isAuthenticated } = useSelector((state) => state.user);
    const [searchText, setSearchText] = useState('');

    const handleTypeChange = (e) => {
        dispatch(setType(e.target.value));
    };

    const handleTitleChange = (e) => {
        dispatch(setTitle(e.target.value));
    };

    const handleSave = async () => {
        const new_authors = [...authors];
        if(!authors.some(author => author['id'] === user.author_id)){
            new_authors.push({ id: user.author_id, first_name: user.first_name, last_name: user.last_name })
            dispatch(addAuthor({ id: user.author_id, first_name: user.first_name, last_name: user.last_name }))
        }
        const documentData = { id, title, content, type, delta, authors: new_authors };
        dispatch(saveQuillDocument(documentData));
    };

    const handleSearch = (e) => {
        if(e.target.value === '') {
            const quill = quillRef.current.getEditor();
            quill.focus();
            quill.formatText(0, quill.getLength(), { background: null });
        }
        setSearchText(e.target.value);
    };

    const highlightSearch = () => {
        console.log("Searching for: ", searchText);
        const quill = quillRef.current.getEditor();
        quill.focus();
    
        // Remove previous highlights
        quill.formatText(0, quill.getLength(), { background: null });
    
        if (!searchText) return;
    
        let currentIndex = 0;
        while (currentIndex < quill.getLength()) {
            console.log(quill.getText())
          const startIndex = quill.getText().indexOf(searchText, currentIndex);
    
          if (startIndex === -1) {
            console.log("No more matches found")
            break;
          }
    
          currentIndex = startIndex + searchText.length;
          console.log("Found match at: ", startIndex, " to ", currentIndex, "");
          quill.formatText(startIndex, searchText.length, { background: 'yellow' });
        }
      };

    return (
        <Box width="100%" height="60px" bg="gray.100" zIndex="1">
            <HStack>
                <Select value={type} onChange={handleTypeChange} placeholder="Document Type">
                    <option value="note">Note</option>
                    <option value="summary">Summary</option>
                    <option value="transcript">Transcript</option>
                </Select>
                <Input value={title} onChange={handleTitleChange} variant="flushed" size="lg" placeholder="Untitled Document" />
                <Input value={searchText} onChange={handleSearch} placeholder="Find" />
                <IconButton aria-label="Search" onClick={highlightSearch} icon={<Icon as={FaSearch} />} />
                <IconButton aria-label="Save" onClick={handleSave} icon={<Icon as={FaRegSave} />} />
            </HStack>
        </Box>
    );
}

export default EditorMenu;