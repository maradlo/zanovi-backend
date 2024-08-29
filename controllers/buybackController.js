import fs from "fs";
import { PDFDocument } from "pdf-lib";
import path from "path";
import { fileURLToPath } from "url";
import buybackModel from "../models/buybackModel.js";
import fontkit from "@pdf-lib/fontkit";

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const generateBuybackPDF = async (buybackData) => {
  try {
    const templatePath = path.join(
      __dirname,
      "../assets/documents/kupno-predajna-zmluva.pdf"
    );
    const existingPdfBytes = fs.readFileSync(templatePath);

    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    pdfDoc.registerFontkit(fontkit);

    // Load your custom font
    const fontPath = path.join(__dirname, "../assets/fonts/Roboto-Regular.ttf");
    const fontBytes = fs.readFileSync(fontPath);
    const customFont = await pdfDoc.embedFont(fontBytes);

    const pages = pdfDoc.getPages();
    const firstPage = pages[0];

    const sellerInfo = `
            ${buybackData.customerDetails.firstName} ${buybackData.customerDetails.lastName}
            Štátne Občianstvo: ${buybackData.customerDetails.nationality}
            Trvalý pobyt: ${buybackData.customerDetails.residence}
            Dátum narodenia: ${buybackData.customerDetails.dateOfBirth}
            Tel.č: ${buybackData.customerDetails.phoneNumber}
        `;

    const items = buybackData.products
      .map((product) => `${product.name} - ${product.buybackPrice}€`)
      .join("\n");
    const totalSum = buybackData.products.reduce(
      (sum, product) => sum + product.buybackPrice,
      0
    );

    firstPage.drawText(sellerInfo, {
      x: 100,
      y: 600,
      size: 12,
      font: customFont,
    });
    firstPage.drawText(items, { x: 100, y: 500, size: 12, font: customFont });
    firstPage.drawText(
      `Kúpna cena predmetu kúpy bola zmluvnými stranami dohodnutá v sume ${totalSum} EUR.`,
      { x: 100, y: 400, size: 12, font: customFont }
    );

    const pdfBytes = await pdfDoc.save();

    const pdfPath = path.join("uploads", `buyback_${buybackData._id}.pdf`);

    if (!fs.existsSync("uploads")) {
      fs.mkdirSync("uploads");
    }

    fs.writeFileSync(pdfPath, pdfBytes);

    return pdfPath;
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw new Error("Failed to generate PDF");
  }
};

export const addBuyback = async (req, res) => {
  try {
    const buybackData = new buybackModel(req.body);

    // Save without validation to get the _id
    await buybackData.save({ validateBeforeSave: false });

    // Generate the PDF
    const pdfPath = await generateBuybackPDF(buybackData);

    // Set the pdfPath and save again
    buybackData.pdfPath = pdfPath;
    await buybackData.save();

    res.status(200).json({
      success: true,
      message: "Buyback recorded successfully",
      pdfPath,
    });
  } catch (error) {
    console.error("Error saving buyback:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get all buybacks
export const getAllBuybacks = async (req, res) => {
  try {
    const buybacks = await buybackModel.find().sort({ createdAt: -1 }); // Newest first
    res.status(200).json({ success: true, buybacks });
  } catch (error) {
    console.error("Error fetching buybacks:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get a single buyback by ID
export const getBuybackById = async (req, res) => {
  try {
    const { id } = req.params;
    const buyback = await buybackModel.findById(id);
    if (!buyback) {
      return res
        .status(404)
        .json({ success: false, message: "Buyback not found" });
    }
    res.status(200).json({ success: true, buyback });
  } catch (error) {
    console.error("Error fetching buyback:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const updateBuyback = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;

    const updatedBuyback = await buybackModel.findByIdAndUpdate(
      id,
      updatedData,
      { new: true }
    );

    if (!updatedBuyback) {
      return res
        .status(404)
        .json({ success: false, message: "Buyback not found" });
    }

    // Regenerate the PDF if needed
    const pdfPath = await generateBuybackPDF(updatedBuyback);
    updatedBuyback.pdfPath = pdfPath;
    await updatedBuyback.save();

    res.status(200).json({
      success: true,
      message: "Buyback updated successfully",
      buyback: updatedBuyback,
    });
  } catch (error) {
    console.error("Error updating buyback:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const downloadBuybackPDF = async (req, res) => {
  try {
    const { id } = req.params;
    const buyback = await buybackModel.findById(id);

    if (!buyback || !buyback.pdfPath) {
      return res.status(404).json({ success: false, message: "PDF not found" });
    }

    const pdfPath = path.join(__dirname, "..", buyback.pdfPath);

    if (!fs.existsSync(pdfPath)) {
      return res
        .status(404)
        .json({ success: false, message: "PDF file not found on the server" });
    }

    res.download(pdfPath, `buyback_${id}.pdf`, (err) => {
      if (err) {
        console.error("Error downloading PDF:", err);
        res.status(500).json({ success: false, message: "Server error" });
      }
    });
  } catch (error) {
    console.error("Error downloading PDF:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const deleteBuyback = async (req, res) => {
  try {
    const { id } = req.params;

    const buyback = await buybackModel.findByIdAndDelete(id);

    if (!buyback) {
      return res
        .status(404)
        .json({ success: false, message: "Buyback not found" });
    }

    // Delete the associated PDF file if it exists
    if (buyback.pdfPath && fs.existsSync(buyback.pdfPath)) {
      fs.unlinkSync(buyback.pdfPath);
    }

    res
      .status(200)
      .json({ success: true, message: "Buyback deleted successfully" });
  } catch (error) {
    console.error("Error deleting buyback:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
