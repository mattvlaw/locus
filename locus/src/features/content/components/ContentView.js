import React from "react";

const ContentView = ({ content }) => {
  return (
    <div>
      <h2>{content.title}</h2>
      {/* Display content details here */}
    </div>
  );
};

export default ContentView;
