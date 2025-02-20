import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Box,
  Container,
  Paper,
} from "@mui/material";

const Feed = ({ user }) => {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [commentText, setCommentText] = useState({});
  const [likes, setLikes] = useState({});

  useEffect(() => {
    axios
      .get("http://localhost:5000/posts")
      .then((response) => {
        setPosts(response.data);
        const initialLikes = response.data.reduce((acc, post) => {
          acc[post.id] = post.likes || 0;
          return acc;
        }, {});
        setLikes(initialLikes);
      })
      .catch((error) => console.error("Error fetching posts:", error));
  }, []);

  // Handle New Post Submission
  const handleNewPost = async () => {
    if (!newPost.trim()) return alert("Post content cannot be empty");

    const formData = new FormData();
    formData.append("user_id", user.id);
    formData.append("username", user.username);
    formData.append("content", newPost);
    if (selectedImage) formData.append("image", selectedImage);

    try {
      const response = await axios.post("http://localhost:5000/posts", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setPosts([response.data, ...posts]);
      setNewPost("");
      setSelectedImage(null);
    } catch (error) {
      console.error("Error creating post:", error);
      alert("Failed to create post");
    }
  };

  // Handle Like
  const handleLike = async (postId, isLiked) => {
    try {
      // Optimistically update the UI
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId
            ? { ...post, likes: isLiked ? post.likes - 1 : post.likes + 1, isLiked: !isLiked }
            : post
        )
      );
  
      // Send request to backend
      await axios.post(`http://localhost:5000/posts/${postId}/like`, {}, {
        headers: { Authorization: localStorage.getItem("token") }
      });
    } catch (error) {
      console.error("Error updating like:", error);
    }
  };
  
  

  // Handle Comment
  const handleComment = async (postId) => {
    if (!commentText[postId]?.trim()) return;
  
    try {
      const response = await axios.post(`http://localhost:5000/posts/${postId}/comment`, {
        user_id: user.id,
        username: user.username,
        content: commentText[postId],
      });
  
      // Append the new comment correctly to the post
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId
            ? { ...post, comments: [...(post.comments || []), response.data] }
            : post
        )
      );
  
      setCommentText({ ...commentText, [postId]: "" });
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };
  

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(to right, #1e3c72, #2a5298)",
        padding: "20px",
      }}
    >
      <Container maxWidth="md">
        <Paper elevation={5} sx={{ padding: "20px", borderRadius: "12px", background: "white" }}>
          <Typography variant="h4" sx={{ color: "#333", fontWeight: "bold", textAlign: "center", marginBottom: "15px" }}>
            Social Feed
          </Typography>

          {/* New Post Input */}
          <TextField
            label="What's on your mind?"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            sx={{ marginBottom: "10px", backgroundColor: "#f9f9f9", borderRadius: "8px" }}
          />
          <input type="file" onChange={(e) => setSelectedImage(e.target.files[0])} />
          <Button
            variant="contained"
            color="primary"
            onClick={handleNewPost}
            sx={{ marginTop: "10px", width: "100%" }}
          >
            Post
          </Button>

          {/* Posts Section */}
          {posts.map((post) => (
            <Card key={post.id} sx={{ marginTop: 3, borderRadius: "10px", backgroundColor: "#ffffff", boxShadow: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: "bold", color: "#1e3c72" }}>
                  {post.username}
                </Typography>
                <Typography variant="body1" sx={{ color: "#444" }}>
                  {post.content}
                </Typography>

                {/* Display Image if exists */}
                {post.image_url && (
                  <Box sx={{ marginTop: "10px", textAlign: "center" }}>
                    <img
                      src={`http://localhost:5000${post.image_url}`}
                      alt="Post"
                      style={{ maxWidth: "100%", borderRadius: "8px", maxHeight: "300px" }}
                    />
                  </Box>
                )}

                {/* Like Button */}
                <Button
                  variant="contained"
                  color="success"
                  onClick={() => handleLike(post.id)}
                  sx={{ marginTop: "10px" }}
                >
                  👍 Like ({likes[post.id] || 0})
                </Button>

                    
                {/* Comment Section */}
                <Box sx={{ marginTop: "10px" }}>
                  <TextField
                    fullWidth
                    label="Write a comment..."
                    variant="outlined"
                    value={commentText[post.id] || ""}
                    onChange={(e) => setCommentText({ ...commentText, [post.id]: e.target.value })}
                    sx={{ backgroundColor: "#f9f9f9", borderRadius: "5px" }}
                  />
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={() => handleComment(post.id)}
                    sx={{ marginTop: "5px" }}
                  >
                    Comment
                  </Button>
                </Box>

                {/* Display Comments */}
                <Box sx={{ marginTop: "10px", paddingLeft: "15px" }}>
                  {post.comments && post.comments.length > 0 ? (
                    post.comments.map((comment, index) => (
                      <Typography key={index} variant="body2" sx={{ backgroundColor: "#f1f1f1", padding: "8px", borderRadius: "5px", marginBottom: "5px" }}>
                        <strong>{comment.username}</strong>: {comment.comment}
                      </Typography>
                    ))
                  ) : (
                    <Typography variant="body2" sx={{ color: "gray" }}>
                      No comments yet.
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          ))}
        </Paper>
      </Container>
    </Box>
  );
};

export default Feed;
