const Listing = require("../models/listing.js");
const Review = require("../models/review.js");

module.exports.newReview = async (req, res) => {
  let listing = await Listing.findById(req.params.id);
  let newReview = new Review(req.body.review);
  newReview.author = req.user._id;

  listing.reviews.push(newReview);

  await newReview.save();
  await listing.save();

  req.flash("success", "Review created");
  res.redirect(`/listings/${listing._id}`);
};

module.exports.destroyReview = async (req, res) => {
  let { id, reviewId } = req.params;

  await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } }); //$pull will search for matching reviewId inside reviews folder and will delete it
  let delData_review = await Review.findByIdAndDelete(reviewId); //delete from the reviews collection

  console.log(delData_review);
  req.flash("success", "Review Deleted");
  res.redirect(`/listings/${id}`);
};
