import { Router, type IRouter } from "express";
import healthRouter from "./health";
import countriesRouter from "./countries";
import issuesRouter from "./issues";
import jobsRouter from "./jobs";
import forumRouter from "./forum";
import dashboardRouter from "./dashboard";
import authRouter from "./auth";
import paymentsRouter from "./payments";

const router: IRouter = Router();

router.use(healthRouter);
router.use(countriesRouter);
router.use(issuesRouter);
router.use(jobsRouter);
router.use(forumRouter);
router.use(dashboardRouter);
router.use(authRouter);
router.use(paymentsRouter);

export default router;
