import React, { useState, useEffect, useRef } from 'react';
import {
  PdfLoader,
  PdfHighlighter,
  Tip,
  Highlight,
} from 'react-pdf-highlighter';
import { useDispatch, useSelector } from 'react-redux';
import { setHighlights, addHighlight, setCurrentHighlight } from '../../highlights/highlightsSlice';
import { createHighlight } from '../../highlights/actions';
import { Box } from '@chakra-ui/react';
import api from '../../../api';


import "react-pdf-highlighter/dist/esm/style/AreaHighlight.css";
import "react-pdf-highlighter/dist/esm/style/Highlight.css";
import "react-pdf-highlighter/dist/esm/style/MouseSelection.css";
import "react-pdf-highlighter/dist/esm/style/PdfHighlighter.css";
import "react-pdf-highlighter/dist/esm/style/Tip.css";
import "react-pdf-highlighter/dist/esm/style/pdf_viewer.css";


const HighlighterPDFViewer = () => {
  const filename = useSelector((state) => state.editor.filename);
  const doc_id = useSelector((state) => state.editor.id); 
  const axiosBaseUrl = api.defaults.baseURL;
  const attachmentUrl = `${axiosBaseUrl}/attachment/${filename}`;
  const dispatch = useDispatch();
  const highlights = useSelector((state) => state.highlights.highlights);
  const doc = useSelector((state) => state.content.documents.find(obj => obj.id === doc_id));

  const copyToClipboard = (text) => {
    const authorstring = doc.authors.map(author => author.last_name).join(", ");
    const copyText = text+"\n *From "+doc.title+"* by "+authorstring+"\n";
    navigator.clipboard.writeText(copyText);
  }
  const onHighlightSelect = (position, content, hideTipAndSelection, transformSelection) => {
    // dispatch(setHighlights([{ content, position }]));
    return (
      <Tip
        onOpen={transformSelection}
        onConfirm={(comment) => {
        //   addHighlight({ content, position, comment });
          let contentObj = {
            title: content.text.slice(0, 20),
            content_metadata: {
                doc_id: doc_id,
                position: position,
                text: content.text,
                comment: comment
            }
          }
          dispatch(createHighlight(contentObj, content.text));
          copyToClipboard(content.text);
          hideTipAndSelection();
          console.log({ content, position, comment })
          
        }}
      />
    );
  };
  const handleHighlightClick = (highlight) => {
    // Custom behavior when the highlight is clicked
    console.log('Highlight clicked:', highlight);
    dispatch(setCurrentHighlight(highlight.id));
    copyToClipboard(highlight.content.content_metadata.text);    
  };

  
  const pdfHighlighterRef = useRef(null);
  const scrollToData = useSelector((state) => state.editor.scrollTo);

  useEffect(() => {
    if (scrollToData) {
      // const { pageNumber, position } = scrollToData;
      console.log("scrolling to", scrollToData);
      if (pdfHighlighterRef.current) {
        // console.log("scrolling to page", pageNumber, "position", position);
        pdfHighlighterRef.current.scrollTo(scrollToData);
      }
    }
  }, [scrollToData]);

  const renderHighlight = (
        highlight,
        index,
        setTip,
        hideTip,
        viewportToScaled,
        screenshot,
        isScrolledTo) => (
    <Highlight 
      key={index} 
      position={highlight.position} 
      onClick={(e)=>handleHighlightClick(highlight)} 
      isScrolledTo={scrollToData && scrollToData.pageNumber === highlight.position.pageNumber}
    />
  );
 
  return (
    <Box>
      <PdfLoader url={attachmentUrl}>
        {(pdfDocument) => (
          <PdfHighlighter
            ref={pdfHighlighterRef}
            pdfDocument={pdfDocument}
            onSelectionFinished={onHighlightSelect}
            highlightTransform={renderHighlight}
            highlights={Object.values(highlights).filter(highlight => highlight.content.content_metadata.doc_id == doc_id)}
            onScrollChange={() => {}}
          />
        )}
      </PdfLoader>
    </Box>
  );
};

export default HighlighterPDFViewer;

// import React, { useState } from "react";
// import { Document, Page, pdfjs } from "react-pdf";
// import { useDispatch, useSelector } from "react-redux";
// import { PdfHighlighter, Tip } from "react-pdf-highlighter";
// import { setHighlights, addHighlight } from "../editorSlice";
// import api from "../../../api";

// // import "react-pdf-highlighter/dist/style.css";

// pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

// const HighlighterPDFViewer = () => {
//   const [numPages, setNumPages] = useState(null);
//   const filename = useSelector((state) => state.editor.filename);
//   const axiosBaseUrl = api.defaults.baseURL;
//   const attachmentUrl = `${axiosBaseUrl}/attachment/${filename}`;
//   const dispatch = useDispatch();

//   const onDocumentLoadSuccess = ({ numPages }) => {
//     setNumPages(numPages);
//   };
//   const onHighlightSelect = (highlight) => {
//     // 'highlight' is an object containing the selected text and other properties
//     // You can add this object to your state (e.g., a 'highlights' array) to store the highlighted text
//     console.log(highlight);
//     dispatch(setHighlights([highlight]));
//   };

//   return (
//     <div>
//       <PdfHighlighter
//         url={attachmentUrl}
//         onDocumentLoadSuccess={onDocumentLoadSuccess}
//         onSelectionFinished={onHighlightSelect}
//       >
//         {(highlight, position) => (
//           <Tip
//             key={highlight.id}
//             highlight={highlight}
//             position={position}
//           />
//         )}
//       </PdfHighlighter>
//       {Array.from(new Array(numPages), (el, index) => (
//         <Document
//           key={`page_${index + 1}`}
//           file={attachmentUrl}
//           onLoadSuccess={onDocumentLoadSuccess}
//         >
//           <Page pageNumber={index + 1} />
//         </Document>
//       ))}
//     </div>
//   );
// };

// export default HighlighterPDFViewer;

// import React, { useState } from "react";
// import { Document, Page, pdfjs } from "react-pdf";
// import { useDispatch, useSelector } from 'react-redux';
// import { PdfHighlighter } from "react-pdf-highlighter";
// import { setHighlights, addHighlight } from '../editorSlice';
// import api from "../../../api";

// // import "react-pdf-highlighter/dist/style.css";

// pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

// const HighlighterPDFViewer = () => {
//     const [numPages, setNumPages] = useState(null);
//     const filename = useSelector((state) => state.editor.filename);
//     const axiosBaseUrl = api.defaults.baseURL;
//     const attachmentUrl = `${axiosBaseUrl}/attachment/${filename}`;
//     const dispatch = useDispatch();
    
//     const onDocumentLoadSuccess = ({ numPages }) => {
//       setNumPages(numPages);
//     };
//     const onHighlightSelect = (highlight) => {
//         // 'highlight' is an object containing the selected text and other properties
//         // You can add this object to your state (e.g., a 'highlights' array) to store the highlighted text
//         dispatch(setHighlights([highlight]));
//       };
  
//     return (
//       <div>
//         <PdfHighlighter
//           url={attachmentUrl}
//           onDocumentLoadSuccess={onDocumentLoadSuccess}
//           onSelect={onHighlightSelect}
//         />
//         {Array.from(new Array(numPages), (el, index) => (
//           <Document
//             key={`page_${index + 1}`}
//             file={attachmentUrl}
//             onLoadSuccess={onDocumentLoadSuccess}
//           >
//             <Page pageNumber={index + 1} />
//           </Document>
//         ))}
//       </div>
//     );
//   };
  
//   export default HighlighterPDFViewer;