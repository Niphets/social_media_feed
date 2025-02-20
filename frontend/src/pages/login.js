import React, { useState } from "react";
import axios from "axios";
import {TextField, Button, Typography, Paper, Box } from "@mui/material";
import { useNavigate } from "react-router-dom";

const Login = ({ setUser }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const response = await axios.post("http://localhost:5000/login", { email, password });
      localStorage.setItem("token", response.data.token);
      
      setUser(response.data.user);
      alert("Login successful");
      navigate("/"); 
    } catch (error) {
      console.error("Login failed:", error);
      alert("Invalid credentials");
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(to right, #1e3c72, #2a5298)",
      }}
    >
      <Paper
        elevation={5}
        sx={{
          padding: "30px",
          width: "100%",
          maxWidth: "400px",
          textAlign: "center",
          borderRadius: "12px",
          background: "white",
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: "bold", color: "#1e3c72", marginBottom: "20px" }}>
          Login
        </Typography>
        <TextField
          fullWidth
          label="Email"
          variant="outlined"
          margin="normal"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          sx={{ backgroundColor: "#f9f9f9", borderRadius: "8px" }}
        />
        <TextField
          fullWidth
          label="Password"
          variant="outlined"
          margin="normal"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          sx={{ backgroundColor: "#f9f9f9", borderRadius: "8px" }}
        />
        <Button
          variant="contained"
          color="primary"
          fullWidth
          sx={{
            mt: 2,
            padding: "12px",
            fontSize: "16px",
            fontWeight: "bold",
            backgroundColor: "#2a5298",
            "&:hover": { backgroundColor: "#1e3c72" },
          }}
          onClick={handleLogin}
        >
          Login
        </Button>
      </Paper>
    </Box>
  );
};

export default Login;
