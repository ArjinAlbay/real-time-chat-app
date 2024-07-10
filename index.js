import express from "express";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { Server } from "socket.io";
import path from "path";
import mongoose from "mongoose";
import { User } from "./models/User.js";

const app = express();
const server = createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;
const __dirname = dirname(fileURLToPath(import.meta.url));

app.use(
  "/static",
  express.static(path.join(__dirname, "static"), {
    setHeaders: (res, path) => {
      if (path.endsWith(".css")) {
        res.setHeader("Content-Type", "text/css");
      }
    },
  })
);

mongoose
  .connect("mongodb://127.0.0.1:27017/chatApp", {})
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB", err);
  });

app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "static", "home.html"));
});

io.on("connection", (socket) => {
  socket.on("setUsername", async (username) => {
    // Validate username: ensure it's not empty and is unique
    if (!username) {
      socket.emit("usernameError", "Username cannot be empty");
      return;
    }

    try {
      // Check if the username already exists
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        socket.emit("usernameError", "Username is already taken");
        return;
      }

      // Save the username in the database
      const newUser = new User({ username });
      await newUser.save();

      // Store the username in the socket object
      socket.username = username;
      console.log(`User ${username} connected`);
      socket.emit("usernameSuccess", `Welcome ${username}`);
    } catch (err) {
      console.error("Error setting username", err);
      socket.emit("usernameError", "Internal server error");
    }
  });

  socket.on("chat message", (msg) => {
    // Validate message: ensure it's not empty
    if (!msg.trim()) {
      socket.emit("messageError", "Message cannot be empty");
      return;
    }

    // Retrieve the username from the socket object
    const username = socket.username;
    console.log(`${username}: ${msg}`);

    // Broadcast the message to all connected users
    io.emit("chat message", { username, message: msg });
  });

  socket.on("disconnect", async () => {
    if (socket.username) {
      console.log(`User ${socket.username} disconnected`);

      try {
        // Remove the user from the database
        await User.deleteOne({ username: socket.username });
      } catch (err) {
        console.error("Error removing user", err);
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`server running at ${PORT}`);
});
