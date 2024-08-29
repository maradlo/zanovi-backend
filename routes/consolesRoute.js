import express from "express";
import {
  listConsoles,
  getConsoleById,
  addConsole,
  updateConsole,
  deleteConsole,
} from "../controllers/consolesController.js";

const consolesRouter = express.Router();

consolesRouter.get("/list", listConsoles); // Separate route for listing consoles
consolesRouter.get("/:id", getConsoleById); // Route for getting a specific console by ID
consolesRouter.post("/", addConsole); // Route for adding a new console
consolesRouter.put("/:id", updateConsole); // Route for updating a console by ID
consolesRouter.delete("/:id", deleteConsole); // Route for deleting a console by ID

export default consolesRouter;
