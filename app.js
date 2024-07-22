const express = require("express");
const app = express();
const mongoose = require("mongoose");
const NodeGeocoder = require("node-geocoder");
const cors = require("cors");

// Load environment variables from .env file
require("dotenv").config();

// Access connection string from .env file
const connstr = process.env.CONNECTION_STRING;

//! Connect to MongoDB
mongoose
  .connect(connstr)
  .then(() => console.log("mongoose connected successfully"))
  .catch((e) => console.log(e));

// Google API integration (consider using environment variables for the API key)
const geocoder = NodeGeocoder({
  provider: "google",
  httpAdapter: "https",
  apiKey: process.env.API_KEY, // Ensure this is set in your .env file
  formatter: null,
});
//!CORS
const corsOptions = {
  origin: ["http://localhost:3000"],
};
app.use(cors(corsOptions));

//! Routes
const shopRoutes = require("./routes/shopRouter");
app.use(express.json());
app.use("/api/shops", shopRoutes);

//! Start the server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log("server is running on port:", PORT));
