import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchContent } from "../contentSlice";
import api from "../../../api";
import {
  Box,
  Button,
  Divider,
  IconButton,
  Heading,
  VStack,
  HStack,
  UnorderedList,
  Input,
  Text,
  Accordion,
  AccordionItem,
  AccordionPanel,
  AccordionIcon,
  AccordionButton,
  Checkbox
} from "@chakra-ui/react";
import ContentItem from "./ContentItem";
import { setContent, setId, setTitle, setType, setDelta, setAuthors, setFilename } from "../../editor/editorSlice";
import { SearchIcon, RepeatIcon, AddIcon, ArrowForwardIcon } from "@chakra-ui/icons";

import Quill from 'quill';

export const convertDeltaToHtml = (delta) => {
  const quill = new Quill(document.createElement('div'));
  quill.setContents(delta);
  return quill.root.innerHTML;
};

const ContentList = ({ onSelect }) => {
  const dispatch = useDispatch();
  const documents = useSelector((state) => state.content.documents);
  
  // const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);
  const [filters, setFilters] = useState({
    contentType: ["zotero_entry"],
    startDate: '',
    endDate: ''
  });
  const [filteredDocuments, setFilteredDocuments] = useState(documents);




  // const handleSearchInputChange = (event) => {
  //   setSearchQuery(event.target.value);
  // };

  // const handleFilterChange = (event) => {
  //   const { name, value } = event.target;
  //   console.log(name, value);
  //   setFilters((prevFilters) => ({
  //     ...prevFilters,
  //     [contentType]: value
  //   }));
  //   console.log(filters);
  // };
  const handleContentTypeFilterChange = (event) => {
    const { name, checked } = event.target;
    setFilters((prevFilters) => {
      const updatedContentTypes = checked
        ? [...prevFilters.contentType, name]
        : prevFilters.contentType.filter((type) => type !== name);
      return {
        ...prevFilters,
        contentType: updatedContentTypes,
      };
    });
  };
  const filterDocuments = () => {
    console.log("filtering", filters);
    const searchQuery = searchInputRef.current.value;
    const filtered = documents.filter((doc) => {
      const matchesSearch = searchQuery.length <= 0 || doc.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStartDate = !filters.startDate || new Date(doc.creation_date) >= new Date(filters.startDate);
      const matchesEndDate = !filters.endDate || new Date(doc.creation_date) <= new Date(filters.endDate);
  
      // Update this part to use the new filters structure
      // const matchesContentType = filters.contentType.length === 0 || filters.contentType.includes(doc.content_type);
      // don't show anything if no content type is selected
      const matchesContentType = filters.contentType.includes(doc.content_type);
  
      return matchesSearch  && matchesStartDate && matchesEndDate && matchesContentType;
    });
  
    setFilteredDocuments(filtered);
  };
  useEffect(() => {
    filterDocuments();
  }, [documents, filters]);

  // useEffect(() => {
  //   const fetchData = async () => {
  //     await dispatch(fetchContent());
  //     filterDocuments();
  //   };

  //   fetchData();
  // }, [dispatch]);

  const loadQuillDoc = (item) =>{
    dispatch(setContent(convertDeltaToHtml(JSON.parse(item.content_metadata))));
    dispatch(setDelta(item.content_metadata));
    dispatch(setFilename(""));
  }

  const loadPdf = (item) =>{
    dispatch(setFilename(item.filename));
    dispatch(setContent(""));
    dispatch(setDelta(""));
  }

  const handleClick = (item) => {
    dispatch(setId(item.id))
    dispatch(setTitle(item.title));
    dispatch(setType(item.content_type));
    dispatch(setAuthors(item.authors));
    if(item.content_type==="zotero_entry"){
      loadPdf(item);
    }
    else{
      console.log("quilling");
      loadQuillDoc(item);
    }
    
  };

  const handleSyncClick = async () => {
    await api.post("/sync");
    dispatch(fetchContent());
  };

  const handleNewClick = () => {
    dispatch(setId(undefined));
    dispatch(setTitle(""));
    dispatch(setType(""));
    dispatch(setContent(""));
    dispatch(setDelta(""));
    dispatch(setAuthors([]));
  }

  return (
    <Box maxWidth="100%">
      {/* <Button onClick={handleSyncClick} colorScheme="blue" mb={4}>
        Sync Zotero
      </Button> */}
      {/*search bar here*/}
      
      
      <VStack align="start" spacing={4}>
        
          {/* <Heading as="h2" size="md">
            Papers
          </Heading> */}
          <Box boxShadow="md">
          <HStack>
            <Input placeholder='Search Content'
              ref={searchInputRef}
              // value={searchQuery}
              // onChange={handleSearchInputChange}
            />
            < IconButton  aria-label="Search content" onClick={filterDocuments} icon={<SearchIcon />} />
            < IconButton aria-label="Sync with Zotero" icon={<RepeatIcon />} onClick={handleSyncClick} />
            < IconButton aria-label="New content" icon={<AddIcon />} onClick={handleNewClick} />
          </HStack>
          </Box>
          <Accordion allowToggle width="100%">
            <AccordionItem>
              <h2>
                <AccordionButton>
                  <Box as="span" flex='1' textAlign='left'>
                    Filters
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
              </h2>
              <AccordionPanel pb={4}>
              <HStack>
                <Checkbox
                  name="zotero_entry"
                  onChange={handleContentTypeFilterChange}
                  defaultChecked
                >
                  Zotero Entry
                </Checkbox>
                <Checkbox
                  name="note"
                  onChange={handleContentTypeFilterChange}
                >
                  Note
                </Checkbox>
                <Checkbox
                  name="summary"
                  onChange={handleContentTypeFilterChange}
                >
                  Summary
                </Checkbox>
              </HStack>

              </AccordionPanel>
            </AccordionItem>
          </Accordion>
          <HStack justifyContent="flex-end">
            <Text>Selected Documents</Text>
            <ArrowForwardIcon />
          </HStack>
        {/* <Divider /> */}
        <UnorderedList styleType="none" maxWidth="100%">
          {filteredDocuments.map((paper) => (
            // <ContentItem key={paper.id} title={paper.title} {...paper} onSelect={() => handleClick(paper)} />
            <ContentItem
              key={paper.id}
              title={paper.title}
              content_type={paper.content_type}
              content_id = {paper.id}
              zotero_key = {paper.zotero_key}
              isDownloadable={paper.content_type === 'zotero_entry' && 'attachment' in paper.content_metadata.links}
              isDownloaded = {paper.filename != null}
              onSelect={() => handleClick(paper)}
            />
          ))}
        </UnorderedList>
      </VStack>
    </Box>
  );
};

export default ContentList;
