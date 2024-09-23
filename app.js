import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import { Server } from "socket.io";
import multer from "multer";
import connectDB from "./constants/db.js";
import xlsx from "xlsx";
//routes
import usersData from "./routes/usersData.js";
import postData from "./routes/postData.js";
import documentData from "./routes/documentData.js";
import globalErrorHandler from "./error/AppError.js";
import startUpData from "./routes/startUpData.js";
import contactUsData from "./routes/contactUsData.js";
import connectionData from "./routes/connectionRoutes.js";
import investorData from "./routes/investorRoutes.js";
import chatData from "./routes/chatRoutes.js";
import messageData from "./routes/messageRoutes.js";
import communityData from "./routes/communityRoutes.js";
import notificationData from "./routes/notificationRoutes.js";
import scheduleRoutes from "./routes/scheduleRoutes.js";
import questionsRoutes from "./routes/questionsRoute.js";
import achievementRoutes from "./routes/achievementRoutes.js";
import liveDealRoutes from "./routes/liveDealRoutes.js";
import articleRoutes from "./routes/articleRoute.js"
import subscriptionRoutes from "./routes/subscriptionRoutes.js"

const allowedOrigins = ['http://localhost:3000','https://www.thecapitalhub.in'];

dotenv.config();
const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());
app.use(express.static("public"));
app.use(cors());

app.use("/users", usersData);
app.use("/api/posts", postData);
app.use("/documentation", documentData);
app.use("/startup", startUpData);
app.use("/contactUs", contactUsData);
app.use("/connections", connectionData);
app.use("/investor", investorData);
app.use("/chat", chatData);
app.use("/message", messageData);
app.use("/community", communityData);
app.use("/notificaton", notificationData);
app.use("/schedule", scheduleRoutes);
app.use("/question", questionsRoutes);
app.use("/achievement", achievementRoutes);
app.use("/live_deals", liveDealRoutes);
app.use("/article",articleRoutes)
app.use("/subscription",subscriptionRoutes);
// documentation upload

const storage = multer.diskStorage({
  destination: "./uploads",
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage });

app.post("/upload", upload.single("file"), (req, res) => {
  const file = req.file;
  console.log(file);
  console.log(`File uploaded: ${file.originalname}`);

  // Return JSON response with the thumbnail URL or other relevant data
  res.status(200).json({
    message: "File uploaded successfully",
    thumbnailUrl: `/uploads/${file.originalname}`,
  });
});
app.use(globalErrorHandler);

connectDB();

const server = app.listen(process.env.PORT, () => {
  console.log(`Listening on ${process.env.PORT}`);
});

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

let activeUsers = [];
io.on("connection", (socket) => {
  socket.on("new-user-add", (newUserId) => {
    if (newUserId !== null) {
      const existingUserIndex = activeUsers.findIndex(
        (user) => user.userId === newUserId
      );
      if (existingUserIndex !== -1) {
        activeUsers[existingUserIndex].socketId = socket.id;
      } else {
        activeUsers.push({
          userId: newUserId,
          socketId: socket.id,
        });
      }
      io.emit("get-users", activeUsers);
    }
  });

  socket.on("disconnected", () => {
    activeUsers = activeUsers.filter((user) => user.socketId !== socket.id);
    io.emit("get-users", activeUsers);
  });

  socket.on("send-message", (data) => {
    try {
      const { recieverId } = data;
      // const user = activeUsers.find((user) => user.userId === recieverId);
      // console.log("Active users: ", activeUsers);
      // console.log("Users: ", user);
      // console.log("Sending from socket to: ", recieverId);
      // console.log("Data: ", data);
      // if (user) io.to(user.socketId).emit("recieve-message", data);
      const matchedUsers = activeUsers.filter((user) =>
        recieverId.includes(user.userId)
      );
      matchedUsers.forEach((user) => {
        io.to(user.socketId).emit("recieve-message", data);
      });
    } catch (error) {
      console.log(error);
    }
  });
});
