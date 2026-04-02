import { Router } from "express";
import { authenticate } from "../middlewares/authmiddleware";
import { authorize } from "../middlewares/authorizemiddleware";

const router = Router();

router.use(authenticate, authorize("ADMIN"));

router.post("/users", (req, res) => {
  res.json({ message: "Admin created a user" });
});

router.put("/users/:id", (req, res) => {
  res.json({ message: "Admin updated a user" });
});

router.delete("/users/:id", (req, res) => {
  res.json({ message: "Admin deleted a user" });
});

router.post("/records", (req, res) => {
  res.json({ message: "Admin created a record" });
});

export default router;