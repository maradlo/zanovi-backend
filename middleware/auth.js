import jwt from "jsonwebtoken";

const authUser = async (req, res, next) => {
  const token = req.headers.token;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Nie ste autorizovaný! Prihláste sa znova",
    });
  }

  try {
    console.log("Verifying token:", token);

    const token_decode = jwt.verify(token, process.env.JWT_SECRET);
    req.body.userId = token_decode.id;
    req.user = token_decode;

    console.log("Token verified, user ID:", token_decode.id);

    next();
  } catch (error) {
    console.error("Token verification error:", error);
    return res.status(401).json({
      success: false,
      message: "Token verification failed: " + error.message,
    });
  }
};

export default authUser;
