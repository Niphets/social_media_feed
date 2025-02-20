import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Register from "./pages/register"
import Auth from "./pages/login";
import Feed from "./pages/feed";  // Import Feed component

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user is already logged in
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Auth setUser={setUser} />} />
        <Route path="/register" element={<Register />} />
        {/* If user is logged in, show Feed; otherwise, redirect to login */}
        <Route path="/" element={user ? <Feed user={user} /> : <Auth setUser={setUser} />} />
      </Routes>
    </Router>
  );
}

export default App;
