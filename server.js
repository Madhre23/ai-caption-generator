const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");
const session = require("express-session");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");
const { GoogleGenerativeAI } = require("@google/generative-ai");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Create database folder if it does not exist
const dbFolder = path.join(__dirname, "database");
if (!fs.existsSync(dbFolder)) {
  fs.mkdirSync(dbFolder);
}

// Connect to SQLite database
const db = new sqlite3.Database(path.join(dbFolder, "app.db"));

// Middleware
app.use(express.json());
app.use(express.static("public"));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "fallback-secret-key",
    resave: false,
    saveUninitialized: false
  })
);


// Create a default test account for project review
function createTestAccount() {
  const testUsername = "testuser";
  const testEmail = "test@example.com";
  const testPassword = "test123";

  db.get("SELECT * FROM users WHERE email = ?", [testEmail], async (err, user) => {
    if (err) {
      console.log("Error checking test account:", err);
      return;
    }

    if (!user) {
      const hashedPassword = await bcrypt.hash(testPassword, 10);

      db.run(
        "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
        [testUsername, testEmail, hashedPassword],
        function (err) {
          if (err) {
            console.log("Error creating test account:", err);
          } else {
            console.log("Test account created: test@example.com / test123");
          }
        }
      );
    } else {
      console.log("Test account already exists.");
    }
  });
}

// Create tables first, then create the test account
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    )
  `);

  db.run(
    `
    CREATE TABLE IF NOT EXISTS captions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      prompt TEXT NOT NULL,
      generated_text TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `,
    function (err) {
      if (err) {
        console.log("Error creating captions table:", err);
      } else {
        createTestAccount();
      }
    }
  );
});

// Gemini setup
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Check login session
app.get("/api/check-session", (req, res) => {
  if (req.session.user) {
    res.json({
      loggedIn: true,
      username: req.session.user.username
    });
  } else {
    res.json({
      loggedIn: false
    });
  }
});

// Signup
app.post("/api/signup", async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.json({
      success: false,
      message: "Please fill in all fields."
    });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    db.run(
      "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
      [username, email, hashedPassword],
      function (err) {
        if (err) {
          return res.json({
            success: false,
            message: "Email already exists."
          });
        }

        res.json({
          success: true,
          message: "Account created successfully."
        });
      }
    );
  } catch (error) {
    res.json({
      success: false,
      message: "Signup failed."
    });
  }
});

// Signin
app.post("/api/signin", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.json({
      success: false,
      message: "Please enter email and password."
    });
  }

  db.get("SELECT * FROM users WHERE email = ?", [email], async (err, user) => {
    if (err || !user) {
      return res.json({
        success: false,
        message: "Invalid email or password."
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.json({
        success: false,
        message: "Invalid email or password."
      });
    }

    req.session.user = {
      id: user.id,
      username: user.username,
      email: user.email
    };

    res.json({
      success: true,
      username: user.username
    });
  });
});

// Logout
app.post("/api/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({
      success: true
    });
  });
});

// Generate caption with Gemini
app.post("/api/generate", async (req, res) => {
  if (!req.session.user) {
    return res.json({
      success: false,
      message: "You must be signed in."
    });
  }

  const { prompt } = req.body;

  if (!prompt) {
    return res.json({
      success: false,
      message: "Please enter a prompt."
    });
  }

  try {
    const model = genAI.getGenerativeModel({
       model: "gemini-2.5-flash"
    });

    const aiPrompt = `Generate one short social media caption for this: ${prompt}`;

    const result = await model.generateContent(aiPrompt);
    const caption = result.response.text();

    res.json({
      success: true,
      caption: caption
    });
  } catch (error) {
  console.log("Gemini error:", error);

  res.json({
    success: false,
    message: "Gemini API error. Check your API key."
  });
}
});

// Create saved caption
app.post("/api/captions", (req, res) => {
  if (!req.session.user) {
    return res.json({
      success: false,
      message: "You must be signed in."
    });
  }

  const { prompt, generatedText } = req.body;

  db.run(
    "INSERT INTO captions (user_id, prompt, generated_text) VALUES (?, ?, ?)",
    [req.session.user.id, prompt, generatedText],
    function (err) {
      if (err) {
        return res.json({
          success: false,
          message: "Could not save caption."
        });
      }

      res.json({
        success: true
      });
    }
  );
});

// Read saved captions
app.get("/api/captions", (req, res) => {
  if (!req.session.user) {
    return res.json({
      success: false,
      message: "You must be signed in.",
      captions: []
    });
  }

  db.all(
    "SELECT * FROM captions WHERE user_id = ? ORDER BY created_at DESC",
    [req.session.user.id],
    (err, captions) => {
      if (err) {
        return res.json({
          success: false,
          captions: []
        });
      }

      res.json({
        success: true,
        captions: captions
      });
    }
  );
});

// Update saved caption
app.put("/api/captions/:id", (req, res) => {
  if (!req.session.user) {
    return res.json({
      success: false,
      message: "You must be signed in."
    });
  }

  const captionId = req.params.id;
  const { generatedText } = req.body;

  db.run(
    "UPDATE captions SET generated_text = ? WHERE id = ? AND user_id = ?",
    [generatedText, captionId, req.session.user.id],
    function (err) {
      if (err) {
        return res.json({
          success: false,
          message: "Could not update caption."
        });
      }

      res.json({
        success: true
      });
    }
  );
});

// Delete saved caption
app.delete("/api/captions/:id", (req, res) => {
  if (!req.session.user) {
    return res.json({
      success: false,
      message: "You must be signed in."
    });
  }

  const captionId = req.params.id;

  db.run(
    "DELETE FROM captions WHERE id = ? AND user_id = ?",
    [captionId, req.session.user.id],
    function (err) {
      if (err) {
        return res.json({
          success: false,
          message: "Could not delete caption."
        });
      }

      res.json({
        success: true
      });
    }
  );
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
