import express from "express";
import {
  addReservation,
  deleteReservation,
  listReservations,
  confirmReservation,
  declineReservation,
} from "../controllers/reservationsController.js";

const reservationsRouter = express.Router();

reservationsRouter.get("/list", listReservations);
reservationsRouter.post("/add", addReservation);
reservationsRouter.delete("/:id", deleteReservation);
reservationsRouter.post("/:id/confirm", confirmReservation);
reservationsRouter.post("/:id/decline", declineReservation);

export default reservationsRouter;
