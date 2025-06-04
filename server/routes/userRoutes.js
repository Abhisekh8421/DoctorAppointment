import express from "express";
import {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  bookAppointment,
  listAppointments,
  cancelAppointment,
  paymentRazorpay,
  verifyRazorpayPayment,
} from "../controllers/userController.js";
import { authUser } from "../middleware/authUser.js";
import { upload } from "../middleware/multer.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/get-profile", authUser, getProfile);
router.post("/update-profile", upload.single("image"), authUser, updateProfile);
router.post("/book-appointment", authUser, bookAppointment);
router.get("/appointments", authUser, listAppointments);
router.post("/cancel-appointment", authUser, cancelAppointment);
router.post("/payment-razorpay", authUser, paymentRazorpay);
router.post("/verifyRazorpay", authUser, verifyRazorpayPayment);

export default router;
