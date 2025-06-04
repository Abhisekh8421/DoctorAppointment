import express from "express";
import {
  addDoctor,
  allDoctors,
  loginAdmin,
  appointmentsAdmin,
  AppointmentCancel,
  adminDashboard,
} from "../controllers/adminController.js";
import { upload } from "../middleware/multer.js";
import { authAdmin } from "../middleware/authAdmin.js";
import { changeAvailability } from "../controllers/doctorController.js";

const router = express.Router();

router.post("/add-doctor", authAdmin, upload.single("image"), addDoctor);
router.post("/login", loginAdmin);
router.get("/all-doctors", authAdmin, allDoctors);
router.post("/change-availability", authAdmin, changeAvailability);
router.get("/appointments", authAdmin, appointmentsAdmin);
router.post("/cancel-appointment", authAdmin, AppointmentCancel);
router.get("/dashboard", authAdmin, adminDashboard);

export default router;
