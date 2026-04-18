const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const { isLoggedin } = require("../middleware.js");
const { isOwner, errValidation } = require("../middleware.js");
const listingController = require("../controllers/listings.js");
const multer = require("multer"); //parse the image data
const { storage } = require("../cloudConfig.js");
//const upload = multer({ dest: "uploads/" });
const upload = multer({ storage });

router
  .route("/")
  .get(wrapAsync(listingController.index)) //Index Route
  .post(
    isLoggedin,
    upload.single("listing[image]"),
    errValidation,
    wrapAsync(listingController.createListing),
  ); //Post route
// .post(upload.single("listing[image][url]"), (req, res) => {
//   res.send(req.file);
// });

//get New Listing
router.get("/new", isLoggedin, listingController.renderNewForm);

router
  .route("/:id")
  .get(wrapAsync(listingController.showListing)) //individual listing route
  .patch(
    //update route
    isLoggedin,
    isOwner,
    upload.single("listing[image]"),
    errValidation,
    wrapAsync(listingController.updateListing),
  )
  .delete(isLoggedin, isOwner, wrapAsync(listingController.destroyListing)); //destroy route

//get edit listings
router.get(
  "/:id/edit",
  isLoggedin,
  isOwner,
  wrapAsync(listingController.getEditListing),
);

module.exports = router;
