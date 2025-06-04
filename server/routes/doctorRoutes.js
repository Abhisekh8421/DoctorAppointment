import express from "express";
import {
  appointmentsmentsDoctor,
  doctorList,
  loginDoctor,
  appointmentCancel,
  appointmentComplete,
} from "../controllers/doctorController.js";
import { authDoctor } from "../middleware/authDoctor.js";

const router = express.Router();

router.get("/list", doctorList);
router.post("/login", loginDoctor);
router.get("/appointments", authDoctor, appointmentsmentsDoctor);
router.post("/complete-appointment", authDoctor, appointmentComplete);
router.post("/cancel-appointment", authDoctor, appointmentComplete);

export default router;
