import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { addDocument } from "../contentSlice";

const AddContent = () => {
  const dispatch = useDispatch();
  const [title, setTitle] = useState("");
  const [isPaper, setIsPaper] = useState(true);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    dispatch(addDocument({ id: Date.now(), title }));
    
    setTitle("");
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Enter title"
      />
      <label>
        <input
          type="radio"
          value="paper"
          checked={isPaper}
          onChange={() => setIsPaper(true)}
        />
        Paper
      </label>
      <label>
        <input
          type="radio"
          value="customPage"
          checked={!isPaper}
          onChange={() => setIsPaper(false)}
        />
        Custom Page
      </label>
      <button type="submit">Add</button>
    </form>
  );
};

export default AddContent;
