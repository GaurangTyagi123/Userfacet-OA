/**
 * src/server.ts
 * Application entrypoint: loads environment, starts the HTTP server,
 * connects to MongoDB and handles process-level signals and errors.
 */
import mongoose from "mongoose";
import app from "./app.js";
import { config } from "dotenv";

config({
    path: ".env",
});
const PORT = process.env.SERVER_PORT || 3000;
const server = app.listen(PORT, () => {
    console.log(`SERVER : Running at port ${PORT}`);
});
const DB_URL =
    process.env.NODE_ENV === "production"
        ? process.env.DB_URL
        : process.env.DB_URL_DEV;

mongoose
    .connect(DB_URL!, {
        serverSelectionTimeoutMS: 5000,
    })
    .then((con) => {
        if (con) console.log("SERVER : MongoDB connection successfull");
        else console.log("SERVER : MongoDB connection failed");
    })
    .catch((_error) =>
        console.log("SERVER (ERROR) : error connecting to MongoDB"),
    );
process.on("uncaughtException", (err) => {
    console.log(err);
    console.log(
        "SERVER (ERROR) : uncaught exception encountered!!! ...application crashed!",
    );
    server.close(() => {
        mongoose.disconnect();
        process.exit();
    });
});
process.on("unhandledRejection", (err) => {
    console.log(err);
    console.log(
        "SERVER (ERROR) : unhandled rejection encountered!!! ...application crashed!",
    );
    server.close(() => {
        mongoose.disconnect();
        process.exit();
    });
});
process.on("SIGTERM", () => {
    console.log("SERVER : SIGTERM recieved.... Closing server gracefully");
    server.close(() => {
        mongoose.disconnect();
        process.exit();
    });
});
