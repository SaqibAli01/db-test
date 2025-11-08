// =====================
// 🌍 server.js (Fully Typed & Robust Version)
// =====================

require("dotenv").config();
require("express-async-errors");
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const mongoose = require("mongoose");
const routes = require("./routes");
const errorHandler = require("./middlewares/error.middleware");

/** @type {express.Application} */
const app = express();
const PORT = process.env.PORT || 5000;

// =====================
// 🔌 Connect to MongoDB
// =====================

/**
 * Connect to MongoDB using Mongoose
 * @returns {Promise<void>}
 */
const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    console.error("❌ MONGODB_URI is missing in .env file");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 20000, // 20s timeout
    });
    console.log("✅ MongoDB connected successfully");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1); // Exit if DB connection fails
  }
};

connectDB();

// Monitor MongoDB connection
mongoose.connection.on("disconnected", () => {
  console.warn("⚠️ MongoDB disconnected");
});

// =====================
// 🔒 Security
// =====================
app.disable("x-powered-by");

// =====================
// 🌐 CORS Configuration
// =====================
const allowedOrigins = [
  "https://arfeen.vercel.app", // production frontend
  "http://localhost:3000",     // local development
];

/** @type {import("cors").CorsOptions} */
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization",
  ],
  credentials: true,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // Preflight requests

// =====================
// 🧩 Middleware
// =====================
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// =====================
// 🚀 Routes
// =====================
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to Dr. Noor Backend API",
    version: "1.0.0",
    documentation: "https://github.com/your-username/your-repo",
    endpoints: {
      auth: "/api/auth",
      users: "/api/users",
      appointments: "/api/appointments",
      daySchedule: "/api/schedule",
      doctorAvailability: "/api/doctor-availability",
      dashboard: "/api/dashboard",
      health: "/health",
    },
  });
});

app.use("/api", routes);

// Health check
app.get("/health", (req, res) => res.json({ status: "ok" }));

// Handle 404 routes
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Global error handler
app.use(errorHandler);

// =====================
// 🚀 Start Server (local dev only)
// =====================
if (require.main === module && !process.env.VERCEL_ENV) {
  const server = app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
  });

  // Handle EADDRINUSE error
  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(
        `❌ Port ${PORT} is already in use. Please close the process or change the port.`
      );
      process.exit(1);
    } else {
      console.error("❌ Server error:", err);
      process.exit(1);
    }
  });
}

// =====================
// 🧱 Export (for Vercel / Serverless)
// =====================
module.exports = app;
