const asyncHandler = require('express-async-handler');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const { generateAccessToken, generateRefreshToken, verifyToken } = require('../utils/jwt');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// @desc    Register user
// @route   POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      passwordHash: password,
    });

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
      accessToken,
    });
  } catch (error) {
    console.error('Registration error:', error);
    throw error; // Let errorHandler middleware handle it
  }
});

// @desc    Login user
// @route   POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password, userId } = req.body;

  // Support both email and userId login
  let user;
  if (userId) {
    // Login by user ID
    user = await User.findById(userId).select('+passwordHash');
  } else if (email) {
    // Login by email (default)
    user = await User.findOne({ email }).select('+passwordHash');
  } else {
    return res.status(400).json({ message: 'Email or userId is required' });
  }

  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.json({
    message: 'Login successful',
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
    accessToken,
  });
});

// @desc    Refresh access token
// @route   POST /api/auth/refresh
const refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ message: 'No refresh token provided' });
  }

  try {
    const decoded = verifyToken(refreshToken);
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    const accessToken = generateAccessToken(user._id);
    res.json({ accessToken });
  } catch (error) {
    return res.status(401).json({ message: 'Invalid refresh token' });
  }
});

// @desc    Logout user
// @route   POST /api/auth/logout
const logout = asyncHandler(async (req, res) => {
  res.cookie('refreshToken', '', {
    httpOnly: true,
    expires: new Date(0),
  });
  res.json({ message: 'Logged out successfully' });
});

// @desc    Google OAuth login
// @route   POST /api/auth/google
const googleAuth = asyncHandler(async (req, res) => {
  const { accessToken } = req.body;

  if (!accessToken) {
    return res.status(400).json({ message: 'Google access token is required' });
  }

  try {
    // Get user info from Google using access token
    const axios = require('axios');
    const googleResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const { email, name, picture } = googleResponse.data;

    if (!email) {
      return res.status(400).json({ message: 'Email not provided by Google' });
    }

    // Find or create user
    let user = await User.findOne({ email });

    if (!user) {
      // Create new user
      user = await User.create({
        name: name || email.split('@')[0],
        email,
        passwordHash: 'google-auth-' + Date.now(), // Special marker for Google auth
        role: 'user',
      });
    }

    // Generate JWT tokens
    const jwtAccessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Set refresh token cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      message: 'Google login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      accessToken: jwtAccessToken,
    });
  } catch (error) {
    console.error('Google auth error:', error);
    return res.status(401).json({ message: 'Invalid Google token' });
  }
});

module.exports = {
  register,
  login,
  refresh,
  logout,
  googleAuth,
};



