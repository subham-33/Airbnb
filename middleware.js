
const { listingSchema } = require("./schema.js");
const { reviewSchema } = require("./schema.js");
const ExpressError = require("./utils/ExpressError.js");
const Listing = require("./models/listing");
const Review = require("./models/review.js");

//joi error validation at listingSchema
module.exports.errValidation = (req, res, next) => {
  let { error } = listingSchema.validate(req.body); //joi validation of schema

  if (error) {
    console.log(error.details);

    let errMsg = error.details.map((el) => el.message).join(",");
    throw new ExpressError(400, errMsg);
  } else {
    next();
  }
};

//joi error validation at reviewSchema
module.exports.reviewValidation = (req, res, next) => {
  let { error } = reviewSchema.validate(req.body); //joi validation of schema

  if (error) {
    console.log(error.details);

    let errMsg = error.details.map((el) => el.message).join(",");
    throw new ExpressError(400, errMsg);
  } else {
    next();
  }
};

//to implement user authentication
module.exports.isLoggedin = (req, res, next) => {

  if (!req.isAuthenticated()) {

    // save the URL user was trying to access
    req.session.redirectUrl = req.originalUrl;

    req.flash("error", "You must be logged in");
    return res.redirect("/login");
  }

  next();
};

//to implement automatic redirect where user asked to login before the login
module.exports.saveRedirectUrl = (req, res, next) => {

  if(req.session.redirectUrl){

    res.locals.redirectUrl = req.session.redirectUrl;
  }

  next();
}

//to impletement authorisation(only owner can edit and delete)
module.exports.isOwner = async (req, res, next) => {

    let {id} = req.params;
    let listing = await Listing.findById(id)

    if(!listing.owner.equals(res.locals.currUser._id)){

      req.flash("error", "You are not the owner of this Listing")
      return res.redirect(`/listings/${id}`)
    }

    next();
}

//to impletement authorisation(only owner can edit and delete)
module.exports.isReviewAuthor = async (req, res, next) => {

    let {id, reviewId} = req.params;
    let review = await Review.findById(reviewId)

    if(!review.author.equals(res.locals.currUser._id)){

      req.flash("error", "Permission Denied, You are not the author")
      return res.redirect(`/listings/${id}`)
    }

    next();
}