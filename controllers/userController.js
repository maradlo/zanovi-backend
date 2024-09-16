import validator from "validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";
import nodemailer from "nodemailer"; // For sending emails

const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET);
};

// Route for user login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await userModel.findOne({ email });

    if (!user) {
      return res.json({ success: false, message: "Používateľ neexistuje" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      const token = createToken(user._id);
      res.json({ success: true, token });
    } else {
      res.json({ success: false, message: "Nesprávne údaje" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Route for user register
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // checking if user already exists
    const exists = await userModel.findOne({ email });
    if (exists) {
      return res.json({ success: false, message: "Používateľ už existuje" });
    }

    // validating email format & strong password
    if (!validator.isEmail(email)) {
      return res.json({
        success: false,
        message: "Prosím zadajte platný email",
      });
    }
    if (password.length < 8) {
      return res.json({
        success: false,
        message: "Prosím zadajte platné heslo (min. 8 znakov)",
      });
    }

    // hashing user password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new userModel({
      name,
      email,
      password: hashedPassword,
    });

    const user = await newUser.save();

    const token = createToken(user._id);

    res.json({ success: true, token });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Route for admin login
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      email === process.env.ADMIN_EMAIL &&
      password === process.env.ADMIN_PASSWORD
    ) {
      const token = jwt.sign(email + password, process.env.JWT_SECRET);
      res.json({ success: true, token });
    } else {
      res.json({ success: false, message: "Nesprávne údaje" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Route to update email
const updateEmail = async (req, res) => {
  try {
    const { email } = req.body;
    const token = req.headers.token;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    if (!validator.isEmail(email)) {
      return res.json({ success: false, message: "Invalid email address." });
    }

    await userModel.findByIdAndUpdate(userId, { email });

    res.json({ success: true, message: "Email updated successfully." });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Failed to update email." });
  }
};

// Route to update password
const updatePassword = async (req, res) => {
  try {
    const { password, newPassword } = req.body;
    const token = req.headers.token;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    const user = await userModel.findById(userId);

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.json({
        success: false,
        message: "Incorrect current password.",
      });
    }

    if (newPassword.length < 8) {
      return res.json({
        success: false,
        message: "Password must be at least 8 characters long.",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await userModel.findByIdAndUpdate(userId, { password: hashedPassword });

    res.json({ success: true, message: "Password updated successfully." });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Failed to update password." });
  }
};

// Route for forgot password
// Route for forgot password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.json({ success: false, message: "Email not found." });
    }

    // Generate a new random password
    const newPassword = Math.random().toString(36).slice(-8); // Generate a new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update user's password in the database
    await userModel.findByIdAndUpdate(user._id, { password: hashedPassword });

    // Send the new password via email
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your New Password",
      html: `<p>Your new password is: <strong>${newPassword}</strong></p><p>Please log in and change your password immediately.</p>`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        return res.json({ success: false, message: "Failed to send email." });
      } else {
        res.json({
          success: true,
          message: "New password sent to your email.",
        });
      }
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Failed to reset password." });
  }
};

const updateUserAddress = async (req, res) => {
  try {
    const { name, lastName, street, city, country, phone, zip } = req.body;
    const token = req.headers.token;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    await userModel.findByIdAndUpdate(userId, {
      name,
      lastName,
      street,
      city,
      country,
      phone,
      zip,
    });

    res.json({ success: true, message: "Address updated successfully." });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Failed to update address." });
  }
};

export {
  loginUser,
  registerUser,
  adminLogin,
  updateEmail,
  updatePassword,
  forgotPassword,
  updateUserAddress,
};
