const express = require("express");
const router = express.Router();
const shopController = require("../controllers/shopctrl"); // Adjusted import
const fillCoordinates = require("../middlewares/fillCoordinates"); // Adjusted import
const isAuthenticated = require("../middlewares/isAuth");

// REGISTER ROUTE (CREATE new shop )
router.post("/register", fillCoordinates, shopController.register);

//LOGIN ROUTE  (LOGIN to your shop)
router.post("/login", shopController.login);

//SEARCH ROUTE SINGLE SHOP (get single shop)
router.get("/search/:shopName", shopController.searchShopByName);

//BROWSE ALL SHOPS ROUTE (get all docs in databse)
router.get("/allshops", shopController.browseAllShops);

//5KM NEAR SHOPS TO ONE SHOP
router.get("/nearme", isAuthenticated, shopController.browseShopsWithinRadius);

//UPDATE ROUTER
router.put("/update", isAuthenticated, shopController.updateShopDetails);

//DELETE ROUTER
router.delete("/delete", isAuthenticated, shopController.deleteshop);

module.exports = router;
