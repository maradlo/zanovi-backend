import mongoose from "mongoose";

const consoleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: false,
  },
});

const consoleModel =
  mongoose.models.Console || mongoose.model("Console", consoleSchema);

export default consoleModel;
