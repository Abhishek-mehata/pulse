const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const path = require("path");
const { Server } = require("socket.io");
const io = new Server(server);

// Store users: { socketId: { username, color, joinedAt } }
const users = {};

// Generate a consistent color from username
const avatarColors = [
    "#f87171", "#fb923c", "#fbbf24", "#a3e635",
    "#34d399", "#22d3ee", "#60a5fa", "#a78bfa",
    "#e879f9", "#f472b6"
];

function getColorForUser(username) {
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
        hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    return avatarColors[Math.abs(hash) % avatarColors.length];
}

io.on("connection", (socket) => {
    console.log("Connected:", socket.id);

    socket.on("user-join", (username) => {
        const userData = {
            username,
            color: getColorForUser(username),
            joinedAt: new Date().toISOString()
        };
        users[socket.id] = userData;

        socket.broadcast.emit("user-joined", {
            username,
            timestamp: new Date().toISOString()
        });

        io.emit("online-users", Object.values(users));
    });

    socket.on("user-message", (message) => {
        const user = users[socket.id];
        if (!user) return;

        io.emit("message", {
            username: user.username,
            color: user.color,
            message,
            socketId: socket.id,
            timestamp: new Date().toISOString()
        });
    });

    socket.on("typing", () => {
        const user = users[socket.id];
        if (user) socket.broadcast.emit("user-typing", user.username);
    });

    socket.on("stop-typing", () => {
        socket.broadcast.emit("user-stop-typing");
    });

    socket.on("disconnect", () => {
        const user = users[socket.id];
        if (user) {
            socket.broadcast.emit("user-left", {
                username: user.username,
                timestamp: new Date().toISOString()
            });
            delete users[socket.id];
            io.emit("online-users", Object.values(users));
        }
    });
});

app.use(express.static(path.resolve("./public")));
app.get("/", (req, res) => res.sendFile(path.resolve("./public/index.html")));

server.listen(9000, () => {
    console.log("Server running at http://localhost:9000");
});















// const express = require("express")
// const app = express()

// const http = require("http")
// const server = http.createServer(app);
// const path = require("path")


// const { Server } = require("socket.io")
// // io - input/output
// const io = new Server(server)


// // socket handling
// // in the world of socket.io - user/client is referred as a socket
// io.on("connection", (socket) => {
//     // console.log("A new User has connected", socket.id)

//     // when ever "user-message" named event comes from client work on it
//     socket.on("user-message", (message) => {
//         // console.log("A new User Message");
//         // console.log("A new user message", message)

//         io.emit("message", message)
//     })
// })

// app.use(express.static(path.resolve("./public")))

// app.get("/", (req, res) => {
//     res.sendFile("./public/index.html")
// })


// server.listen(9000, () => {
//     console.log("Server started at port 9000 http://localhost:9000/")
// })



