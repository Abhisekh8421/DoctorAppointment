import mongoose from "mongoose";

const connectDb = async () => {
  await mongoose
    .connect(process.env.MONGODB_URI, {
      dbName: "DocConnect",
    })
    .then(() => console.log("Database connected"))
    .catch((e) => console.log("Error while connecting db", e.message));
};

export { connectDb };
