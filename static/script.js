const socket = io();
const errorElement = document.getElementById("error");

// Handle login form submission
document.getElementById("login-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const username = document.getElementById("username-input").value;
  if (username) {
    socket.emit("setUsername", username);
  } else {
    errorElement.textContent = "Username cannot be empty";
  }
});

socket.on("usernameError", (error) => {
  errorElement.textContent = error;
});

socket.on("usernameSuccess", (message) => {
  errorElement.textContent = "";
  document.getElementById("login-container").style.display = "none";
  document.getElementById("chat-container").style.display = "flex";
  console.log(message);
});

// Handle message form submission
document.getElementById("message-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const msg = document.getElementById("message-input").value;
  if (msg.trim()) {
    socket.emit("chat message", msg);
    document.getElementById("message-input").value = "";
  } else {
    errorElement.textContent = "Message cannot be empty";
  }
});

// Listen for messages from the server
socket.on("chat message", (data) => {
  const chatDiv = document.getElementById("chat");
  const messageElement = document.createElement("p");
  messageElement.textContent = `${data.username}: ${data.message}`;
  chatDiv.appendChild(messageElement);
  chatDiv.scrollTop = chatDiv.scrollHeight;
});

socket.on("messageError", (error) => {
  errorElement.textContent = error;
});

socket.on("connect", () => {
  console.log("Connected to server");
});

socket.on("disconnect", () => {
  console.log("Disconnected from server");
});
