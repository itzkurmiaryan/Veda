module.exports = (req, res, next) => {
  if (req.doctor?.active === false) {
    return res.status(403).json({
      success: false,
      code: 'ACCESS_DISABLED',
      message:
        'Access is disabled. You can still sign in and view records, but patient and prescription changes are blocked.',
    });
  }

  next();
};
