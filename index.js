import express from "express";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { Server } from "socket.io";

const app = express();
const server = createServer(app);
const io = new Server(server);

const __dirname = dirname(fileURLToPath(import.meta.url));

app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "static", "home.html"));
});

const users = new Map();

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("setUsername", (username) => {
    // Validate username: ensure it's not empty and is unique
    if (!username || Array.from(users.values()).includes(username)) {
      socket.emit("usernameError", "Username is either empty or already taken");
      return;
    }

    // Store the username in the socket object and users map
    socket.username = username;
    users.set(socket.id, username);
    console.log(`User ${username} connected`);
    socket.emit("usernameSuccess", `Welcome ${username}`);
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

  socket.on("disconnect", () => {
    if (socket.username) {
      console.log(`User ${socket.username} disconnected`);
      users.delete(socket.id);
    }
  });
});

server.listen(3000, () => {
  console.log("server running at http://localhost:3000");
});
