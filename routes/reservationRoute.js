import express from "express";
import {
  addReservation,
  deleteReservation,
  listReservations,
} from "../controllers/reservationsController.js";

const reservationsRouter = express.Router();

reservationsRouter.get("/list", listReservations);
reservationsRouter.post("/add", addReservation);
reservationsRouter.delete("/:id", deleteReservation);

export default reservationsRouter;
