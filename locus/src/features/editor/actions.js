// src/actions/highlightActions.js
import api from '../../api';
import { setContent, setId, setTitle, setType, setDelta, setAuthors, setFilename, pushSaveStack, popSaveStack, addHighlight, setHighlights} from "./editorSlice";
import { arrayToDict } from '../../utils';
import { convertDeltaToHtml } from '../content/components/ContentList';

// Asynchronous action to create a highlight
export const createHighlight = (content, highlightText) => {
    //content should have title, comment, and position
    console.log("content", content)
  return (dispatch) => {
    // Make a POST request to the backend's /create_highlight endpoint
    api.post('/create_highlight', { content, highlight_text: highlightText })
    // .then(response => response.json())
    .then(data => {
        console.log("data ", data);
      // Get the new highlight's ID from the response
      const saved_highlight = data.data;

      // Update the Redux state with the new highlight
      const newHighlight = { id: saved_highlight.id, content: saved_highlight, position: saved_highlight.content_metadata.position};
      console.log(newHighlight);
      dispatch(addHighlight(newHighlight));
    })
    .catch(error => {
      console.error('Error creating highlight:', error);
    });
  };
};

const processHighlights = (highlights) => {
    const resultDict = {}
    for (const highlight of highlights) {
        resultDict[highlight.id] = {id: highlight.id, content: highlight, position: highlight.content_metadata.position};
    }
    return resultDict;
}

  // Function to fetch highlights from the backend and update the state
  export const fetchHighlights = async (dispatch) => {
    try {
      const response = await api.get('/highlights')
      const highlights = processHighlights(response.data)
      dispatch(setHighlights(highlights)); // Update the Redux state with the retrieved highlights
    } catch (error) {
      console.error('Error fetching highlights:', error);
    }
  };

  export const loadPdf = (item, dispatch) =>{
    dispatch(setFilename(item.filename));
    dispatch(setContent(""));
    dispatch(setDelta(""));
  }
  export const loadQuillDoc = (item, dispatch) =>{
    dispatch(setContent(convertDeltaToHtml(JSON.parse(item.content_metadata))));
    dispatch(setDelta(item.content_metadata));
    dispatch(setFilename(""));
  }

  export const loadDoc = (item, dispatch) => {
    dispatch(setId(item.id))
    dispatch(setTitle(item.title));
    dispatch(setType(item.content_type));
    dispatch(setAuthors(item.authors));
    if(item.content_type==="zotero_entry"){
      loadPdf(item, dispatch);
    }
    else{
      console.log("quilling");
      loadQuillDoc(item, dispatch);
    }
    
  };