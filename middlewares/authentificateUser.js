import jwt from 'jsonwebtoken';
import User from '../Models/user.js';
import { JWT_SECRET } from '../default.js';

export function authenticateToken(req, res, next) {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.status(401).send({ message: 'Access Denied' });

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).send({ message: 'Invalid Token' });
  }
}

export function authorizeRole(roles) {
  return async (req, res, next) => {
    const user = await User.findById(req.user._id);
    if (!roles.includes(user.role)) {
      return res.status(403).send({ message: 'Forbidden' });
    }
    next();
  };
}
