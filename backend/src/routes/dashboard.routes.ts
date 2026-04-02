import { Router } from "express";
import { authenticate, AuthenticatedRequest } from "../middlewares/authmiddleware";
import { authorize } from "../middlewares/authorizemiddleware";

const router = Router();

router.get("/", authenticate, authorize("ADMIN", "ANALYST", "VIEWER"), (req: AuthenticatedRequest, res) => {
  const role = req.user?.role;

  if (role === "ADMIN") {
    return res.json({
      message: "Full dashboard for admin",
    });
  }

  if (role === "ANALYST") {
    return res.json({
      message: "Dashboard with analytics view for analyst",
    });
  }

  return res.json({
    message: "Read-only dashboard for viewer",
  });
});

export default router;