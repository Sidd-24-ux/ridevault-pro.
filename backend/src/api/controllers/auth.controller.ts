import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../../services/db.service';
import { AuthRequest } from '../middlewares/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_ridevault_token_key_123!';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'super_secret_ridevault_refresh_key_456!';

const generateTokens = (userId: string, email: string, role: string) => {
  const accessToken = jwt.sign({ id: userId, email, role }, JWT_SECRET, { expiresIn: '1h' });
  const refreshToken = jwt.sign({ id: userId }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
};

export const register = async (req: Request, res: Response) => {
  const { name, email, password, role, referralCode } = req.body;

  try {
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const existingUser = db.users.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create unique referral code for the new user
    const generatedReferralCode = 'RV-' + Math.random().toString(36).substring(2, 8).toUpperCase();

    // Check if referred by someone
    let referredByUser = null;
    if (referralCode) {
      referredByUser = db.users.findOne({ referralCode });
    }

    // Create user
    const newUser = db.users.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'customer',
      isVerified: false,
      rewardPoints: referredByUser ? 100 : 0, // start with 100 points if referred
      referralCode: generatedReferralCode,
      referredBy: referredByUser ? referredByUser._id : null
    });

    // If referred, credit referral reward points to the inviter
    if (referredByUser) {
      const inviterPoints = (referredByUser.rewardPoints || 0) + 150; // Give inviter 150 points
      db.users.findByIdAndUpdate(referredByUser._id, { rewardPoints: inviterPoints });

      // Log reward points activity
      db.rewardPoints.create({
        userId: referredByUser._id,
        points: 150,
        type: 'credit',
        description: `Referral reward for inviting ${name}`
      });

      db.rewardPoints.create({
        userId: newUser._id,
        points: 100,
        type: 'credit',
        description: 'Sign-up referral code bonus'
      });

      // Log referral connection
      db.referrals.create({
        referrerId: referredByUser._id,
        refereeId: newUser._id,
        status: 'registered'
      });
    }

    // Auto-create vendor profile if registering as a vendor
    if (role === 'vendor') {
      db.vendors.create({
        userId: newUser._id,
        businessName: `${name}'s Moto Gear`,
        gstNumber: '',
        isApproved: false,
        isSuspended: false,
        revenue: 0
      });
    }

    const { accessToken, refreshToken } = generateTokens(newUser._id, newUser.email, newUser.role);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = newUser;

    return res.status(201).json({
      message: 'Registration successful',
      user: userWithoutPassword,
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Registration Error:', error);
    return res.status(500).json({ message: 'Internal server error during registration' });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = db.users.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const { accessToken, refreshToken } = generateTokens(user._id, user.email, user.role);

    // Log user login activity
    db.auditLogs.create({
      userId: user._id,
      action: 'LOGIN',
      details: `User logged in with role ${user.role}`
    });

    const { password: _, ...userWithoutPassword } = user;

    return res.status(200).json({
      message: 'Login successful',
      user: userWithoutPassword,
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({ message: 'Internal server error during login' });
  }
};

export const refresh = (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ message: 'Refresh token is required' });
  }

  try {
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { id: string };
    const user = db.users.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'User not found or token invalid' });
    }

    const tokens = generateTokens(user._id, user.email, user.role);

    return res.status(200).json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    });
  } catch (error) {
    return res.status(401).json({ message: 'Refresh token expired or invalid' });
  }
};

export const getProfile = (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

  const user = db.users.findById(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  const { password: _, ...userWithoutPassword } = user;

  let vendorProfile = null;
  if (user.role === 'vendor') {
    vendorProfile = db.vendors.findOne({ userId: user._id });
  }

  return res.status(200).json({
    user: userWithoutPassword,
    vendorProfile
  });
};

export const updateProfile = (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

  const { name, email, businessName, gstNumber } = req.body;

  try {
    const updatedUser = db.users.findByIdAndUpdate(req.user.id, { name, email });
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    let vendorProfile = null;
    if (updatedUser.role === 'vendor' && (businessName !== undefined || gstNumber !== undefined)) {
      const vendor = db.vendors.findOne({ userId: updatedUser._id });
      if (vendor) {
        vendorProfile = db.vendors.findByIdAndUpdate(vendor._id, {
          businessName: businessName || vendor.businessName,
          gstNumber: gstNumber || vendor.gstNumber
        });
      }
    }

    const { password: _, ...userWithoutPassword } = updatedUser;

    return res.status(200).json({
      message: 'Profile updated successfully',
      user: userWithoutPassword,
      vendorProfile
    });
  } catch (error) {
    console.error('Update Profile Error:', error);
    return res.status(500).json({ message: 'Internal server error updating profile' });
  }
};
