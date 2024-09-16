import mongoose from "mongoose";

const reservationSchema = new mongoose.Schema({
  dateTime: {
    type: String,
    required: true,
  },
  duration: {
    type: String,
    required: true,
  },
  persons: {
    type: Number,
    required: true,
  },
  console: {
    type: String,
    required: true,
  },
  notes: {
    type: String,
    required: false,
  },
  confirmed: {
    type: Boolean,
    required: false,
    default: false,
  },
  declined: {
    type: Boolean,
    required: false,
    default: false,
  },
  email: {
    type: String,
    required: true,
  },
});

const reservationModel =
  mongoose.models.Reservation ||
  mongoose.model("Reservation", reservationSchema);

export default reservationModel;
