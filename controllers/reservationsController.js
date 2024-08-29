import reservationModel from "../models/reservationModel.js";

export const listReservations = async (req, res) => {
  try {
    const reservations = await reservationModel.find();
    res.json({ success: true, reservations });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addReservation = async (req, res) => {
  try {
    const { dateTime, duration, persons, console, notes } = req.body;

    const newReservation = new reservationModel({
      dateTime,
      duration,
      persons,
      console,
      notes,
    });

    await newReservation.save();

    res.json({
      success: true,
      message: "Reservation created successfully",
      console: newReservation,
    });
  } catch (error) {
    console.error("Error adding reservation:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteReservation = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedReservation = await reservationModel.findByIdAndDelete(id);

    if (!deletedReservation) {
      return res
        .status(404)
        .json({ success: false, message: "Reservation not found" });
    }

    res.json({ success: true, message: "Reservation deleted successfully" });
  } catch (error) {
    console.error("Error deleting reservation:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
