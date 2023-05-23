import { createSlice } from '@reduxjs/toolkit';


const storedUser = JSON.parse(localStorage.getItem('user'));
const initialState = storedUser
  ? { isAuthenticated: true, user: storedUser }
  : { isAuthenticated: false, user: null };
// const initialState = {
//   isAuthenticated: false,
//   user: null,
// };

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      localStorage.setItem('user', JSON.stringify(action.payload));
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      localStorage.removeItem('user');
    },
  },
});

export const { setUser, logout } = userSlice.actions;

export default userSlice.reducer;