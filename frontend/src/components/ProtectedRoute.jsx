import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  // check if the user object exist in localStorage
  const user = localStorage.getItem("user");

  // if no user is found, redirect to the Login page
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // if user exists, render the protected component (children)
  return children;
};

export default ProtectedRoute;
