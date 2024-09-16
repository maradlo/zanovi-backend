import reservationModel from "../models/reservationModel.js";
import nodemailer from "nodemailer";

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
    const { dateTime, duration, persons, console, notes, email } = req.body;

    const newReservation = new reservationModel({
      dateTime,
      duration,
      persons,
      console,
      notes,
      email,
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

export const confirmReservation = async (req, res) => {
  try {
    const { id } = req.params;

    const confirmedReservation = await reservationModel.findByIdAndUpdate(
      id,
      { confirmed: true, declined: false }, // Set confirmed to true, declined to false
      { new: true } // Return the updated document
    );

    if (!confirmedReservation) {
      return res
        .status(404)
        .json({ success: false, message: "Reservation not found" });
    }

    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: confirmedReservation.email,
      subject: "Potvrdenie rezervácie",
      html: `<p>Vaša rezervácia bola potvrdená. Tešíme sa na Vás v ZANOVI.</p>`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        return res.json({ success: false, message: "Failed to send email." });
      } else {
        res.json({
          success: true,
          message: "Rezervácia bola potvrdená",
        });
      }
    });
  } catch (error) {
    console.error("Error confirming reservation:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const declineReservation = async (req, res) => {
  try {
    const { id } = req.params;

    const declinedReservation = await reservationModel.findByIdAndUpdate(
      id,
      { confirmed: false, declined: true }, // Set confirmed to false, declined to true
      { new: true } // Return the updated document
    );

    if (!declinedReservation) {
      return res
        .status(404)
        .json({ success: false, message: "Reservation not found" });
    }

    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: declinedReservation.email,
      subject: "Zamietnutie rezervácie",
      html: `<p>Vaša rezervácia bola zamietnutá. Prosím, zvoľte si iný dátum.</p>`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        return res.json({ success: false, message: "Failed to send email." });
      } else {
        res.json({
          success: true,
          message: "Rezervácia bola zamietnutá",
        });
      }
    });
  } catch (error) {
    console.error("Error declining reservation:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
