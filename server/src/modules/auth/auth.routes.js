import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, Business, Membership } from '../../models/index.js';
import { BadRequestError, UnauthorizedError } from '../../lib/errors.js';
import { env } from '../../config/env.js';

export const authRouter = express.Router();

function createToken(userId, businessId, role) {
  return jwt.sign(
    { userId, businessId, role },
    env.JWT_ACCESS_SECRET,
    { expiresIn: '30d' }
  );
}

// Register User + Business + Owner Membership
authRouter.post('/register', async (req, res, next) => {
  try {
    const { name, mobile, email, password, businessName, stateCode = '27', gstin = '' } = req.body;

    if (!name || !mobile || !password || !businessName) {
      throw new BadRequestError('Name, mobile, password, and businessName are required');
    }

    const existingUser = await User.findOne({ mobile });
    if (existingUser) {
      throw new BadRequestError('User with this mobile number already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      mobile,
      email,
      passwordHash,
    });

    const business = await Business.create({
      name: businessName,
      ownerId: user._id,
      stateCode,
      gstin: gstin.toUpperCase(),
    });

    await Membership.create({
      businessId: business._id,
      userId: user._id,
      role: 'owner',
      status: 'active',
    });

    const token = createToken(user._id, business._id, 'owner');

    res.status(201).json({
      data: {
        token,
        user: { id: user._id, name: user.name, mobile: user.mobile },
        business: { id: business._id, name: business.name, gstin: business.gstin },
      },
    });
  } catch (err) {
    next(err);
  }
});

// Login
authRouter.post('/login', async (req, res, next) => {
  try {
    const { mobile, password } = req.body;
    if (!mobile || !password) {
      throw new BadRequestError('Mobile and password are required');
    }

    const user = await User.findOne({ mobile });
    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const membership = await Membership.findOne({ userId: user._id, status: 'active' });
    const business = membership ? await Business.findById(membership.businessId) : null;

    const token = createToken(user._id, business?._id, membership?.role || 'owner');

    res.json({
      data: {
        token,
        user: { id: user._id, name: user.name, mobile: user.mobile },
        business: business ? { id: business._id, name: business.name, gstin: business.gstin } : null,
      },
    });
  } catch (err) {
    next(err);
  }
});

// Current user profile
authRouter.get('/me', async (req, res, next) => {
  try {
    const { userId, businessId } = req.ctx;
    const [user, business] = await Promise.all([
      User.findById(userId).select('-passwordHash'),
      Business.findById(businessId),
    ]);

    res.json({
      data: {
        user,
        business,
      },
    });
  } catch (err) {
    next(err);
  }
});
