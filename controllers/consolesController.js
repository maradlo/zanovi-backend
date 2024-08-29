import consoleModel from "../models/consoleModel.js";

// List all consoles
export const listConsoles = async (req, res) => {
  try {
    const consoles = await consoleModel.find();
    res.json({ success: true, consoles });
  } catch (error) {
    console.error("Error listing consoles:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get a single console by ID
export const getConsoleById = async (req, res) => {
  try {
    const { id } = req.params;
    const consoleItem = await consoleModel.findById(id);

    if (!consoleItem) {
      return res
        .status(404)
        .json({ success: false, message: "Console not found" });
    }

    res.json({ success: true, console: consoleItem });
  } catch (error) {
    console.error("Error getting console:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add a new console
export const addConsole = async (req, res) => {
  try {
    const { name, description } = req.body;

    const newConsole = new consoleModel({
      name,
      description,
    });

    await newConsole.save();

    res.json({
      success: true,
      message: "Console added successfully",
      console: newConsole,
    });
  } catch (error) {
    console.error("Error adding console:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update an existing console
export const updateConsole = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const updatedConsole = await consoleModel.findByIdAndUpdate(
      id,
      { name, description },
      { new: true }
    );

    if (!updatedConsole) {
      return res
        .status(404)
        .json({ success: false, message: "Console not found" });
    }

    res.json({
      success: true,
      message: "Console updated successfully",
      console: updatedConsole,
    });
  } catch (error) {
    console.error("Error updating console:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete a console
export const deleteConsole = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedConsole = await consoleModel.findByIdAndDelete(id);

    if (!deletedConsole) {
      return res
        .status(404)
        .json({ success: false, message: "Console not found" });
    }

    res.json({ success: true, message: "Console deleted successfully" });
  } catch (error) {
    console.error("Error deleting console:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
