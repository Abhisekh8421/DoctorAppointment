import express from "express";
import cors from "cors";
import "dotenv/config";
import { connectDb } from "./config/mongodb.js";
import connectCloudinary from "./config/cloudinary.js";
import adminRouter from "./routes/adminRoutes.js";
import doctorRouter from "./routes/doctorRoutes.js";
import userRouter from "./routes/userRoutes.js";

const app = express();
const port = process.env.PORT || 4000;
connectDb();
connectCloudinary();

//middlewares
app.use(express.json());
app.use(cors());

//endpoints
app.use("/api/admin", adminRouter); //localhost:4000/api/admin
app.use("/api/doctor", doctorRouter); //localhost:4000/api/doctor
app.use("/api/user", userRouter);

app.get("/", (req, res) => {
  res.send("API WORKING");
});

app.listen(port, () => {
  console.log("Server Started", port);
});
