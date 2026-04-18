const Listing = require("../models/listing.js");
const ExpressError = require("../utils/ExpressError.js");
const { cloudinary } = require("../cloudConfig.js");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

module.exports.index = async (req, res) => {
  const allListings = await Listing.find({});
  res.render("listings/index.ejs", { allListings });
};

module.exports.renderNewForm = (req, res) => {
  //console.log(req.user); //the user related information is stored
  // if(!req.isAuthenticated()){

  //   req.flash("error", "You must be logged in to create new listing");
  //   return res.redirect("/login");
  // }
  res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id)
    .populate({ path: "reviews", populate: { path: "author" } })
    .populate("owner");

  if (!listing) {
    req.flash("error", "The listing does not exists.");
    return res.redirect("/listings");
  }

  //console.log(listing.owner.username);
  res.render("listings/show.ejs", { listing });
};

module.exports.createListing = async (req, res, next) => {
  if (!req.body.listing) {
    throw new ExpressError(400, "Enter valid data");
  }

  // Step 1: Extract and clean temp map fields
  const listingData = { ...req.body.listing };
  const { lat, lng } = listingData;
  delete listingData.lat;
  delete listingData.lng;

  const newListing = new Listing(listingData);
  newListing.owner = req.user._id;

  // Step 2: Resolve geometry
  // Priority 1 — marker was dragged
  if (lat && lng) {
    newListing.geometry = {
      type: "Point",
      coordinates: [parseFloat(lng), parseFloat(lat)],
    };
  }
  // Priority 2 — fallback to geocoding the location text
  else if (listingData.location) {
    const response = await geocodingClient
      .forwardGeocode({ query: listingData.location, limit: 1 })
      .send();

    if (!response.body.features.length) {
      req.flash("error", "Invalid location — try pinning it on the map");
      return res.redirect("/listings/new");
    }

    newListing.geometry = response.body.features[0].geometry;
  } else {
    req.flash("error", "Please provide a location or pin it on the map");
    return res.redirect("/listings/new");
  }

  // Step 3: Handle image upload
  if (req.file) {
    newListing.image = {
      url: req.file.path,
      filename: req.file.filename,
    };
  }

  await newListing.save();

  req.flash("success", "New Listing Created");
  res.redirect("/listings");

  // let { title, description, price, location, country } = req.body;

  // const listing = new Listing({
  //   title: title,
  //   description: description,
  //   price: price,
  //   location: location,
  //   country: country,
  // });

  // await listing.save();
};

module.exports.getEditListing = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);

  if (!listing) {
    req.flash("error", "The listing does not exists.");
    return res.redirect("/listings");
  }

  let originalImageUrl = listing.image.url;
  originalImageUrl = originalImageUrl.replace(
    "/upload",
    "/upload/c_fill,h_300,w_250",
  );

  res.render("listings/edit.ejs", { listing, originalImageUrl });
};

module.exports.updateListing = async (req, res) => {
  let { id } = req.params;

  if (!req.body.listing) {
    throw new ExpressError(400, "Enter valid data");
  }

  // Step 1: Build update object and remove temp map fields
  const updateData = { ...req.body.listing };
  const { lat, lng } = updateData;
  delete updateData.lat;
  delete updateData.lng;

  // Step 2: Resolve geometry
  // Priority 1 — marker was dragged
  if (lat && lng) {
    updateData.geometry = {
      type: "Point",
      coordinates: [parseFloat(lng), parseFloat(lat)],
    };
  }
  // Priority 2 — fallback to geocoding the location text
  else if (updateData.location) {
    const response = await geocodingClient
      .forwardGeocode({ query: updateData.location, limit: 1 })
      .send();

    if (!response.body.features.length) {
      req.flash("error", "Invalid location");
      return res.redirect(`/listings/${id}/edit`);
    }

    updateData.geometry = response.body.features[0].geometry;
  }

  // Step 3: Handle image update
  if (req.file) {
    const existing = await Listing.findById(id).select("image");
    await cloudinary.uploader.destroy(existing.image.filename);
    updateData.image = { url: req.file.path, filename: req.file.filename };
  }

  // Step 4: Single DB write with everything ready
  await Listing.findByIdAndUpdate(id, updateData, {
    runValidators: true,
    returnDocument: "after",
  });

  req.flash("success", "Listing Updated");
  res.redirect(`/listings/${id}`);

  // let { title, description, price, location, country } = req.body;

  // await Listing.findByIdAndUpdate(id, {
  //   title: title,
  //   description: description,
  //   price: price,
  //   location: location,
  //   country: country,
  // });
};

module.exports.destroyListing = async (req, res) => {
  let { id } = req.params;

  let delListing = await Listing.findByIdAndDelete(id);
  await cloudinary.uploader.destroy(delListing.image.filename); //delete image from the cloud after deletion
  console.log(delListing);
  req.flash("success", "Listing Deleted");
  res.redirect("/listings");
};
