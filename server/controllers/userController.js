import validator from "validator";
import bcrypt from "bcrypt";
import userModel from "../models/userModel.js";
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";
import { appointmentModel } from "../models/appointmentsModel.js";
import doctorModel from "../models/doctorModel.js";
import razorpay from "razorpay";

//Api to register

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (
      [name, email, password].some((field) => !field || field.trim() === "")
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid mail",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Enter a strong password",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userData = {
      name,
      email,
      password: hashedPassword,
    };
    const user = await userModel.create(userData);
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    res.json({
      success: true,
      token,
    });
  } catch (error) {
    console.log(error.message);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.json({
        success: false,
        message: "User does not exist",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
      res.json({
        success: true,
        token,
      });
    } else {
      res.json({
        success: false,
        message: "Invalid credentials",
      });
    }
  } catch (error) {
    console.log(error.message);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

//api to get user profile data

const getProfile = async (req, res) => {
  try {
    const { userId } = req.body;
    const userData = await userModel.findById(userId).select("-password");
    res.json({
      success: true,
      userData,
    });
  } catch (error) {
    console.log(error.message);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

//update user details

const updateProfile = async (req, res) => {
  try {
    const { userId, name, gender, address, phone, dob } = req.body;
    const imageFile = req.file;
    if (
      [name, gender, phone, dob].some((field) => !field || field.trim() === "")
    ) {
      return res.json({
        success: false,
        message: "Data missing",
      });
    }

    await userModel.findByIdAndUpdate(userId, {
      $set: {
        name,
        phone,
        address: JSON.parse(address),
        dob,
        gender,
      },
    });

    if (imageFile) {
      //upload to cloudinary
      const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
        resource_type: "image",
      });

      const imageUrl = imageUpload.secure_url;
      await userModel.findByIdAndUpdate(userId, { $set: { image: imageUrl } });
    }
    res.json({
      success: true,
      message: "Profile Updated",
    });
  } catch (error) {
    console.log(error.message);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

//imp ** to book the appointments

const bookAppointment = async (req, res) => {
  try {
    const { userId, docId, slotDate, slotTime } = req.body;
    const docData = await doctorModel.findById(docId).select("-password");

    if (!docData || !docData.available) {
      return res.json({
        success: false,
        message: "Doctor is currently unavailable",
      });
    }

    //       slots_booked: {
    //   "25_05_2025": ["09:00", "10:00", "14:00"],
    //   "26_05_2025": ["11:00", "15:00"]
    // }
    // example how the data is stored

    let slots_booked = docData.slots_booked;

    if (slots_booked[slotDate]) {
      if (slots_booked[slotDate].includes(slotTime)) {
        return res.json({ success: false, message: "Slot is Not Available" });
      } else {
        slots_booked[slotDate].push(slotTime);
      }
    } else {
      slots_booked[slotDate] = [];
      slots_booked[slotDate].push(slotTime);
    }

    //     docData.slots_booked = slots_booked;
    // await docData.save();
    const userData = await userModel.findById(userId).select("-password");
    //imp  Remove slots_booked from docData to avoid bloating the appointment doc
    delete docData.slots_booked;
    const appointmentData = {
      userId,
      docId,
      userData,
      docData,
      amount: docData.fees,
      slotTime,
      slotDate,
      date: Date.now(),
    };

    await appointmentModel.create(appointmentData);

    //save new slots data in docData

    await doctorModel.findByIdAndUpdate(docId, {
      $set: {
        slots_booked,
      },
    });

    res.json({
      success: true,
      message: "Appointment booked successfully",
    });
  } catch (error) {
    console.log(error.message);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

//list of appointments the user has booked

const listAppointments = async (req, res) => {
  try {
    const { userId } = req.body;
    const appointments = await appointmentModel.find({ userId });

    res.json({ success: true, appointments });
  } catch (error) {
    console.log(error.message);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

//cancel the appointments
const cancelAppointment = async (req, res) => {
  try {
    const { userId, appointmentId } = req.body;
    const appointmentData = await appointmentModel.findById(appointmentId);
    if (!appointmentData) {
      return res.json({ success: false, message: "Appointment not found" });
    }

    //verify appointment user
    if (appointmentData.userId !== userId) {
      return res.json({
        success: false,
        message: "Unauthorized action",
      });
    }

    if (appointmentData.cancelled) {
      return res.json({
        success: false,
        message: "Appointment already cancelled",
      });
    }

    await appointmentModel.findByIdAndUpdate(appointmentId, {
      $set: {
        cancelled: true,
      },
    });

    //release the time slots

    const { docId, slotDate, slotTime } = appointmentData;
    const doctorData = await doctorModel.findById(docId);
    let slots_booked = doctorData.slots_booked;
    slots_booked[slotDate] = slots_booked[slotDate].filter(
      (e) => e !== slotTime
    );
    await doctorModel.findByIdAndUpdate(docId, {
      $set: {
        slots_booked,
      },
    });
    res.json({
      success: true,
      message: "Appointment cancelled",
    });
  } catch (error) {
    console.log(error.message);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

//add the payment methods (Razorpay)

const razorpayInstance = new razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const paymentRazorpay = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    const appointmentData = await appointmentModel.findById(appointmentId);
    if (!appointmentData || appointmentData.cancelled) {
      return res.json({
        success: false,
        message: "Appointment cancelled or not found",
      });
    }
    //creating options for razorpay payment
    const options = {
      amount: appointmentData.amount * 100,
      currency: process.env.CURRENCY,
      receipt: appointmentId,
    };
    //create the order
    const order = await razorpayInstance.orders.create(options);
    res.json({
      success: true,
      order,
    });
  } catch (error) {
    console.log(error.message);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

const verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id } = req.body;
    const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id);
    if (orderInfo.status === "paid") {
      await appointmentModel.findByIdAndUpdate(orderInfo.receipt, {
        $set: {
          payment: true,
        },
      });
      res.json({
        success: true,
        message: "Payment successful",
      });
    } else {
      res.json({
        success: false,
        message: "Payment failed",
      });
    }
  } catch (error) {
    console.log(error.message);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

export {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  bookAppointment,
  listAppointments,
  cancelAppointment,
  paymentRazorpay,
  verifyRazorpayPayment,
};
