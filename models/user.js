const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose").default;

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
  },
});

userSchema.plugin(passportLocalMongoose);
//passport-local-mongoose will automatically create username and hashed password for us in the schema using this plugin. So we dont need to define it in the Schema
//username is bydefault unique

module.exports = mongoose.model("User", userSchema);
