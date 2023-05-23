import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

const CitationAutocomplete = ({ quillRef, show, position, suggestions, onSelect }) => {
  

  const contents = useSelector((state) => state.content.documents);

  // const fetchSuggestions = (search_string) => {
  //   // Fetch suggestions from the content documents array
  //   return contents.filter((content) => {
  //       const matchTitle = content.content_metadata.title.toLowerCase().includes(search_string.toLowerCase());
  //       // check if the search string is in one of the authors' first names or last names in the author array
  //       const matchAuthor = content.content_metadata.authors.some((author) => {
  //           return author.first_name.toLowerCase().includes(search_string.toLowerCase()) || 
  //           author.last_name.toLowerCase().includes(search_string.toLowerCase());
  //       });
  //       }
  //   )};


  // useEffect(() => {
  //   if (show) {
  //     // Fetch suggestions from the content state
  //     const suggestions = fetchSuggestions(search_string);
  //     setSuggestions(suggestions);
  //   }
  // }, [show]);

  const handleSelect = (suggestion) => {
    onSelect(suggestion);
    // setSuggestions([]);
  };

  return (
    <div
      id="autocomplete"
      style={{
        display: show ? 'block' : 'none',
        backgroundColor: 'gray',
        position: 'absolute',
        left: position.left,
        top: position.top,
        zIndex: 1000,
        // Add any additional styling for the autocomplete dropdown
      }}
    >
      {suggestions.map((suggestion) => (
        <div key={suggestion.id} onClick={() => handleSelect(suggestion)}>
          {suggestion.title}
        </div>
      ))}
    </div>
  );
};

export default CitationAutocomplete;
