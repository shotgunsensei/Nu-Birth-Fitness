import { Router, type IRouter } from "express";
import healthRouter from "./health";
import funnelRouter from "./funnel";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(funnelRouter);
router.use(adminRouter);

export default router;
