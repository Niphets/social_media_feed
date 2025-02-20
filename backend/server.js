// server.js (Backend with Express & MySQL)
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const dotenv = require("dotenv");
const multer = require("multer");
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
// const HtmlWebpackPlugin = require("html-webpack-plugin");
dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));


// Database Connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Niphets2001@",
  database: "new_socialmedia",
});

db.connect(err => {
  if (err) console.error("Database connection failed:", err);
  else console.log("Connected to MySQL");
});

// Middleware for JWT authentication
const authenticateToken = (req, res, next) => {
  const token = req.headers["authorization"];
  if (!token) return res.status(401).json({ error: "Access denied" });

  jwt.verify(token, process.env.JWT_SECRET || "default_secret", (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = user;
    next();
  });
};
app.use("/uploads", express.static("uploads"))
// Multer configuration for image uploads
const storage = multer.diskStorage({
  destination: "./uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique file name
  },
});
const upload = multer({ storage });

// User Registration
app.post("/register", (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) return res.status(400).json({ error: "All fields required" });

  const hashedPassword = bcrypt.hashSync(password, 10);
  db.query("SELECT * FROM users WHERE email = ?", [email], (err, result) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (result.length > 0) return res.status(400).json({ error: "Email already registered" });

    db.query("INSERT INTO users (username, email, password) VALUES (?, ?, ?)", [username, email, hashedPassword], (err) => {
      if (err) return res.status(500).json({ error: "Database error" });
      res.json({ message: "User registered successfully" });
    });
  });
});

// User Login
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  db.query("SELECT * FROM users WHERE email = ?", [email], (err, result) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (result.length === 0) return res.status(401).json({ error: "User not found" });

    const user = result[0];
    if (!bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || "default_secret", { expiresIn: "1d" });
    res.json({ token, user: { id: user.id, username: user.username } });
  });
});

// Fetch posts with like and comment count
app.get("/posts", async (req, res) => {
  try {
    db.query(
      `SELECT p.*, 
              (SELECT COUNT(*) FROM likes WHERE likes.post_id = p.id) AS likes
       FROM posts p ORDER BY p.id DESC`,
      (err, posts) => {
        if (err) {
          console.error("Error fetching posts:", err);
          return res.status(500).json({ error: "Database Error" });
        }

        // Fetch comments for each post
        const postIds = posts.map((post) => post.id);
        if (postIds.length === 0) return res.json(posts); // No posts

        db.query(
          `SELECT * FROM comments WHERE post_id IN (?) ORDER BY id ASC`,
          [postIds],
          (err, comments) => {
            if (err) {
              console.error("Error fetching comments:", err);
              return res.status(500).json({ error: "Database Error" });
            }

            // Attach comments to respective posts
            const postsWithComments = posts.map((post) => ({
              ...post,
              comments: comments.filter((comment) => comment.post_id === post.id),
            }));

            res.json(postsWithComments);
          }
        );
      }
    );
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/posts", authenticateToken, (req, res) => {
  const userId = req.user.id;

  const sql = `
    SELECT p.*, 
           (SELECT COUNT(*) FROM likes WHERE likes.post_id = p.id) AS likes,
           EXISTS(SELECT 1 FROM likes WHERE likes.post_id = p.id AND likes.user_id = ?) AS likedByUser
    FROM posts p
    ORDER BY p.id DESC
  `;

  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error("Error fetching posts:", err);
      return res.status(500).json({ success: false, error: "Database Error" });
    }

    results.forEach(post => {
      post.likedByUser = !!post.likedByUser; // Convert 1/0 to true/false
    });

    res.json(results);
  });
});


// Create a new post
app.post("/posts", upload.single("image"), (req, res) => {
  const { user_id, username, content } = req.body;  // Include user_id
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

  if (!user_id || !username || !content) {
    return res.status(400).json({ error: "User ID, username, and content are required" });
  }

  const sql = "INSERT INTO posts (user_id, username, content, image_url) VALUES (?, ?, ?, ?)";
  db.query(sql, [user_id, username, content, imageUrl], (err, result) => {
    if (err) {
      console.error("Error inserting post:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({ message: "Post created successfully", postId: result.insertId });
  });
});

// Like/Unlike a post
app.post("/posts/:id/like", authenticateToken, (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id; // Get user from token

  db.query("SELECT * FROM likes WHERE user_id = ? AND post_id = ?", [user_id, id], (err, result) => {
    if (err) return res.status(500).json({ error: "Database error" });

    if (result.length > 0) {
      // Unlike post
      db.query("DELETE FROM likes WHERE user_id = ? AND post_id = ?", [user_id, id], (err) => {
        if (err) return res.status(500).json({ error: "Database error" });

        db.query("UPDATE posts SET likes = likes - 1 WHERE id = ?", [id], (err) => {
          if (err) return res.status(500).json({ error: "Database error" });
          res.json({ success: true, message: "Post unliked successfully" });
        });
      });
    } else {
      // Like post
      db.query("INSERT INTO likes (user_id, post_id) VALUES (?, ?)", [user_id, id], (err) => {
        if (err) return res.status(500).json({ error: "Database error" });

        db.query("UPDATE posts SET likes = likes + 1 WHERE id = ?", [id], (err) => {
          if (err) return res.status(500).json({ error: "Database error" });
          res.json({ success: true, message: "Post liked successfully" });
        });
      });
    }
  });
});

// Add Comment to a Post
app.post("/posts/:id/comment", (req, res) => {
  const { id } = req.params;
  const { user_id, username, content } = req.body;

  if (!user_id || !username || !content) {
    return res.status(400).json({ error: "User ID, username, and comment content are required" });
  }

  const sql = "INSERT INTO comments (post_id, user_id, username, comment) VALUES (?, ?, ?, ?)";
  db.query(sql, [id, user_id, username, content], (err, result) => {
    if (err) {
      console.error("Error adding comment:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({ id: result.insertId, username, comment: content }); // Send new comment back
  });
});
  
app.get("/posts", async (req, res) => {
  try {
    const posts = await db.query(
      `SELECT posts.id, posts.user_id, posts.username, posts.content, posts.image_url, 
              (SELECT COUNT(*) FROM likes WHERE likes.post_id = posts.id) AS likes
       FROM posts ORDER BY posts.id DESC`
    );

    // Fetch comments for each post
    const postsWithComments = await Promise.all(
      posts.map(async (post) => {
        const comments = await db.query(
          "SELECT * FROM comments WHERE post_id = ? ORDER BY id ASC",
          [post.id]
        );
        return { ...post, comments };
      })
    );

    res.json(postsWithComments);
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ error: "Server error" });
  }
});



// Start server
app.listen(5000, () => console.log("Server running on port 5000"));
