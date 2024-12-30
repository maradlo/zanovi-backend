const warehouseAuth = async (req, res, next) => {
  try {
    const { authPassword } = req.body;

    if (!authPassword) {
      return res.status(403).json({
        success: false,
        message: "Authorization password required for this operation",
      });
    }

    // Compare with environment variable
    if (authPassword !== process.env.WAREHOUSE_AUTH_PASSWORD) {
      return res.status(403).json({
        success: false,
        message: "Incorrect authorization password",
      });
    }

    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export default warehouseAuth;
