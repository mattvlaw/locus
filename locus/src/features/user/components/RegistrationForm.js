import React, { useState } from 'react';
import { Button, FormControl, FormLabel, Input } from '@chakra-ui/react';
import { useDispatch } from 'react-redux';
import { setUser } from '../userSlice';
import api from "../../../api";

const RegistrationForm = () => {

  const dispatch = useDispatch();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await api.post('/register', { username: username, password: password, first_name: firstName, last_name: lastName });
      if (response.status === 201) {
        // Handle successful registration
        dispatch(setUser(response.data.user));
      }
    } catch (error) {
      // Handle failed registration
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <FormControl>
        <FormLabel>First Name</FormLabel>
        <Input
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />
      </FormControl>
      <FormControl>
        <FormLabel>Last Name</FormLabel>
        <Input
          type="text"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />
      </FormControl>
      <FormControl>
        <FormLabel>Username</FormLabel>
        <Input
          type="text"
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
      <Button type="submit">Register</Button>
    </form>
  );
};

export default RegistrationForm;
