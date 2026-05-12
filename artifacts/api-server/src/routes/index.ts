import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import playersRouter from "./players";
import teamsRouter from "./teams";
import auctionsRouter from "./auctions";
import analyticsRouter from "./analytics";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(playersRouter);
router.use(teamsRouter);
router.use(auctionsRouter);
router.use(analyticsRouter);

export default router;
