import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: "thecapitalhub",
    });
    console.log("Database is connected");
  } catch (error) {
    console.log("error-->",error) 
    throw new Error("Internal Server Error");
  }
};

export default connectDB;
