import type { VercelRequest, VercelResponse } from '@vercel/node';
import { MongoClient } from 'mongodb';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getRequestContext, logError } from './logger.js';

let cachedClient: MongoClient | null = null;

async function getMongoClient() {
  if (cachedClient) return cachedClient;
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('Missing MONGODB_URI');
  }
  cachedClient = new MongoClient(mongoUri);
  await cachedClient.connect();
  return cachedClient;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const requestContext = getRequestContext(req);
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body =
    typeof req.body === 'string' ? JSON.parse(req.body) : (req.body ?? {});
  const { action } = body;

  try {
    const client = await getMongoClient();
    const db = client.db('restaurant');
    const usersCollection = db.collection('users');

    // Guest session - creates a temporary ID for tracking orders
    if (action === 'guest') {
      const guestId = `guest_${uuidv4()}`;
      const token = jwt.sign(
        { guestId, type: 'guest' },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      );

      return res.status(200).json({
        token,
        guestId,
        type: 'guest',
      });
    }

    // Register new account
    if (action === 'register') {
      const { email, password, name, phone } = body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      // Check if user exists
      const existingUser = await usersCollection.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = {
        email: email.toLowerCase(),
        password: hashedPassword,
        name: name || '',
        phone: phone || '',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await usersCollection.insertOne(user);

      const token = jwt.sign(
        { userId: result.insertedId.toString(), email: user.email, type: 'user' },
        process.env.JWT_SECRET!,
        { expiresIn: '30d' }
      );

      return res.status(201).json({
        token,
        user: {
          id: result.insertedId.toString(),
          email: user.email,
          name: user.name,
          phone: user.phone,
        },
        type: 'user',
      });
    }

    // Login
    if (action === 'login') {
      const { email, password } = body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const user = await usersCollection.findOne({ email: email.toLowerCase() });
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { userId: user._id.toString(), email: user.email, type: 'user' },
        process.env.JWT_SECRET!,
        { expiresIn: '30d' }
      );

      return res.status(200).json({
        token,
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          phone: user.phone,
        },
        type: 'user',
      });
    }

    // Google OAuth login
    if (action === 'google') {
      const { credential } = body;

      if (!credential) {
        return res.status(400).json({ error: 'Google credential is required' });
      }

      // Verify Google token by decoding JWT (Google tokens are JWTs)
      // In production, you should verify with Google's tokeninfo endpoint
      try {
        // Decode the JWT payload (base64)
        const payload = JSON.parse(
          Buffer.from(credential.split('.')[1], 'base64').toString()
        );

        const { email, name, picture, sub: googleId } = payload;

        if (!email) {
          return res.status(400).json({ error: 'Invalid Google token' });
        }

        // Check if user exists
        let user = await usersCollection.findOne({ email: email.toLowerCase() });

        if (user) {
          // Update with Google info if not already set
          if (!user.googleId) {
            await usersCollection.updateOne(
              { _id: user._id },
              { 
                $set: { 
                  googleId,
                  picture: picture || user.picture,
                  name: user.name || name,
                  updatedAt: new Date() 
                } 
              }
            );
          }
        } else {
          // Create new user with Google info
          const newUser = {
            email: email.toLowerCase(),
            googleId,
            name: name || '',
            picture: picture || '',
            phone: '',
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          const result = await usersCollection.insertOne(newUser);
          user = { ...newUser, _id: result.insertedId };
        }

        const token = jwt.sign(
          { userId: user._id.toString(), email: user.email, type: 'user' },
          process.env.JWT_SECRET!,
          { expiresIn: '30d' }
        );

        return res.status(200).json({
          token,
          user: {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            phone: user.phone || '',
            picture: user.picture || '',
          },
          type: 'user',
        });
      } catch (err: any) {
        logError('google_auth_error', err, requestContext);
        return res.status(400).json({ error: 'Invalid Google token' });
      }
    }

    // Convert guest to user (link orders)
    if (action === 'convert') {
      const { guestId, email, password, name, phone } = body;

      if (!guestId || !email || !password) {
        return res.status(400).json({ error: 'guestId, email, and password are required' });
      }

      // Check if user exists
      const existingUser = await usersCollection.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      // Hash password and create user
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = {
        email: email.toLowerCase(),
        password: hashedPassword,
        name: name || '',
        phone: phone || '',
        guestIds: [guestId], // Link guest orders
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await usersCollection.insertOne(user);

      // Update all guest orders to link to this user
      const ordersCollection = db.collection('orders');
      await ordersCollection.updateMany(
        { guestId },
        { $set: { userId: result.insertedId.toString(), updatedAt: new Date() } }
      );

      const token = jwt.sign(
        { userId: result.insertedId.toString(), email: user.email, type: 'user' },
        process.env.JWT_SECRET!,
        { expiresIn: '30d' }
      );

      return res.status(201).json({
        token,
        user: {
          id: result.insertedId.toString(),
          email: user.email,
          name: user.name,
          phone: user.phone,
        },
        type: 'user',
      });
    }

    // Admin login
    if (action === 'admin-login') {
      const { password } = body;

      if (!password) {
        return res.status(400).json({ error: 'Password is required' });
      }

      // Compare with stored admin password hash
      const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
      if (!adminPasswordHash) {
        return res.status(500).json({ error: 'Admin not configured' });
      }

      const isValid = await bcrypt.compare(password, adminPasswordHash);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid admin password' });
      }

      const token = jwt.sign(
        { role: 'admin', type: 'admin' },
        process.env.JWT_SECRET!,
        { expiresIn: '8h' }
      );

      return res.status(200).json({
        token,
        type: 'admin',
      });
    }

    // Chef login
    if (action === 'chef-login') {
      const { password } = body;

      if (!password) {
        return res.status(400).json({ error: 'Password is required' });
      }

      // Compare with stored chef password hash
      const chefPasswordHash = process.env.CHEF_PASSWORD_HASH;
      if (!chefPasswordHash) {
        // Fallback: if no chef password set, reject
        return res.status(500).json({ error: 'Chef access not configured. Set CHEF_PASSWORD_HASH in environment.' });
      }

      const isValid = await bcrypt.compare(password, chefPasswordHash);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid chef password' });
      }

      const token = jwt.sign(
        { role: 'chef', type: 'chef' },
        process.env.JWT_SECRET!,
        { expiresIn: '12h' }
      );

      return res.status(200).json({
        token,
        type: 'chef',
      });
    }

    // Verify admin token
    if (action === 'verify-admin') {
      const authHeader = typeof req.headers.authorization === 'string'
        ? req.headers.authorization
        : '';
      if (!authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided', valid: false });
      }

      const token = authHeader.replace('Bearer ', '');
      
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        if (decoded.type !== 'admin' || decoded.role !== 'admin') {
          return res.status(401).json({ error: 'Not an admin token', valid: false });
        }
        return res.status(200).json({ valid: true });
      } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token', valid: false });
      }
    }

    // Verify chef token
    if (action === 'verify-chef') {
      const authHeader = typeof req.headers.authorization === 'string'
        ? req.headers.authorization
        : '';
      if (!authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided', valid: false });
      }

      const token = authHeader.replace('Bearer ', '');
      
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        if (decoded.type !== 'chef' || decoded.role !== 'chef') {
          return res.status(401).json({ error: 'Not a chef token', valid: false });
        }
        return res.status(200).json({ valid: true });
      } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token', valid: false });
      }
    }

    return res.status(400).json({ error: 'Invalid action' });
  } catch (error: any) {
    logError('auth_api_error', error, requestContext);
    return res.status(500).json({ error: error.message });
  }
}
