import { combineReducers } from "redux";
import contentReducer from "../../features/content/contentSlice";
import editorReducer from "../../features/editor/editorSlice";
import userReducer from "../../features/user/userSlice";
import chatReducer from "../../features/chat/chatSlice";
import highlightsReducer from "../../features/highlights/highlightsSlice";

const rootReducer = combineReducers({
  content: contentReducer,
  editor: editorReducer,
  user: userReducer,
  chat: chatReducer,
  highlights: highlightsReducer
  // add other feature reducers here
});

export default rootReducer;
