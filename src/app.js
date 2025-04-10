const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const authRoutes = require('./apis/routes/authRoute');
const userRoutes = require("./apis/routes/userRoute");
const attendanceRoutes = require('./apis/routes/attendanceRoute');
const { connectMongoDB, connetPostgres } = require("./config/database");
const projectRoutes = require("./apis/routes/projectRoute");
const taskRoutes = require("./apis/routes/taskRoute");
const projectMemberRoutes = require("./apis/routes/projectMemberRoute");
const { Socket } = require("socket.io");
const payrollRoutes = require("./apis/routes/payrollRoute");
const chatRoutes = require("./apis/routes/chatRoute");
const leaveRoutes = require("./apis/routes/leaveRoute");
const prRoutes = require("./apis/routes/prRoute");
const socket = require("./socket");
const http = require("http");

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/assets", express.static("src/assets"));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/user", userRoutes);
app.use("/api/project", projectRoutes);
app.use("/api/task", taskRoutes);
app.use("/api/project-member", projectMemberRoutes);
app.use("/api/payroll", payrollRoutes);
app.use("/api/chat", chatRoutes);

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3001",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use("/api/leave", leaveRoutes);
app.use("/api/pr", prRoutes);
// Connect to databases
connectMongoDB();
connetPostgres();

const server = http.createServer(app);
socket.init(server);

module.exports = app;
