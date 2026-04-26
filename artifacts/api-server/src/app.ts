import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { startSchedulerLoop } from "./lib/scheduler";
import { seedEmailMessages } from "./lib/seed";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(cookieParser());
// Capture the raw request bytes for webhook signature verification.
// Provider HMAC must be computed against the exact bytes they signed,
// not against a re-stringified copy.
app.use(
  express.json({
    verify: (req, _res, buf) => {
      (req as express.Request & { rawBody?: Buffer }).rawBody = Buffer.from(buf);
    },
  }),
);
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// Seed default nurture email templates into funnel_email_messages on first
// boot, then kick off the scheduler for outbound sequences.
void seedEmailMessages();
startSchedulerLoop();

export default app;
