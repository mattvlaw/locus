// src/api.js
import axios from "axios";

const api = axios.create({
  // baseURL: "http://localhost:5000", // Replace with the appropriate base URL for your Flask app
  baseURL: "http://locus.hirobotics.org/api/"
});

export default api;
