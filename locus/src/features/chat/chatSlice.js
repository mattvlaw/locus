import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  chat_id: null,
  messages: [],
  inputMessage: "",
  selectedMessage: "",
  isWaiting: false,
  startedStreaming: false,
  allChats: {}
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setChatId: (state, action) => {
      state.chat_id = action.payload;
    },
    addMessage: (state, action) => {
      state.messages.push(action.payload);
    },
    setMessages: (state, action) => {
      state.messages = action.payload;
    },
    appendToLastMessage: (state, action) => {
      state.messages[state.messages.length-1].content += action.payload;
    },
    setInputMessage: (state, action) => {
      state.inputMessage = action.payload;
    },
    setSelectedMessage: (state, action) => {
      state.selectedMessage = action.payload;
    },
    setIsWaiting: (state, action) => {
      state.isWaiting = action.payload;
    },
    setStartedStreaming: (state, action) => {
      state.startedStreaming = action.payload;
    },
    setAllChats: (state, action) => {
      state.allChats = action.payload;
    }
  },
});

export const {
  setChatId,
  addMessage,
  setMessages,
  appendToLastMessage,
  setInputMessage,
  setSelectedMessage,
  setIsWaiting,
  setStartedStreaming,
  setAllChats
} = chatSlice.actions;

export const clearChat = () => {
  return (dispatch) => {
    dispatch(setChatId(null));
    dispatch(setMessages([]));
    dispatch(setInputMessage(""));
    dispatch(setSelectedMessage(""));
    dispatch(setIsWaiting(false));
    dispatch(setStartedStreaming(false));
  }
}
export const loadChat = (chat) => {
  return (dispatch) => {
    dispatch(setChatId(chat.id));
    dispatch(setMessages(chat.content_metadata.chat.messages));
    dispatch(setInputMessage(""));
    dispatch(setSelectedMessage(""));
    dispatch(setIsWaiting(false));
    dispatch(setStartedStreaming(false));
  }
}

export default chatSlice.reducer;
