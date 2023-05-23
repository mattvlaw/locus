import React, { useState } from 'react';
import { Button, FormControl, FormLabel, Input } from '@chakra-ui/react';
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { setUser } from '../userSlice';
import api from "../../../api";

const LoginForm = () => {
  const dispatch = useDispatch();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      console.log(api);
      const response = await api.post('/login', { username, password });
      if (response.status === 200) {
        // Handle successful login
        dispatch(setUser(response.data.user));
      }
    } catch (error) {
      // Handle failed login
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <FormControl>
        <FormLabel>Username</FormLabel>
        <Input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </FormControl>
      <FormControl>
        <FormLabel>Password</FormLabel>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </FormControl>
      <Button type="submit">Log In</Button>
    </form>
  );
};

export default LoginForm;
