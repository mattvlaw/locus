  // src/actions/highlightActions.js
import api from '../../api';
import { setAllChats } from './chatSlice';
import { arrayToDict } from '../../utils';
  

  // Function to fetch Chats from the backend and update the state
  export const fetchChats = async (dispatch) => {
    try {
      const response = await api.get('/chats')
      const allchats = arrayToDict(response.data, 'id')
      dispatch(setAllChats(allchats)); // Update the Redux state with the retrieved highlights
    } catch (error) {
      console.error('Error fetching chats:', error);
    }
  };