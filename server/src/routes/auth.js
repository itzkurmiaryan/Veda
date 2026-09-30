const router = require('express').Router();

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const Doctor = require('../models/Doctor');
const DoctorRequest = require('../models/DoctorRequest');
const AccessRequest = require('../models/AccessRequest');
const Notification = require('../models/Notification');
const Admin = require('../models/Admin');

const auth = require('../middleware/auth');

const makeToken = (id, type) =>
  jwt.sign(
    {
      id,
      type,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '7d',
    }
  );

const clean = (account) => {
  const value = account.toObject();

  delete value.password;

  return value;
};

const addOneMonth = (date) => {
  const d = new Date(date);

  const originalDay = d.getDate();

  d.setDate(1);
  d.setMonth(d.getMonth() + 1);

  const lastDayOfMonth = new Date(
    d.getFullYear(),
    d.getMonth() + 1,
    0
  ).getDate();

  d.setDate(
    Math.min(originalDay, lastDayOfMonth)
  );

  return d;
};

const fields = (b) => ({
  name: b.name.trim(),
  email: b.email.trim().toLowerCase(),
  phone: b.phone || '',
  qualification: b.qualification || '',
  specialization: b.specialization || '',
  registrationNumber: b.registrationNumber || '',
  clinicName: b.clinicName || '',
  clinicAddress: b.clinicAddress || '',
  clinicLogo: b.clinicLogo || '',
  clinicBanner: b.clinicBanner || '',
  signature: b.signature || '',
});

/*
|--------------------------------------------------------------------------
| REGISTER
|--------------------------------------------------------------------------
*/

router.post(
  '/register',
  async (req, res, next) => {
    try {
      const b = req.body || {};

      if (
        !b.name ||
        !b.email ||
        !b.password
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Name, email and password are required',
        });
      }

      const data = fields(b);

      const existingDoctor =
        await Doctor.findOne({
          email: data.email,
        });

      const existingRequest =
        await DoctorRequest.findOne({
          email: data.email,
          status: 'pending',
        });

      if (
        existingDoctor ||
        existingRequest
      ) {
        return res.status(409).json({
          success: false,
          message:
            'An account or pending request already exists for this email',
        });
      }

      await DoctorRequest.create({
        ...data,
        password: await bcrypt.hash(
          b.password,
          12
        ),
      });

      res.status(202).json({
        success: true,
        message:
          'Registration request sent. Admin approval is required before login.',
      });
    } catch (e) {
      next(e);
    }
  }
);

/*
|--------------------------------------------------------------------------
| LOGIN
|--------------------------------------------------------------------------
*/

router.post(
  '/login',
  async (req, res, next) => {
    try {
      const email =
        req.body.email
          ?.trim()
          .toLowerCase();

      const password =
        req.body.password || '';

      const admin =
        await Admin.findOne({
          email,
        });

      const account =
        admin ||
        (await Doctor.findOne({
          email,
        }));

      if (
        !account ||
        !(await bcrypt.compare(
          password,
          account.password
        ))
      ) {
        return res.status(401).json({
          success: false,
          message:
            'Invalid email or password',
        });
      }

      /*
      |--------------------------------------------------------------------------
      | DISABLED DOCTOR
      |--------------------------------------------------------------------------
      */

      if (
        !admin &&
        account.active === false
      ) {
        return res.status(403).json({
          success: false,
          code: 'ACCESS_DISABLED',
          message:
            'Your Veda access is currently inactive.',
          doctor: clean(account),
          accessRequestStatus:
            account.accessRequestStatus ||
            'none',
        });
      }

      const type = admin
        ? 'admin'
        : 'doctor';

      res.json({
        success: true,
        message:
          'Login successful',

        token: makeToken(
          account._id,
          type
        ),

        role: type,

        user: clean(account),

        doctor: admin
          ? null
          : clean(account),
      });
    } catch (e) {
      next(e);
    }
  }
);

/*
|--------------------------------------------------------------------------
| REQUEST ACCESS AFTER ACCESS WAS REMOVED
|--------------------------------------------------------------------------
|
| This route intentionally does NOT use auth middleware.
|
| Why?
| A disabled doctor cannot pass the normal auth middleware.
| We verify email + password here before creating the request.
|--------------------------------------------------------------------------
*/

router.post(
  '/request-access',
  async (req, res, next) => {
    try {
      const email =
        req.body.email
          ?.trim()
          .toLowerCase();

      const password =
        req.body.password || '';

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message:
            'Email and password are required',
        });
      }

      const doctor =
        await Doctor.findOne({
          email,
        });

      if (!doctor) {
        return res.status(404).json({
          success: false,
          message:
            'Doctor account not found',
        });
      }

      const passwordValid =
        await bcrypt.compare(
          password,
          doctor.password
        );

      if (!passwordValid) {
        return res.status(401).json({
          success: false,
          message:
            'Invalid email or password',
        });
      }

      if (doctor.active) {
        return res.status(400).json({
          success: false,
          message:
            'Your access is already active. Please login.',
        });
      }

      if (
        doctor.accessRequestStatus ===
        'pending'
      ) {
        return res.json({
          success: true,
          alreadyPending: true,
          message:
            'Your access request is already pending with admin.',
          status: 'pending',
        });
      }

      const request =
        await AccessRequest.create({
          doctorId: doctor._id,
          status: 'pending',
          message:
            req.body.message ||
            'Doctor requested Veda access.',
          requestedAt: new Date(),
        });

      doctor.accessRequestStatus =
        'pending';

      doctor.accessRequestedAt =
        new Date();

      doctor.accessRequestReviewedAt =
        null;

      await doctor.save();

      await Notification.create({
        type: 'access_request',
        doctorId: doctor._id,
        title:
          'Access Request Received',
        message: `${doctor.name} has requested Veda access.`,
      });

      res.status(201).json({
        success: true,
        message:
          'Access request sent to admin.',
        status: 'pending',
        requestId: request._id,
      });
    } catch (e) {
      next(e);
    }
  }
);

/*
|--------------------------------------------------------------------------
| ME
|--------------------------------------------------------------------------
| Always fetch the latest account from MongoDB.
|
| This is important because admin can change payment/access
| information while the doctor app is already logged in.
|--------------------------------------------------------------------------
*/

router.get(
  '/me',
  auth,
  async (req, res, next) => {
    try {
      const Model = req.admin
        ? Admin
        : Doctor;

      const account =
        await Model.findById(req.user._id);

      if (!account) {
        return res.status(404).json({
          success: false,
          message: 'Account not found.',
        });
      }

      /*
      |--------------------------------------------------------------------------
      | Ensure billing fields for older doctor accounts
      |--------------------------------------------------------------------------
      */

      if (!req.admin) {
        let changed = false;

        const startDate =
          account.accessStartDate ||
          account.registrationDate ||
          account.createdAt ||
          new Date();

        if (!account.registrationDate) {
          account.registrationDate =
            account.createdAt || new Date();

          changed = true;
        }

        if (!account.accessStartDate) {
          account.accessStartDate =
            startDate;

          changed = true;
        }

        if (!account.paymentStatus) {
          account.paymentStatus =
            'pending';

          changed = true;
        }

        if (!account.nextPaymentDate) {
          account.nextPaymentDate =
            addOneMonth(
              account.accessStartDate
            );

          changed = true;
        }

        if (
          account.paymentReminderRequested ===
          undefined
        ) {
          account.paymentReminderRequested =
            false;

          changed = true;
        }

        if (
          account.paymentReminderAt ===
          undefined
        ) {
          account.paymentReminderAt =
            null;

          changed = true;
        }

        if (
          account.accessRequestStatus ===
          undefined
        ) {
          account.accessRequestStatus =
            'none';

          changed = true;
        }

        if (
          account.accessRequestedAt ===
          undefined
        ) {
          account.accessRequestedAt =
            null;

          changed = true;
        }

        if (
          account.accessRequestReviewedAt ===
          undefined
        ) {
          account.accessRequestReviewedAt =
            null;

          changed = true;
        }

        if (changed) {
          await account.save();
        }
      }

      const cleaned = clean(account);

      return res.json({
        success: true,

        role: req.admin
          ? 'admin'
          : 'doctor',

        user: cleaned,

        doctor: req.admin
          ? null
          : cleaned,
      });
    } catch (e) {
      next(e);
    }
  }
);

/*
|--------------------------------------------------------------------------
| UPDATE PROFILE
|--------------------------------------------------------------------------
*/

router.put(
  '/profile',
  auth,
  async (req, res, next) => {
    try {
      const data = {};

      [
        'name',
        'phone',
        'qualification',
        'specialization',
        'registrationNumber',
        'clinicName',
        'clinicAddress',
        'clinicLogo',
        'clinicBanner',
        'signature',
      ].forEach((key) => {
        if (
          req.body[key] !== undefined
        ) {
          data[key] = req.body[key];
        }
      });

      if (req.body.email) {
        data.email =
          req.body.email
            .trim()
            .toLowerCase();
      }

      if (req.body.password) {
        data.password =
          await bcrypt.hash(
            req.body.password,
            12
          );
      }

      const updated =
        await (
          req.admin
            ? Admin
            : Doctor
        )
          .findByIdAndUpdate(
            req.user._id,
            data,
            {
              new: true,
              runValidators: true,
            }
          )
          .select('-password');

      res.json({
        success: true,
        user: updated,
        doctor: req.admin
          ? null
          : updated,
      });
    } catch (e) {
      next(e);
    }
  }
);

module.exports = router;