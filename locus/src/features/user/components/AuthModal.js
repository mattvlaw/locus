// src/components/AuthModal.js
import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
} from '@chakra-ui/react';
import LoginForm from './LoginForm';
import RegistrationForm from './RegistrationForm';

const AuthModal = ({ isOpen, onClose }) => {
  const [showLoginForm, setShowLoginForm] = useState(true);

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered={true} closeOnOverlayClick={false}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{showLoginForm ? 'Login' : 'Register'}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {showLoginForm ? <LoginForm /> : <RegistrationForm />}
        </ModalBody>
        <ModalFooter>
          <Button
            variant="link"
            onClick={() => setShowLoginForm(!showLoginForm)}
          >
            {showLoginForm ? 'Create an account' : 'Already have an account?'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AuthModal;
