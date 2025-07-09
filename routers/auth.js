const express = require('express');
const router = express.Router();
const User = require('../models/User');
const sendMail = require('../utils/sendMail');
const crypto = require('crypto');

// Signup
router.post('/signup', async (req, res) => {
  const { email, password } = req.body;
  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ msg: 'User already exists' });

  const verificationCode = crypto.randomBytes(3).toString('hex');

  const newUser = new User({ email, password, verified: false, code: verificationCode });
  await newUser.save();
  await sendMail(email, 'Verify your email', `Your verification code is: ${verificationCode}`);

  res.status(200).json({ msg: 'Verification code sent to email' });
});

// Verify Email
router.post('/verify', async (req, res) => {
  const { email, code } = req.body;
  const user = await User.findOne({ email });
  if (!user || user.code !== code) return res.status(400).json({ msg: 'Invalid code' });

  user.verified = true;
  user.code = '';
  await user.save();
  res.status(200).json({ msg: 'Email verified' });
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || user.password !== password)
    return res.status(401).json({ msg: 'Invalid credentials' });
  if (!user.verified) return res.status(403).json({ msg: 'Email not verified' });
  res.status(200).json({ msg: 'Login successful' });
});

// Forgot Password
router.post('/forgot', async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ msg: 'User not found' });

  const resetCode = crypto.randomBytes(3).toString('hex');
  user.code = resetCode;
  await user.save();
  await sendMail(email, 'Reset your password', `Your reset code is: ${resetCode}`);
  res.status(200).json({ msg: 'Reset code sent to email' });
});

// Reset Password
router.post('/reset', async (req, res) => {
  const { email, code, newPassword } = req.body;
  const user = await User.findOne({ email });
  if (!user || user.code !== code) return res.status(400).json({ msg: 'Invalid code' });

  user.password = newPassword;
  user.code = '';
  await user.save();
  res.status(200).json({ msg: 'Password reset successful' });
});

module.exports = router;