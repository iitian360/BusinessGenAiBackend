import User from '../models/User.model.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { HTTP_STATUS_CODES, USER_ROLES } from '../constants/roles.js';
import catchAsyncErrors from '../utils/catchAsyncErrors.js';

/**
 * Register a new user.
 * @route POST /api/users/register
 * @body { name: String, email: String, password: String, role?: String }
 * @returns { success: Boolean, accessToken: String, user: Object }
 */
export const register = catchAsyncErrors(async (req, res) => {
  const { name, email, password, role } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({
      success: false,
      message: "User already exists with this email. Please use a different email.",
    });
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create new user document
  const newUser = new User({
    name,
    email,
    password: hashedPassword,
    role: role || USER_ROLES.USER,
  });

  await newUser.save();

  // Generate JWT token
  const token = jwt.sign(
    { userId: newUser._id, role: newUser.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  // Set cookie
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  };

  res.cookie('token', token, cookieOptions);

  return res.status(HTTP_STATUS_CODES.CREATED).json({
    success: true,
    message: "User registered successfully!",
    user: {
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
    }
  });
});

/**
 * Logout a user.
 * @route POST /api/users/logout
 * @returns { success: Boolean, message: String }
 */
export const logout = catchAsyncErrors(async (req, res) => {
  res.clearCookie('token').status(HTTP_STATUS_CODES.OK).json({
    success: true,
    message: "Logged out successfully"
  });
});

/**
 * Login a user and return JWT token.
 * @route POST /api/users/login
 * @body { email: String, password: String }
 * @returns { success: Boolean, accessToken: String, user: Object }
 */
export const login = catchAsyncErrors(async (req, res) => {
  const { email, password } = req.body;

  // Find user by email
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({
      success: false,
      message: "User does not exist.",
    });
  }

  // Compare password
  const isPasswordMatch = await bcrypt.compare(password, user.password);
  if (!isPasswordMatch) {
    return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({
      success: false,
      message: "Invalid credentials!",
    });
  }

  // Generate JWT token
  const token = jwt.sign(
    {
      userId: user._id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  // Set cookie
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  };

  res.cookie('token', token, cookieOptions);

  return res.status(HTTP_STATUS_CODES.OK).json({
    success: true,
    message: "Logged in successfully.",
    user: {
      id: user._id,
      name: user.name, 
      email: user.email,
      role: user.role,
    }
  });
});
