import express from "express";
import {Server} from "socket.io";
import {createServer} from 'https';
import fs from 'fs';
import {resolve} from 'path';
import {networkInterfaces} from 'os'
import { faker } from "@faker-js/faker";
import { exec } from "child_process";

//ip config
let en0;
try {
  en0 = networkInterfaces()['Wi-Fi'][1].address || 'localhost';
}
catch (_e) {
  en0 = 'localhost';
}

await exec(`mkcert ${en0}`);

const app = express();
const http = createServer({
  key: fs.readFileSync(`./${en0}-key.pem`),
  cert: fs.readFileSync(`./${en0}.pem`)
}, app);
const io = new Server(http, {
    connectionStateRecovery: {}
})

const port = 3000;

app.use(express.static("public"));

app.get("/", (_req, res) => {
  res.sendFile(resolve("index.html"));
});


let currentData = {};
// Server socket
io.on("connection", (socket) => {
  const username = faker.person.firstName();
  
  currentData[socket.id] = {name: username};

  socket.emit('username', username);
  io.emit('sendMsg', 'SERVER', 'SERVER', 'All', `<b>${username}</b> has joined!`)
  io.emit('users', currentData);

  socket.on("disconnect", () => {
    delete currentData[socket.id];
    io.emit('users', currentData);
    io.emit('sendMsg', 'SERVER', 'SERVER', 'All', `<b>${username}</b> has left!`)
  })

  socket.on("chat", (toId, msg) => {
    // currentData[socket.id].message[toId] = msg;
    const fio = (toId === "All") ? io: io.to([socket.id, toId]);
    fio.emit("sendMsg", username, socket.id, toId, msg);
  });
});

http.listen(port, en0, () => {
  console.log(`Server's running on port: https://${en0}:${port}`);
});

// For development
process.on('exit', () => {
  fs.rmSync(`./${en0}-key.pem`);
  fs.rmSync(`./${en0}.pem`);
})