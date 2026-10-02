const jwt = require('jsonwebtoken');

const Doctor = require('../models/Doctor');
const Admin = require('../models/Admin');

module.exports = async (
  req,
  res,
  next
) => {
  try {
    const header =
      req.headers.authorization || '';

    if (
      !header.startsWith('Bearer ')
    ) {
      return res.status(401).json({
        success: false,
        message:
          'Authentication required',
      });
    }

    const token =
      header.substring(7).trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        message:
          'Authentication token missing',
      });
    }

    const payload =
      jwt.verify(
        token,
        process.env.JWT_SECRET
      );

    const isAdmin =
      payload.type === 'admin';

    const Model = isAdmin
      ? Admin
      : Doctor;

    const account =
      await Model.findById(
        payload.id
      ).select('-password');

    if (!account) {
      return res.status(401).json({
        success: false,
        message:
          'Account not found',
      });
    }

    req.user = account;

    if (isAdmin) {
      req.admin = account;
      req.doctor = null;
    } else {
      req.doctor = account;
      req.admin = null;
    }

    next();
  } catch (error) {
    console.error(
      'AUTH ERROR:',
      error.message
    );

    return res.status(401).json({
      success: false,
      message:
        'Invalid or expired token',
    });
  }
};