import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/mongodb.js";
import connectCloudinary from "./config/cloudinary.js";
import userRoutes from "./routes/userRoutes.js";
import productRouter from "./routes/productRoute.js";
import cartRouter from "./routes/cartRoute.js";
import orderRouter from "./routes/orderRoute.js";
import categoryRouter from "./routes/categoryRoute.js";
import warehouseRouter from "./routes/warehouseRoute.js";
import consoleRouter from "./routes/consolesRoute.js";
import buybackRouter from "./routes/buybackRoute.js";
import reservationsRouter from "./routes/reservationRoute.js";
import warehouseProductRouter from "./routes/warehouseProductRoute.js";
import errorHandler from "./middleware/errorHandler.js";

dotenv.config();
const app = express();
const port = process.env.PORT || 4000;
connectDB();
connectCloudinary();

// middlewares
app.use(express.json());
app.use(cors());
app.use("/uploads", express.static("uploads"));
app.use("/api/order/webhook", express.raw({ type: "application/json" }));

// api endpoints
app.use("/api/user", userRoutes);
app.use("/api/product", productRouter);
app.use("/api/cart", cartRouter);
app.use("/api/order", orderRouter);
app.use("/api/category", categoryRouter);
app.use("/api/warehouse", warehouseRouter);
app.use("/api/reservations", reservationsRouter);
app.use("/api/consoles", consoleRouter);
app.use("/api/buyback", buybackRouter);
app.use("/api/warehouse-products", warehouseProductRouter);

app.get("/", (req, res) => {
  res.send("API Working");
});

// Error handling middleware (add this last, after all routes)
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  connectDB();
});
