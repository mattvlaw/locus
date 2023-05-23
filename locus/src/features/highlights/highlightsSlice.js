import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    annotations: {},
    highlights: {}
};

const highlightsSlice = createSlice({
    name: 'highlights',
    initialState,
    reducers: {
        setHighlights: (state, action) => {
            state.highlights = action.payload;
        },
        addHighlight: (state, action) => {
            console.log(action);
            const highlight_id = action.payload.id
            state.highlights[highlight_id] = action.payload;
            state.currentHighlight = highlight_id; // Set the "currentHighlight" to the added highlight
        },
        updateHighlight: (state, action) => {
            state.highlights[action.payload.id] = action.payload;
        },
        removeHighlight: (state, action) => {
            // FIX THIS: HIGHLIGHTS IS A DICT, NOT AN ARRAY
            state.annotations = state.annotations.filter(
                (annotation) => annotation.id !== action.payload.id
            );
        },
        updateHighlightsAfterEdit: (state, action) => {
            // Apply the changes based on the action.payload.delta
            // Update the stored annotations accordingly
            // ...
        },
        setCurrentHighlight: (state, action) => {
            state.currentHighlight = action.payload;
        }
    },
});

export const {
    setHighlights,
    addHighlight,
    updateHighlight,
    removeHighlight,
    updateHighlightsAfterEdit,
    setCurrentHighlight
} = highlightsSlice.actions;

export default highlightsSlice.reducer;
