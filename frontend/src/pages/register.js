import React, { useState } from "react";
import { TextField, Button, Typography, Paper, Box } from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Register = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleRegister = async () => {
    try {
      const res = await axios.post("http://localhost:5000/register", {
        username,
        email,
        password,
      });
      alert(res.data.message);
      navigate("/login");
    } catch (err) {
      alert(err.response?.data?.error || "Registration failed");
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(to right, #6a11cb, #2575fc)",
      }}
    >
      <Paper
        elevation={6}
        sx={{
          padding: "30px",
          width: "100%",
          maxWidth: "400px",
          textAlign: "center",
          borderRadius: "12px",
          background: "white",
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: "bold", color: "#2575fc", marginBottom: "20px" }}>
          Register
        </Typography>
        <TextField
          fullWidth
          label="Username"
          variant="outlined"
          margin="normal"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          sx={{ backgroundColor: "#f9f9f9", borderRadius: "8px" }}
        />
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
          fullWidth
          sx={{
            mt: 2,
            padding: "12px",
            fontSize: "16px",
            fontWeight: "bold",
            backgroundColor: "#2575fc",
            "&:hover": { backgroundColor: "#6a11cb" },
          }}
          onClick={handleRegister}
        >
          Register
        </Button>
      </Paper>
    </Box>
  );
};

export default Register;
