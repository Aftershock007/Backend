import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

// We are using .use() to setup the configurations
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
  })
)

// For accepting JSON data
app.use(express.json({ limit: "16kb" }))
// For accepting data in URL
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
// For storing some files in the server
app.use(express.static("public"))
// For accessing cookies
app.use(cookieParser())

export { app }
