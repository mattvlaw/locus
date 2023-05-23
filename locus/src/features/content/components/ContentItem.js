import React from "react";
import { Box, Flex, IconButton, Text, Tooltip, ListItem, Checkbox } from "@chakra-ui/react";
import { DownloadIcon, CheckCircleIcon, AttachmentIcon } from "@chakra-ui/icons";
import api from "../../../api"
import { toggleSelectDocument } from "../contentSlice";
import { fetchContent } from "../contentSlice";
import { useDispatch, useSelector } from "react-redux";


const ContentItem = ({ title, content_type, content_id, zotero_key, hasPdf, isDownloadable, isDownloaded, onSelect }) => {
  const dispatch = useDispatch();
  const selectedDocs = useSelector((state) => state.content.selected);

  const handleDownloadPdf = async () => {
    // download a pdf and refetch the content list
    await api.post("/dl_zotero", {id:content_id, zotero_key, content_type});
    dispatch(fetchContent());
  };

  const handleUploadPdf = () => {
    // Implement the actual upload logic here
  };

  return (
    <ListItem maxWidth="100%">
        <Flex
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start"
        borderBottom="1px"
        borderColor="gray.300"
        py={2}
        >
        <Checkbox 
          size="lg" 
          spacing="2rem" 
          mr={2} 
          onChange={(e)=>dispatch(toggleSelectDocument({id:content_id}))}
          // isChecked={selectedDocs.includes(content_id)}
          isChecked={content_id in selectedDocs}
        />
        <Tooltip label={title} hasArrow>
            <Text
            onClick={onSelect}
            cursor="pointer"
            maxWidth="80%"
            overflow="hidden"
            whiteSpace="nowrap"
            textOverflow="ellipsis"
            >
            {title}
            </Text>
        </Tooltip>
        <Box>
            {hasPdf ? (
            <CheckCircleIcon />
            ) : isDownloadable ? (
            <IconButton
                onClick={handleDownloadPdf}
                aria-label="Download PDF"
                icon={<DownloadIcon />}
                isDisabled={isDownloaded}
            />
            ) : (
            <IconButton
                onClick={handleUploadPdf}
                aria-label="Upload PDF"
                icon={<AttachmentIcon />}
            />
            )}
        </Box>
        
        </Flex>
    </ListItem>
  );
};

export default ContentItem;
