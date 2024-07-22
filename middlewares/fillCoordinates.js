const NodeGeocoder = require("node-geocoder");

// geocoder is configured here
const geocoder = NodeGeocoder({
  provider: "google",
  httpAdapter: "https",
  apiKey: process.env.API_KEY, // Ensure this is set in your .env file
  formatter: null,
});

const fillCoordinates = async (req, res, next) => {
  try {
    const {
      shopName,
      email,
      ownerName,
      address,
      city,
      pincode,
      latitude,
      longitude,
    } = req.body;

    if (!latitude || !longitude) {
      const fullAddress = `${address}, ${city}, ${pincode}`;
      const geocodeResponse = await geocoder.geocode(fullAddress);

      if (geocodeResponse.length > 0) {
        req.body.latitude = geocodeResponse[0].latitude;
        req.body.longitude = geocodeResponse[0].longitude;
      } else {
        return res
          .status(400)
          .send("Unable to fetch coordinates for the provided address");
      }
    }

    next(); // Move to the next middleware or route handler
  } catch (error) {
    console.error("Error during geocoding:", error);
    return res.status(500).send("An error occurred while fetching coordinates");
  }
};

module.exports = fillCoordinates;
