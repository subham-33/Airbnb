const express = require("express");
const router = express.Router({mergeParams: true});
const wrapAsync = require("../utils/wrapAsync.js");
const {reviewValidation, isLoggedin, isReviewAuthor} = require("../middleware.js")
const reviewController = require("../controllers/reviews.js")

//delete reviews
router.delete(
  "/:reviewId",
  isLoggedin,
  isReviewAuthor,
  wrapAsync(reviewController.destroyReview),
);

//writing a review(post)
router.post(
  "/",
  isLoggedin,
  reviewValidation,
  wrapAsync(reviewController.newReview),
);

module.exports = router;
