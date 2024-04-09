const socket = io();
const userList = document.getElementById("users");
const message = document.getElementById("messages");
const form = document.getElementById("form");
const input = document.getElementById("input");
const name = document.getElementById("yourname");
const sound = document.getElementById("sound");
let username;
let sessionMessage = { All: [] };

function submitForm(e) {
  e.preventDefault();
  if (input.value) {
    socket.emit("chat", userList.value, input.value);
    input.value = "";
  }
  return false;
}

function retrieveMessage(e) {
  console.log(e);
  message.innerHTML = "";
  if (sessionMessage[e.target.value] === undefined) return false;
  for (const m of sessionMessage[e.target.value]) {
    message.appendChild(m);
  }
  message.scrollTo(0, message.scrollHeight);
  return false;
}

function checkNotification() {
  if (window.Notification.permission === "granted") return;
  // request permission from user
  window.Notification.requestPermission();
}

document.body.onload = checkNotification;
form.addEventListener("submit", submitForm);
userList.addEventListener("change", retrieveMessage);

function notifyUser(from, fromId, toId, msg) {
  if (socket.id !== fromId) sound.play();
  if (![username, "SERVER"].includes(from)) {
    if (window.Notification?.permission == "granted") {
      const notification = new window.Notification(
        `${from} đã nhắn tin cho ${toId === "All" ? "mọi người" : "riêng bạn"}`,
        {
          body: msg,
        }
      );
    }
  }
}

function formatMessageDiv(item, from, fromId, toId, msg) {
  if (from == username) {
    item.classList.add("my-message");
  }
  else if (fromId === "SERVER") {
    item.classList.add("server-notification");
  }
  if ([socket.id, 'SERVER'].includes(fromId) || toId !== "All") item.innerHTML = msg;
  else item.innerHTML = `<h6>${from}</h6>${msg}`;
}

function checkShowMessage(fromId, toId) {
  return (userList.value === fromId || socket.id === fromId) 
  || (toId === "All" && userList.value === toId);
}

socket.on("sendMsg", (from, fromId, toId, msg) => {
  const item = document.createElement("div");
  formatMessageDiv(item, from, fromId, toId, msg);

  const container = document.createElement("li");
  container.appendChild(item);
  if (!sessionMessage[fromId]) sessionMessage[fromId] = [];
  if (toId !== "All") sessionMessage[fromId].push(container);
  else sessionMessage["All"].push(container);

  if (checkShowMessage(fromId, toId)) {
    message.appendChild(container);
    message.scrollTo(0, message.scrollHeight);
  }
  notifyUser(from, fromId, toId, msg);
  console.log(sessionMessage);
});

socket.on("username", (serverName) => {
  username = serverName;
  name.textContent = username;
});

function createChannel(users, userID) {
  const node = document.createElement("option");
  node.setAttribute("value", userID ?? "All");
  if (users) node.textContent = users[userID]?.name ?? "All";
  else node.textContent = "All";
  return node;
}
socket.on("users", (users) => {
  userList.innerHTML = "";
  console.log(users);
  userList.appendChild(createChannel());
  for (const userID in users) {
    if (userID === socket.id) continue;
    userList.appendChild(createChannel(users, userID));
  }
});
