// /// <reference path="global.d.ts" />
// require("dotenv").config();

// import express from "express";
// import bodyParser from "body-parser";
// import fs from "fs";
// import https from "https";
// import morgan from "morgan";
// import * as routes from "./src/routes/in";
// import { logRequest } from "./src/middleware/request-logger";
// import { handleError } from "./src/middleware/error-handler";
// import { Authentication } from "./src/middleware/authentication";
// import databaseSetup from "./src/startup/database";
// import passportStartup from "./src/startup/passport";
// import cors from "cors";
// import { verifyRole } from "./src/middleware/verify-role";
// import { Role } from "./src/models/user-model";
// import { Server } from "socket.io";
// import { DefaultEventsMap } from "socket.io/dist/typed-events";
// import * as http from "http";

// const production = process.env.NODE_ENV === "production";
// const PORT: any = process.env.PORT || 4000;

// databaseSetup();
// const app = express();
// app.use("/webhook", express.raw({ type: "application/json" }));
// app.use(logRequest);
// app.use(express.json());
// app.use(bodyParser.urlencoded({ extended: true }));

// passportStartup(app);
// app.use(morgan("combined"));

// if (!production) {
//   app.use(
//     cors({
//       optionsSuccessStatus: 200,
//       origin: "*",
//       allowedHeaders: [
//         "Content-Type, Access-Control-Allow-Headers, Access-Control-Allow-Origin, Authorization, X-Requested-With",
//         "Cache-Control",
//       ],
//     })
//   );
// }

// app.use("/api/auth", Authentication.verifyToken);
// app.use("/api/admin", Authentication.verifyToken);
// app.use("/api/admin", verifyRole(Role.SUPER_ADMIN, Role.ADMIN));

// let server: http.Server;

// if (production) {
//   server = https.createServer(
//     {
//       key: fs.readFileSync(process.env.SERVER_KEY_PATH || "server.key"),
//       cert: fs.readFileSync(process.env.SERVER_CERT_PATH || "server.cert"),
//     },
//     app
//   );
// } else {
//   server = http.createServer(app);
// }

// export const io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any> = new Server(server, {
//   cors: {
//     origin: "*",
//     methods: ["PUT", "GET", "POST", "DELETE", "OPTIONS"],
//     credentials: true,
//   },
//   transports: ["polling", "websocket"]
// });

// io.on("connection", (socket: any) => {
//   console.log("A user connected");

//   if (socket) {
//     io.to(socket.id).emit("new-connect", { socket_id: socket.id });
//     console.log('========new connect=================')
//   }

//   socket.on("sendMessage", (data:any) => {
//     const { recipientSocketId, message } = data;
//     io.to(recipientSocketId).emit("newMessage", { message });
//     console.log('========new send message emit=================')
// });

  

//   socket.on("disconnect", () => {
//     console.log("User disconnected");
//   });

//   // Handle other socket events as needed
// });

// server.listen(PORT, () => {
//   console.log("--> Server successfully started at port :: " + PORT)
//   //AppLogger.info("--> Server successfully started at port :: " + PORT);
// });

// routes.initRoutes(app);
// app.use(handleError);

// export default app;


//2
// import express from "express";
// import home from "./src/routes/home";

// // Middlewares
// const app = express();
// app.use(express.json());

// // Routes
// app.use("/home", home);

// // Connection
// const port = process.env.PORT || 9001;
// app.listen(port, () => console.log(`Listening to port ${port}`));



/// <reference path="global.d.ts" />
require("dotenv").config();

import express from "express";
import bodyParser from "body-parser";
import fs from "fs";
import https from "https";
import morgan from "morgan";
import * as routes from "./src/routes/in";
import { logRequest } from "./src/middleware/request-logger";
import { handleError } from "./src/middleware/error-handler";
import { Authentication } from "./src/middleware/authentication";
import databaseSetup from "./src/startup/database";
import passportStartup from "./src/startup/passport";
import cors from "cors";
import { verifyRole } from "./src/middleware/verify-role";
import { Role } from "./src/models/user-model";
import { Server } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import * as http from "http";

// Initialize Express app
const app = express();
const PORT = parseInt(process.env.PORT || "4000", 10);
const isProduction = process.env.NODE_ENV === "production";

// CORS configuration
const corsConfig = {
  origin: "*",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
};

// Middleware
//app.use("/webhook", express.raw({ type: "application/json" }));
app.use(logRequest);
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan("combined"));
app.use(cors(corsConfig));

// Initialize database and passport
databaseSetup();
passportStartup(app);

// API routes
app.use("/api/auth", Authentication.verifyToken);
app.use("/api/admin", Authentication.verifyToken);
app.use("/api/admin", verifyRole(Role.SUPER_ADMIN, Role.ADMIN));

// Server setup
let server: http.Server;

// if (isProduction) {
//   server = https.createServer({
//     key: fs.readFileSync(process.env.SERVER_KEY_PATH || "server.key"),
//     cert: fs.readFileSync(process.env.SERVER_CERT_PATH || "server.cert"),
//   }, app);
// } else {
//   server = http.createServer(app);
// }
server = http.createServer(app);

// Initialize Socket.io
// export const io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any> = new Server(server, {
//   cors: corsConfig,
//   transports: ["polling", "websocket"],
// });

// io.on("connection", (socket) => {
//   console.log("A user connected");

//   socket.emit("new-connect", { socket_id: socket.id });

//   socket.on("sendMessage", ({ recipientSocketId, message }) => {
//     io.to(recipientSocketId).emit("newMessage", { message });
//     console.log('Message sent');
//   });

//   socket.on("disconnect", () => {
//     console.log("User disconnected");
//   });

//   // Handle other socket events as needed
// });

// Start the server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Initialize routes and error handling
routes.initRoutes(app);
//app.use(handleError);

export default app;
