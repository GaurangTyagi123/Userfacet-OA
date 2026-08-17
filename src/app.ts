import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import authRouter from "./routes/authRoutes.js";
import userRouter from "./routes/userRouter.js";
import bookRouter from "./routes/bookRoutes.js";
import borrowRouter from "./routes/borrowRoutes.js";
import qs from "qs";
import type { AppRequest, AppResponse, Nextfn } from "../types.js";

import globalErrorController from "./controllers/globalErrorController.js";

const app = express();

app.use(
    "/api",
    rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: 100,
    }),
);
app.use(express.json());
app.use(cookieParser());

app.use((req: AppRequest, _res: AppResponse, next: Nextfn) => {
    req.parsedQuery = qs.parse(req.originalUrl.split("?")[1] || "");
    next();
});
if (process.env.NODE_ENV === "development") app.use("/api", morgan("tiny"));
app.use(
    helmet({
        hidePoweredBy: true,
        noSniff: true,
        xssFilter: true,
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
            },
        },
    }),
);
app.get("/", (req: AppRequest, res: AppResponse) => {
    return res.status(200).json({
        status: "success",
        data: {
            message:
                "This is an e-library management api, documentation can be found at https://documenter.getpostman.com/view/47791845/2sBYApyCxd",
        },
    });
})

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/user", userRouter);
app.use("/api/v1/book", bookRouter);
app.use("/api/v1/borrow", borrowRouter);
app.use(globalErrorController);

export default app;
