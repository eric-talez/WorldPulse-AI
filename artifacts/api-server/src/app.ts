import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { processStripeWebhookEvent } from "./routes/payments";
import { verifyWebhookEvent, StripeNotConfiguredError } from "./lib/stripe";

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

// Stripe webhook MUST be registered BEFORE express.json() so we get the raw body
// for signature verification.
app.post(
  "/api/payments/stripe/webhook",
  express.raw({ type: "application/json" }),
  async (req, res): Promise<void> => {
    const sigHeader = req.headers["stripe-signature"];
    const signature = Array.isArray(sigHeader) ? sigHeader[0] : sigHeader;
    if (!signature) {
      res.status(400).json({ error: "Missing stripe-signature header" });
      return;
    }
    let event: import("stripe").Stripe.Event;
    try {
      event = verifyWebhookEvent(req.body as Buffer, signature);
    } catch (err) {
      if (err instanceof StripeNotConfiguredError) {
        res.status(503).json({ error: err.message });
        return;
      }
      req.log.warn({ err }, "Stripe webhook signature verification failed");
      res.status(400).json({ error: "Invalid signature" });
      return;
    }
    try {
      await processStripeWebhookEvent(event, req.log);
      res.json({ received: true });
    } catch (err) {
      req.log.error({ err }, "Stripe webhook handler failed");
      res.status(500).json({ error: "Webhook handler failed" });
    }
  },
);

app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
