import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  id: undefined,
  title: '',
  content: '',
  type: '',
  delta: '',
  filename: '',
  authors: [],
  highlights: {},
  currentHighlight: null,
  scrollTo: null,
  saveStack: [],
};

const editorSlice = createSlice({
  name: 'editor',
  initialState,
  reducers: {
    setId: (state, action) => {
      state.id = action.payload;
    },
    setContent: (state, action) => {
      state.content = action.payload;
    },
    setTitle: (state, action) => {
      state.title = action.payload;
    },
    setType: (state, action) => {
      state.type = action.payload;
    },
    setDelta: (state, action) => {
      state.delta = action.payload;
    },
    setAuthors: (state, action) => {
      state.authors = action.payload;
    },
    setFilename: (state, action) => {
      state.filename = action.payload;
    },
    addAuthor: (state, action) => {
      state.authors.push(action.payload);
    },
    setHighlights: (state, action) => {
      state.highlights = action.payload;
    },
    addHighlight: (state, action) => {
      console.log(action);
      const highlight_id = action.payload.id
      state.highlights[highlight_id] = action.payload;
      state.currentHighlight = highlight_id; // Set the "currentHighlight" to the added highlight
    },
    setCurrentHighlight: (state, action) => {
      state.currentHighlight = action.payload;
    },
    setScrollTo: (state, action) => {
      state.scrollTo = action.payload;
    },
    pushSaveStack: (state, action) => {
      // Push the current state onto the save stack
      state.saveStack.push({
        id: state.id,
        title: state.title,
        content: state.content,
        type: state.type,
        delta: state.delta,
        filename: state.filename,
        authors: state.authors,
        highlights: state.highlights,
        currentHighlight: state.currentHighlight,
        scrollTo: state.scrollTo,
      });
    },
    popSaveStack: (state, action) => {
      // restore the previous state from the save stack
      const previousState = state.saveStack.pop();
      if(previousState != undefined){
      state.id = previousState.id;
      state.title = previousState.title;
      state.content = previousState.content;
      state.type = previousState.type;
      state.delta = previousState.delta;
      state.filename = previousState.filename;
      state.authors = previousState.authors;
      state.highlights = previousState.highlights;
      state.currentHighlight = previousState.currentHighlight;
      state.scrollTo = previousState.scrollTo;
      }
    }
  },
});

export const { setId, setContent, setTitle, setType, setDelta, setAuthors, setFilename, addAuthor, setHighlights, addHighlight, setCurrentHighlight, setScrollTo, pushSaveStack, popSaveStack } = editorSlice.actions;

export default editorSlice.reducer;
