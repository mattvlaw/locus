import React from 'react';
import logo from './logo.svg';
import './App.css';
import locuscat from './locuscat.png';

import ContentList from "./features/content/components/ContentList";
import ResponsiveLayout from "./features/layout/components/ResponsiveLayout";
import AddContent from "./features/content/components/AddContent";
import ContentView from "./features/content/components/ContentView";
import { useSelector, useDispatch } from 'react-redux';

import AuthModal from './features/user/components/AuthModal';
import { HStack, Image, useDisclosure, Heading, Flex, Icon, IconButton } from '@chakra-ui/react';
import { MdLogout } from 'react-icons/md';
import { logout } from './features/user/userSlice';
import { fetchHighlights } from './features/highlights/actions';
import { fetchChats } from './features/chat/actions';
import { fetchContent } from './features/content/contentSlice';


function App() {
  const isAuthenticated = useSelector((state) => state.user.isAuthenticated);
  const user = useSelector((state) => state.user.user);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const dispatch = useDispatch();
  React.useEffect(() => {
    if (!isAuthenticated) {
      onOpen();
    }
    else {
      fetchHighlights(dispatch);
      fetchChats(dispatch);
      dispatch(fetchContent());
    }
  }, [isAuthenticated, onOpen]);
  
  return (
    <div className="App">
    <header className="App-header">
      <Flex alignItems="center" justifyContent="space-between" width="100%" pl={2} pr={6}>
        <Flex alignItems="center" spacing={4}>
          <Image src={locuscat} boxSize={20} alt="Logo" pr={2} />
          <Heading as="h1" size="2xl">Research Management</Heading>
        </Flex>
        {isAuthenticated && <Heading as="h3" size="md">Welcome, {user.first_name} {user.last_name}. 
        <IconButton variant="outline" ml={5} onClick={(e)=>dispatch(logout())}>
          <Icon as={MdLogout} />
          </IconButton> </Heading>}
      </Flex>
    </header>
    <main>
      {/* <AddContent /> */}
      <ResponsiveLayout />
      <AuthModal isOpen={!isAuthenticated} onClose={onClose} />
    </main>
  </div>
  );
}

export default App;
