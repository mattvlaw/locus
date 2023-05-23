import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api"


const initialState = {
  documents: [],
  selected: {}
};

export const fetchContent = createAsyncThunk("content/fetchContent", async () => {
  const response = await api.get("/content");
  return response.data;
});

export const saveQuillDocument = createAsyncThunk("content/saveQuillDocument", async (documentData) => {
  const response = await api.post("/save_quill", documentData);
  return response.data;
});


const contentSlice = createSlice({
  name: "content",
  initialState,
  reducers: {
    addDocument: (state, action) => {
      state.documents.push(action.payload);
    },
    selectDocument: (state, action) => {
      state.selected[action.payload.id] = true;
    },
    deselectDocument: (state, action) => {
      // delete action.payload.id from state.selected
      delete state.selected[action.payload.id];
    },
    toggleSelectDocument: (state, action) => {
      if (state.selected[action.payload.id]) {
        delete state.selected[action.payload.id];
      } else {
        state.selected[action.payload.id] = true;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchContent.fulfilled, (state, action) => {
        // Replace the current state with the fetched content
        state.documents = action.payload;
        // state.customPages = action.payload.customPages;
      })
      .addCase(saveQuillDocument.fulfilled, (state, action) => {
        if (action.payload.error){
          console.log(action.payload.error);
          return;
        }
        else{
          state.documents = action.payload.saved_content;
        }
        
      });
  },
});

export const { addDocument, selectDocument, deselectDocument, toggleSelectDocument } = contentSlice.actions;

export default contentSlice.reducer;
