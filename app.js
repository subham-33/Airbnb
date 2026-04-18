if (process.env.NODE_ENV != "production") {
  require("dotenv").config();
}

//console.log(process.env.SECRET)

const express = require("express");
const app = express();
const ejs = require("ejs");
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");
const MongoStore = require("connect-mongo"); //to store session (using mongo)

const listingRouter = require("./routes/listing.js"); //requiring express router from ./routes/listing.js
const reviewRouter = require("./routes/review.js"); //requiring express router from ./routes/review.js
const userRouter = require("./routes/user.js");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "public")));

//connecting to DB

let dbURL = process.env.ATLASDB_URL;

console.log("DB URL:", dbURL);

async function main() {
  await mongoose.connect(dbURL);
  console.log("Connected to DB");

  // ✅ Inside main — connection is guaranteed ready here
  const store = MongoStore.create({
    client: mongoose.connection.getClient(),
    crypto: {
      secret: process.env.SECRET,
    },
    touchAfter: 24 * 3600,
  });

  store.on("error", (err) => {
    console.log("Mongo session store error:", err);
  });

  const sessionOption = {
    store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false, // ← false is best practice
    cookie: {
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    },
  };

  // ✅ Must also be inside main — needs store to be ready
  app.use(session(sessionOption));
  app.use(flash());
}

main().catch((err) => console.log(err));

// //Home page
// app.get("/", (req, res) => {
//   res.send("Hi, Im root");
// });

app.use(session(sessionOption)); // using the session with the options
app.use(flash()); //always use flash before the routes

app.use(passport.initialize()); //initialize the passport
app.use(passport.session()); //using user session

// use static authenticate method of model in LocalStrategy
passport.use(new LocalStrategy(User.authenticate()));

// use static serialize and deserialize of model for passport session support
passport.serializeUser(User.serializeUser()); //store user session
passport.deserializeUser(User.deserializeUser()); //remove user session once the browser is closed/ user logoff

//directly accessed middleware
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;
  next();
});

//routes
app.use("/listings", listingRouter); //using express router from ./router/listing.js
app.use("/listings/:id/reviews", reviewRouter); //using express router from ./router/listing.js
app.use("/", userRouter);

//middleware for errors
app.all("/{*any}", (req, res, next) => {
  next(new ExpressError(404, "page not found"));
});

app.use((err, req, res, next) => {
  let { status = 500, message = "something went wrong!!" } = err;
  // res.status(status).send(message);

  res.status(status).render("error.ejs", { status, message });
});

app.listen(3000, () => {
  console.log("app is listening on port 3000");
});
