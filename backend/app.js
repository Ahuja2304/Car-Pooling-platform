const bufferModule = require('buffer');
if (typeof bufferModule.SlowBuffer === 'undefined') {
    bufferModule.SlowBuffer = bufferModule.Buffer;
}
const express = require('express');
const mongoose = require('mongoose');
const app = express();
const bodyparser = require('body-parser');
const cookieparser = require('cookie-parser');
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config()
const { Client } = require("@googlemaps/google-maps-services-js");
const path = require('path');
const swaggerUI = require("swagger-ui-express");
const YAML = require("yamljs");
const swaggerDocument = YAML.load(path.join(__dirname, 'swagger.yaml'));



const authRoutes = require("./Routes/authentication");
const allusersRoutes = require("./Routes/allusersRoutes");
//const userRoutes = require("./Routes/user.js");
const tripRoutes = require("./Routes/tripRoutes");

// import cookieparser from "cookie-parser";
// import cors from "cors";
//import swaggerUI from "swagger-ui-express";
//import YAML from 'yamljs';
//import dotenv from "dotenv" 
// import authRoutes from "./Routes/authentication.js";
// import userRoutes from "./Routes/user.js";
// import allusersRoutes from "./Routes/allusersRoutes.js";
//const specs = swaggerJsDoc(options);
//Middleware

//PORT


let lastDbError = null;
mongoose.connect(process.env.DATABASE_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    family: 4
}).then(() => {
    console.log("DB connected");
    lastDbError = null;
}).catch(err => {
    console.error("DB Connection Error:", err);
    lastDbError = err.message;
});

//Middleware
app.use(bodyparser.json())
app.use(cookieparser())
app.use(cors())

//Routes
app.get("/", (req, res) => res.status(200).send("Backend is up and running"));
app.get("/api/status", (req, res) => {
    const status = mongoose.connection.readyState;
    const states = {
        0: "disconnected",
        1: "connected",
        2: "connecting",
        3: "disconnecting"
    };
    res.json({ 
        status: states[status] || "unknown",
        database: mongoose.connection.name || "not connected",
        error: lastDbError
    });
});
app.use("/api", authRoutes);
app.use("/api", allusersRoutes);
//app.use("/api", userRoutes);
app.use("/api", tripRoutes);
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocument));

const http = require('http');
const { Server } = require("socket.io");
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);
    
    socket.on('joinTrip', (tripId) => {
        socket.join(tripId);
        console.log(`User ${socket.id} joined trip room: ${tripId}`);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Make io accessible in controllers
app.set('io', io);

if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    server.listen(process.env.PORT || 8000, () => {
        console.log(`Listening on port ${process.env.PORT || 8000}`);
    });
}

module.exports = app;
