import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import store from "./redux/reducers/store";
import { ChakraProvider } from "@chakra-ui/react";
import "./index.css";
import theme from './theme'
import App from "./App";
// import * as serviceWorker from "./serviceWorker";
import reportWebVitals from './reportWebVitals';
import '@fontsource/montserrat/400.css'
import '@fontsource/lato/400.css'
import '@fontsource/roboto/400.css'
import '@fontsource/roboto-slab/400.css'

// const root = ReactDOM.createRoot(document.getElementById('root'));
ReactDOM.render(
  <Provider store={store}>
    <ChakraProvider theme={theme}>
      <App />
    </ChakraProvider>
  </Provider>,
  document.getElementById('root')
);
// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
// serviceWorker.unregister();


