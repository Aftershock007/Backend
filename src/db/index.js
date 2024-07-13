import mongoose from "mongoose"
import { DB_NAME } from "../constants.js"

export default async function connectDB() {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`,
    )
    console.log(
      `MongoDb connected !! DB Host: ${connectionInstance.connection.host}`,
    )
  } catch (error) {
    console.error("MongoDb connection failed: ", error)
  }
}
