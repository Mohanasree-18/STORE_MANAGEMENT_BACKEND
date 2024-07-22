const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const shop_database = require("../model/shop");
const geocoder = require("../middlewares/fillCoordinates"); // Potential addition
const { verifyToken } = require("../middlewares/isAuth");
const geolib = require("geolib");

//! SHOP REGISTRATION
const shopController = {
  //! REGISTER
  register: asyncHandler(async (req, res) => {
    const {
      shopName,
      email,
      password,
      ownerName,
      address,
      city,
      pincode,
      latitude,
      longitude,
    } = req.body;

    // Check if all required fields are provided
    if (
      !shopName ||
      !email ||
      !password ||
      !ownerName ||
      !address ||
      !city ||
      !pincode ||
      latitude === undefined ||
      longitude === undefined
    ) {
      res.status(400).json({ message: "All fields are required" });
      return;
    }

    // Check if the shop already exists
    const shopExists = await shop_database.findOne({ email });
    if (shopExists) {
      res.status(400).json({ message: "Shop already exists" });
      return;
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create the new shop
    const shop = await shop_database.create({
      shopName,
      email,
      password: hashedPassword,
      ownerName,
      address,
      city,
      pincode,
      latitude,
      longitude,
    });

    if (shop) {
      res.status(201).json({
        _id: shop._id,
        shopName: shop.shopName,
        email: shop.email,
        ownerName: shop.ownerName,
        address: shop.address,
        city: shop.city,
        pincode: shop.pincode,
        latitude: shop.latitude,
        longitude: shop.longitude,
        createdAt: shop.createdAt,
      });
    } else {
      res.status(400).json({ message: "Invalid shop data" });
    }
  }),

  //!LOGIN
  login: asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Check if all required fields are provided
    if (!email || !password) {
      res.status(400).json({ message: "Email and password are required" });
      return;
    }

    // Check if the shop exists
    const shop = await shop_database.findOne({ email });
    if (!shop) {
      res.status(400).json({ message: "Invalid email or password" });
      return;
    }

    // Validate the password
    const isMatch = await bcrypt.compare(password, shop.password);
    if (!isMatch) {
      res.status(400).json({ message: "Invalid email or password" });
      return;
    }
    // Generate a token
    const token = jwt.sign({ id: shop._id }, "mohana", {
      expiresIn: "30d",
    });

    // Respond with the shop details
    res.status(200).json({
      message: "Login Success",
      token,
      _id: shop._id,
      shopName: shop.shopName,
      email: shop.email,
      ownerName: shop.ownerName,
      address: shop.address,
      city: shop.city,
      pincode: shop.pincode,
      latitude: shop.latitude,
      longitude: shop.longitude,
      createdAt: shop.createdAt,
    });
  }),

  //!SEARCH SINGLE SHOP BY NAME
  searchShopByName: asyncHandler(async (req, res) => {
    const { shopName } = req.params.shopName;

    // Check if shopName is provided
    if (!shopName) {
      return res.status(400).json({ message: "Shop name is required" });
    }

    // Normalize the shopName for comparison
    const normalizedShopName = shopName
      .trim()
      .replace(/\s+/g, "")
      .toLowerCase();

    // Find the shop by name, ignoring whitespaces and case sensitivity
    const shop = await shop_database.find({
      shopName: {
        $regex: new RegExp(`^${normalizedShopName}$`, "i"), // Exact match, ignoring case
      },
    });

    if (!shop || shop.length === 0) {
      return res.status(404).json({ message: "Shop not found" });
    }

    // Respond with the shop details
    res.status(200).json(
      shop.map((s) => ({
        _id: s._id,
        shopName: s.shopName,
        email: s.email,
        ownerName: s.ownerName,
        address: s.address,
        city: s.city,
        pincode: s.pincode,
        latitude: s.latitude,
        longitude: s.longitude,
        createdAt: s.createdAt,
      }))
    );
  }),

  //!BROWSE ALL SHOPS
  browseAllShops: asyncHandler(async (req, res) => {
    try {
      // Retrieve all shops from the database
      const shops = await shop_database.find({});

      // Check if there are no shops found
      if (!shops || shops.length === 0) {
        res.status(404).json({ message: "No shops found" });
        return;
      }

      // Respond with the shop details
      res.status(200).json(
        shops.map((shop) => ({
          _id: shop._id,
          shopName: shop.shopName,
          email: shop.email,
          ownerName: shop.ownerName,
          address: shop.address,
          city: shop.city,
          pincode: shop.pincode,
          latitude: shop.latitude,
          longitude: shop.longitude,
          createdAt: shop.createdAt,
        }))
      );
    } catch (error) {
      // Handle any errors that occur during the database query
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }),
  //!SHOPS UNDER 5KM RADIUS
  browseShopsWithinRadius: asyncHandler(async (req, res) => {
    try {
      const currShop = await shop_database.findById(req.user);
      if (!currShop) {
        return res.status(404).json({ message: "Shop not found" });
      }

      const { latitude: currShopLatitude, longitude: currShopLongitude } =
        currShop;
      const radiusInKm = 5;

      const allShops = await shop_database.find({});
      const nearbyShops = allShops
        .filter((shop) => shop._id.toString() !== currShop._id.toString())
        .filter((shop) => !isNaN(shop.latitude) && !isNaN(shop.longitude))
        .map((shop) => ({
          ...shop._doc,
          distanceInKm:
            geolib.getDistance(
              { latitude: currShopLatitude, longitude: currShopLongitude },
              { latitude: shop.latitude, longitude: shop.longitude }
            ) / 1000,
        }))
        .filter((shop) => shop.distanceInKm <= radiusInKm);

      res.status(200).json({ nearbyShops });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }),

  //!UPDATE OWNER NAME AND SHOP NAME
  updateShopDetails: asyncHandler(async (req, res) => {
    const curr_id = await shop_database.findById(req.user);
    const { shopName, ownerName } = req.body;

    if (shopName || ownerName) {
      const updates = { shopName, ownerName }; // Include only properties with new values

      try {
        const updatedShop = await shop_database.findByIdAndUpdate(
          curr_id,
          updates,
          {
            new: true, // Return the updated document
          }
        );

        if (!updatedShop) {
          res.status(500).json({ message: "Error updating shop details" });
          return;
        }

        res.status(200).json({
          message: "Shop details updated successfully",
          shop: updatedShop,
        });
      } catch (error) {
        res.status(500).json({ message: "Error updating shop details", error });
      }
    } else {
      res.status(400).json({ message: "No updates provided" });
    }
  }),
  //!DELETE SHOP
  deleteshop: asyncHandler(async (req, res) => {
    // Find the transaction
    const curr_id = await shop_database.findById(req.user);

    try {
      const deletedShop = await shop_database.findByIdAndDelete(curr_id);

      if (!deletedShop) {
        res.status(404).json({ message: "Shop not found" });
        return;
      }

      res.status(200).json({
        message: "Shop deleted successfully",
        shop: deletedShop,
      });
    } catch (error) {
      res.status(500).json({ message: "Error deleting shop", error });
    }
  }),
};

module.exports = shopController;
