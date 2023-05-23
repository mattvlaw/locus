import React, { useState, useEffect, useRef } from 'react';
import { Box, Text, Textarea, VStack, HStack, Button, Select, FormControl, FormLabel, Switch} from '@chakra-ui/react';

import io from 'socket.io-client';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; // import styles
import { setInputMessage, setSelectedMessage, setMessages, addMessage, appendToLastMessage, setIsWaiting, setStartedStreaming, setChatId, clearChat, loadChat } from '../chatSlice';

import { useDispatch, useSelector } from "react-redux";


const ChatBox = () => {
    const dispatch = useDispatch();
    const chat_id = useSelector((state) => state.chat.chat_id);
    const messages = useSelector((state) => state.chat.messages);
    const inputMessage = useSelector((state) => state.chat.inputMessage);
    const selectedMessage = useSelector((state) => state.chat.selectedMessage);
    const isWaiting = useSelector((state) => state.chat.isWaiting);
    const username = useSelector((state) => state.user.user ? state.user.user.first_name : undefined);
    const allChats = useSelector((state) => state.chat.allChats);
    
    const [receivingMessage, setReceivingMessage] = useState(false);
    const [includeHighlight, setIncludeHighlight] = useState(false);


    const {title, type, authors, highlights, currentHighlight} = useSelector((state) => state.editor)
  
    
    let highlight;
    if( highlights && currentHighlight in highlights) {
      highlight = highlights[currentHighlight].content.content_metadata.text;
    }
    else{
      highlight = "";
    }
    
    const socketRef = useRef();

    const receivingMessageRef = useRef(receivingMessage);

    useEffect(() => {
      receivingMessageRef.current = receivingMessage;
    }, [receivingMessage]);

    useEffect(() => {
      const handleLLMResponse = (response) => {
        console.log("Got a response from the server: ", response);
        if (!receivingMessageRef.current) {
          if (response.content === null) {
              return; //don't add leading null messages.
          }
          setReceivingMessage(true);
          dispatch(addMessage({ type: "llm", name: "llm", content: response.content }));
          dispatch(setChatId(response.id));  // Update chat_id in the Redux store
      } 
        else if(response.is_final) {
          //final message is null, so don't add it.
          dispatch(setIsWaiting(false));
          setReceivingMessage(false);
        } 
        else {
          dispatch(appendToLastMessage(response.content));
        }
        
      };
    
      socketRef.current = io.connect("http://locus.hirobotics.org/api"); // Connect to your Flask server
      socketRef.current.on("llm_response", handleLLMResponse);
    
      // Cleanup function
      return () => {
        socketRef.current.off("llm_response", handleLLMResponse);
      };
    }, []);

    const sendMessage = (e) => {
      e.preventDefault();
      dispatch(setIsWaiting(true));
      const content = (selectedMessage && selectedMessage.length > 0) ? selectedMessage : inputMessage;
      dispatch(addMessage({ type: 'user', name: username, content: content }));
      const doc = {title, type, authors, "summary":""};
      const payload = {content, doc, highlight: includeHighlight ? highlight : "", id: chat_id};
      socketRef.current.emit('user_message', payload);
      dispatch(setInputMessage(''));
  };
    
      const handleInputMessageChange = (e) => {
        if(selectedMessage && selectedMessage.length > 0) dispatch(setSelectedMessage(''));
        dispatch(setInputMessage(e.target.value));
      };
    
      const handleSelectedMessageChange = (e) => {
        console.log("Selected message: ", e.target.value)
        dispatch(setSelectedMessage(e.target.value));
      };

      const [loadingChatId, setLoadingChatId] = useState(null);

      const handleLoadChat = (e) => {
        e.preventDefault();
        dispatch(loadChat(allChats[loadingChatId]));
      }

      const formatMessage = (message) => {
        let name;
        if(message.role === 'user'){
          name = username;
        }
        else{
          name = 'llm';
        }
        return name+': '+message.content;
      }
      return (
        <VStack width="100%" spacing={4}>
          <Button p={4} width="100%" bg="gray.100" borderRadius="md" onClick={(e)=>{console.log("clearing"); dispatch(clearChat());}}>
            Start New Conversation
          </Button>
          <HStack width="100%">
            <Select width="100%" value={loadingChatId} onChange={(e)=>setLoadingChatId(e.target.value)}>
              {Object.entries(allChats).map((chat, index) => {
                  const chat_id = chat[0];
                  const chat_content = chat[1].content_metadata.chat.messages;
                  if(chat_content.length > 0 && chat_content[0].content.length > 0){
                    return <option key={index} value={chat_id}>{chat_content[0].content.substring(0,30)}</option>
                  }
                  else{
                    return <option key={index} value={chat_id}>{"Chat "+chat_id}</option>
                  }
                    
                }                
              )}
            </Select>
            <Button onClick={handleLoadChat}>Load</Button>
          </HStack>
          <Box width="100%" height="300px" overflowY="scroll" border="1px solid" borderColor="gray.300">
            {messages.map((message, index) => (
              <ReactQuill
                key={index}
                value={formatMessage(message)}
                readOnly
                theme={message.type === 'llm' ? 'snow' : null}
                modules={{"toolbar": false}}
              />
            ))}
          </Box>
          <Select value={selectedMessage} onChange={handleSelectedMessageChange}>
            <option value="">Select a predefined message</option>
            <option value="please_explain">Explain this</option>
            <option value="dont_understand">I don't understand</option>
            <option value="critique">Critique this</option>
            {/* Add more predefined messages here */}
          </Select>
          <Textarea
            placeholder="Type your message..."
            value={inputMessage}
            onChange={handleInputMessageChange}
            isDisabled={isWaiting}
          />
          <HStack>
            <VStack>
              <FormControl display="flex" alignItems="center">
                  <FormLabel htmlFor="include-highlight" mb="0">
                    Include Highlighted Text:
                  </FormLabel>
                  <Switch
                    id="include-highlight"
                    isChecked={includeHighlight}
                    onChange={(e)=>setIncludeHighlight(e.target.checked)}
                  />
              </FormControl>
              {highlight.length > 0 && <Text>{highlight.substring(0,20)}...</Text>}
            </VStack>
            <Button onClick={sendMessage} isDisabled={isWaiting}>
              Send
            </Button>
          </HStack>
        </VStack>
      );
    };
    
    export default ChatBox;
        
  

// const ChatBox = () => {
//   const dispatch = useDispatch();
//   const { highlights } = useSelector((state) => state.editor);
//     console.log("highlights: ", highlights)

//   return (
//     <Box>
//         Highlights:
//         {highlights && highlights.map((highlight, index) => (
//             <Text key={index}>{highlight.content.text}</Text>
//         ))}
    
//     </Box>
//   );

// }

// export default ChatBox;