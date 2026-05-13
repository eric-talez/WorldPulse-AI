import { Router, type IRouter } from "express";
import healthRouter from "./health";
import countriesRouter from "./countries";
import issuesRouter from "./issues";
import jobsRouter from "./jobs";
import forumRouter from "./forum";
import dashboardRouter from "./dashboard";
import planetsRouter from "./planets";
import forecastsRouter from "./forecasts";
import citiesRouter from "./cities";
import countryBannersRouter from "./countryBanners";
import authRouter from "./auth";
import paymentsRouter from "./payments";
import adminRouter from "./admin";
import { requireAdmin } from "../lib/adminSession";

const router: IRouter = Router();

// Protect all /admin/* routes except the auth endpoints (login/logout/me).
router.use("/admin", (req, res, next) => {
  if (req.path === "/auth/login" || req.path === "/auth/logout" || req.path === "/auth/me") {
    return next();
  }
  return requireAdmin(req, res, next);
});

router.use(healthRouter);
router.use(countriesRouter);
router.use(issuesRouter);
router.use(jobsRouter);
router.use(forumRouter);
router.use(dashboardRouter);
router.use(planetsRouter);
router.use(forecastsRouter);
router.use(citiesRouter);
router.use(countryBannersRouter);
router.use(authRouter);
router.use(paymentsRouter);
router.use(adminRouter);

export default router;
