import { Router } from "express";
import { authenticate } from "../middlewares/authmiddleware";
import { authorize } from "../middlewares/authorizemiddleware";
const router = Router();

router.get("/", authenticate, authorize("ADMIN", "ANALYST"), (req, res) => {
  res.json({ message: "Analytics data" });
});

router.get("/filter", authenticate, authorize("ADMIN", "ANALYST"), (req, res) => {
  res.json({ message: "Filtered analytics data" });
});

export default router;