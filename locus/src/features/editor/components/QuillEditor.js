import hljs from 'highlight.js'

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setContent, setId, setTitle, setType, setDelta, setAuthors, setFilename, pushSaveStack, popSaveStack } from "../editorSlice";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import Quill from 'quill';
import QuillMarkdown from 'quilljs-markdown';
import CitationAutocomplete from './CitationAutocomplete';
import { toRange, fromRange } from "dom-anchor-text-quote";
import CitationLinkBlot from './CitationLinkBlot';
import { loadDoc } from '../actions';
// import hljs from 'highlight.js'

import 'highlight.js/styles/monokai-sublime.css'


window.hljs = hljs;
// Register the quilljs-markdown module
Quill.register('modules/markdown', QuillMarkdown);
Quill.register('formats/citation-link',CitationLinkBlot);

const QuillEditor = ({quillRef}) => {
  const dispatch = useDispatch();
  const content = useSelector((state) => state.editor.content);
  const documents = useSelector((state) => state.content.documents);
  const doc_id = useSelector((state) => state.editor.id);
  // const quill = quillRef.current.getEditor();
  const highlights = useSelector((state) => state.editor.highlights) // dict of highlights
  const docHighlights = Object.values(highlights).filter(highlight => highlight.content.content_metadata.doc_id == doc_id)
  // const saveddelta = useSelector((state) => state.editor.delta);
  // useEffect(() => {
  //   dispatch(setContent(''));
  // }, [dispatch]);

  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompletePosition, setAutocompletePosition] = useState({ left: 0, top: 0 });
  const [suggestions, setSuggestions] = useState([]);
  //for the autocomplete replace text functionality:
  const [selectionRange, setSelectionRange] = useState(null);
  const [citeStartIndex, setCiteStartIndex] = useState(0);


  // backup option to load saved delta to the content editor
  // if you want to use this, define a loadingFlag in the editorSlice and set it to true in the useEffect below
  // so this doesn't run except when loading
  // useEffect(() => {
  //   if (saveddelta && quillRef && quillRef.current && isLoadingDelta) {
  //     const quill = quillRef.current.getEditor();
  //     quill.setContents(JSON.parse(saveddelta));
  //      dispatch(setLoadingDelta(false));
  //   }
  // }, [saveddelta, quillRef]);

  const handleChange = (content, delta, source, editor) => {
    dispatch(setDelta(JSON.stringify(editor.getContents())));
    dispatch(setContent(content));
    // show the autocomplete if the user is typing a citation
    // consider making this a separate function
    const range = editor.getSelection();
    // console.log("Range is: ",range);
    if (range) {
      const textBeforeCursor = editor.getText(0, range.index);
      // console.log("Text before cursor is: ",textBeforeCursor);
      const citeCommand = '\\cite{';
      const citeIndex = textBeforeCursor.lastIndexOf(citeCommand);

      if (citeIndex !== -1) {
        // console.log("got cite command");
        setCiteStartIndex(citeIndex);
        const typedText = textBeforeCursor.slice(citeIndex + citeCommand.length);
        if(typedText.length > 0){
          setShowAutocomplete(true);

          // Get the position of the cursor to display the autocomplete dropdown
          const bounds = editor.getBounds(range.index);
          setAutocompletePosition({ left: bounds.left, top: bounds.top + bounds.height });

        // Fetch suggestions based on the typedText
        
          getSuggestions(typedText);
          // Store the range when the user types the citation
          setSelectionRange(range);
        }
      } else {
        setShowAutocomplete(false);
      }
    }

    // render annotations
    // if (source === 'user') {
    //   highlights.forEach((highlight) => {
    //     renderHighlight(highlight);
    //   });
    // }
  };
  const handleSelect = (suggestion) => {
    const editor = quillRef.current.getEditor();
    const range = selectionRange;
    if (range && citeStartIndex) {
      console.log(suggestion);
      console.log("range: ",range);
      const documentUrl = `/documents/${suggestion.id}`; // Replace with the actual document URL
      // console.log("delete range",range.index - '\\cite{'.length, '\\cite{'.length)
      // editor.deleteText(range.index - '\\cite{'.length, '\\cite{'.length);
      editor.deleteText(citeStartIndex, range.index-citeStartIndex);
      // const linkIndex = range.index - '\\cite{'.length;
      const linkIndex = citeStartIndex;
      const authors = suggestion.content_metadata.creators.map(creator => creator.lastName);
      let authorString;
      if(authors.length > 2){
        authorString = authors[0] + " et al.";
      } else if (authors.length == 2){
        authorString = authors[0] + " & " + authors[1];
      } else {
        authorString = authors[0];
      }
      // editor.insertText(linkIndex, authorString, 'link', documentUrl);
      // editor.formatText(linkIndex, authorString.length, { 'link': documentUrl, 'class': 'citation-link' });
      // editor.setSelection(linkIndex + authorString.length);

      // Insert the author link using the custom blot
    // editor.insertEmbed(linkIndex, 'citation-link', {
    //   url: documentUrl,
    //   authorId: suggestion.id,
    // });
    // editor.insertText(linkIndex + 1, authorString);
      // Insert the custom blot using the insertEmbed method
    editor.insertEmbed(citeStartIndex, 'citation-link', {
      url: documentUrl,
      docId: suggestion.id, 
      text: authorString,
    }, 'api');

    // let citation = {
    //   url: documentUrl,
    //   authorId: suggestion.id, 
    //   text: authorString,
    // };
    
    // let index = citeStartIndex;
    // let length = authorString.length;
    
    // insert the text
    // editor.insertText(index, citation.text);
    
    // apply the citation-link format to the inserted text
    // editor.formatText(index, length, 'citation-link', citation);
    editor.setSelection(citeStartIndex + authorString.length);
    // editor.setSelection(linkIndex + authorString.length);
      setShowAutocomplete(false);
      setCiteStartIndex(0);
    }
  };

  const handleClick = (event) => {
    const target = event.target;
    const link = target.closest('a.citation-link'); // Check for the specific class name
  
    if (link && link.getAttribute('href')) {
      const documentUrl = link.getAttribute('href');
      const documentId = parseInt(link.getAttribute('data-doc-id'));
      event.preventDefault(); // Prevent the default link navigation
      console.log('clicked citation link', documentId);
      //get the document item from the documents array based on the id
      const documentItem = documents.find((document) => document.id === documentId);
      console.log(documentItem);
      dispatch(pushSaveStack());
      loadDoc(documentItem, dispatch);

      // Navigate to the documentUrl
      // For example, if you're using React Router:
      // history.push(documentUrl);
    }
    // For non-citation links, the default behavior will not be prevented
  };
  const getSuggestions = (search_string) => {
    console.log("getting suggestions");
    // Filter suggestions from state.contents.documents based on typedText
    const filteredSuggestions = documents.filter((document) => {
      // Check if the document's title or author contains the typedText
      // Modify the condition based on your specific data structure
      // Fetch suggestions from the content documents array
      let matchTitle;
      let matchAuthor;
      if(document.content_type === "zotero_entry"){
        matchTitle = document.content_metadata.title.toLowerCase().includes(search_string.toLowerCase());
        // check if the search string is in one of the authors' first names or last names in the author array
        matchAuthor = document.authors.some((author) => {
            return author.first_name.toLowerCase().includes(search_string.toLowerCase()) || 
            author.last_name.toLowerCase().includes(search_string.toLowerCase());
        });
      }
      else{
        return false;
      }
      
      return matchTitle || matchAuthor;
    });
  
    // Update the suggestions in the state
    console.log(filteredSuggestions);
    setSuggestions(filteredSuggestions);
};
  

/*
  // quill.on('text-change', handleTextChange);
  const quillContainer = quill.container.closest('.ql-container');
  quillContainer.addEventListener('scroll', handleScroll);

  const renderHighlight = (highlight) => {
    const leaf = quill.getLeaf(0);
    const leafElement = leaf[0].domNode.parentElement;
    const range = fromRange(leafElement, highlight.ranges[0]);
  
    if (range) {
      quill.formatText(range.start, range.end - range.start, 'highlight', highlight.id);
    }
  }

  const handleScroll = () => {
    const viewportTop = quillContainer.scrollTop;
    const viewportBottom = viewportTop + quillContainer.clientHeight;
  
    const firstVisibleIndex = quill.getIndex(quill.getBounds(0));
    const lastVisibleIndex = quill.getIndex(quill.getBounds(quill.getLength()));
  
    updateVisibleHighlights(firstVisibleIndex, lastVisibleIndex);
  }
  
  const updateVisibleHighlights = (firstVisibleIndex, lastVisibleIndex) => {
    const buffer = 50;
    highlights.forEach((highlight) => {
      const highlightPosition = findHighlightPosition(highlight.delta);
      if (
        highlightPosition >= firstVisibleIndex - buffer &&
        highlightPosition <= lastVisibleIndex + buffer
      ) {
        renderHighlight(highlight);
      } else {
        removeHighlight(highlight);
      }
    });
  }
  

  const removeHighlight = (highlight) => {
    const highlighted = document.querySelector(`[data-annotation-id="${highlight.id}"]`);
    if (highlighted) {
      highlighted.classList.remove('highlighted-text');
      highlighted.removeAttribute('data-annotation-id');
    }
  }

  // REFACTOR: MOVE THIS TO THE EDITOR BAR!
  function saveDocument() {
    // Apply the pending changes to the stored annotations
    pendingChanges.forEach((delta) => {
      updateHighlights(delta);
    });
  
    // Clear the pendingChanges array
    pendingChanges.length = 0;
  
    // Save the updated document and annotations
    // ...
  }
  */
  

  const modules = {
    // syntax: {
    //   highlight: text => hljs.highlightAuto(text).value
    // },
    syntax: false,
    toolbar: [
      [{ header: [1, 2, false] }],
      ['bold', 'italic', 'underline'],
      ['link', 'blockquote'],
      ['code-block'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['markdown'],
    ],
    markdown: {},
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline',
    'link', 'blockquote',
    'code-block',
    'list', 'bullet',
    'background',
    'citation-link'
  ];

  return (
    <div className="quill-editor-container" onClick={handleClick}>
      <ReactQuill
        ref={quillRef}
        value={content}
        onChange={handleChange}
        modules={modules}
        formats={formats}
        height="100%"
        theme="snow"
      />
      <CitationAutocomplete
        quillRef={quillRef}
        show={showAutocomplete}
        position={autocompletePosition}
        suggestions={suggestions}
        onSelect={handleSelect}
      />
    </div>
  );
};

export default QuillEditor;
