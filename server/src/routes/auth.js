const router = require('express').Router();

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const Doctor = require('../models/Doctor');
const DoctorRequest = require('../models/DoctorRequest');
const AccessRequest = require('../models/AccessRequest');
const Notification = require('../models/Notification');
const Admin = require('../models/Admin');

const auth = require('../middleware/auth');
const ensurePaymentNotification =
  require('../services/paymentCycle');

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

  if (Array.isArray(value.paymentHistory)) {
    value.paymentHistory =
      value.paymentHistory.map((record) => ({
        ...record,
        paymentProof: record.paymentProof?.data
          ? {
              available: true,
              contentType:
                record.paymentProof.contentType,
              fileName:
                record.paymentProof.fileName,
            }
          : null,
      }));
  }

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

      const incomingProof =
        req.body.paymentProof;

      if (
        incomingProof &&
        (
          typeof incomingProof.data !== 'string' ||
          incomingProof.data.length > 1800000 ||
          !/^image\/(jpeg|png|webp)$/.test(
            incomingProof.contentType || ''
          )
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Choose a valid JPEG, PNG, or WEBP payment screenshot under 1.8 MB.',
        });
      }

      const now = new Date();

      let request =
        await AccessRequest.findOne({
          doctorId: doctor._id,
          status: 'pending',
        }).sort({ createdAt: -1 });

      const createdRequest = !request;

      if (!request) {
        request = new AccessRequest({
          doctorId: doctor._id,
          status: 'pending',
        });
      }

      request.message =
        req.body.message ||
        (
          incomingProof
            ? 'Doctor requested access and attached payment proof.'
            : 'Doctor requested Veda access.'
        );

      if (incomingProof) {
        request.paymentProof = {
          data: incomingProof.data,
          contentType: incomingProof.contentType,
          fileName:
            incomingProof.fileName ||
            'payment-proof',
          uploadedAt: now,
        };
      }

      request.requestedAt = now;
      await request.save();

      doctor.accessRequestStatus =
        'pending';

      doctor.accessRequestedAt = now;

      doctor.accessRequestReviewedAt =
        null;

      await doctor.save();

      if (createdRequest || incomingProof) {
        await Notification.create({
          type: 'access_request',
          doctorId: doctor._id,
          title: incomingProof
            ? 'Payment proof submitted'
            : 'Access request received',
          message: incomingProof
            ? `${doctor.name} requested access and attached payment proof.`
            : `${doctor.name} has requested Veda access.`,
        });
      }

      res.status(createdRequest ? 201 : 200).json({
        success: true,
        alreadyPending: !createdRequest,
        message: incomingProof
          ? 'Access request and payment proof sent to admin.'
          : createdRequest
            ? 'Access request sent to admin.'
            : 'Your access request is already pending with admin.',
        status: 'pending',
        requestId: request._id,
      });
    } catch (e) {
      next(e);
    }
  }
);

router.post(
  '/request-access-session',
  auth,
  async (req, res, next) => {
    try {
      if (!req.doctor) {
        return res.status(403).json({
          success: false,
          message: 'Doctor access required.',
        });
      }

      const doctor =
        await Doctor.findById(req.doctor._id);

      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: 'Doctor account not found.',
        });
      }

      if (doctor.active !== false) {
        return res.status(400).json({
          success: false,
          message: 'Your access is already active.',
        });
      }

      let request =
        await AccessRequest.findOne({
          doctorId: doctor._id,
          status: 'pending',
        });
      const createdRequest = !request;

      if (!request) {
        request = new AccessRequest({
          doctorId: doctor._id,
          status: 'pending',
        });
      }

      request.message =
        req.body?.message ||
        'Doctor requested access from their signed-in workspace.';
      request.requestedAt = new Date();
      await request.save();

      doctor.accessRequestStatus = 'pending';
      doctor.accessRequestedAt = new Date();
      doctor.accessRequestReviewedAt = null;
      await doctor.save();

      if (createdRequest) {
        try {
          await Notification.create({
            type: 'access_request',
            doctorId: doctor._id,
            title: 'Access request received',
            message: `${doctor.name} requested access from their signed-in workspace.`,
          });
        } catch (notificationError) {
          console.error(
            'Access request notification error:',
            notificationError
          );
        }
      }

      return res.status(createdRequest ? 201 : 200).json({
        success: true,
        alreadyPending: !createdRequest,
        message: createdRequest
          ? 'Access request sent to the administrator.'
          : 'Your access request is already pending.',
        status: 'pending',
      });
    } catch (error) {
      next(error);
    }
  }
);

/*
|--------------------------------------------------------------------------
| DOCTOR NOTIFICATIONS
|--------------------------------------------------------------------------
*/

router.get(
  '/notifications',
  auth,
  async (req, res, next) => {
    try {
      if (req.admin) {
        return res.status(403).json({
          success: false,
          message: 'Doctor notifications are not available to admins.',
        });
      }

      const doctor =
        await Doctor.findById(
          req.user._id
        );

      if (doctor) {
        await ensurePaymentNotification(
          doctor
        );
      }

      const notifications =
        await Notification.find({
          doctorId: req.user._id,
          readAt: null,
          dismissedAt: null,
        })
          .sort({ createdAt: -1 })
          .limit(20);

      res.json({
        success: true,
        data: notifications,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.patch(
  '/notifications/:id/read',
  auth,
  async (req, res, next) => {
    try {
      if (req.admin) {
        return res.status(403).json({
          success: false,
          message: 'Doctor notifications are not available to admins.',
        });
      }

      const notification =
        await Notification.findOneAndUpdate(
          {
            _id: req.params.id,
            doctorId: req.user._id,
          },
          { readAt: new Date() },
          { new: true }
        );

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found.',
        });
      }

      res.json({
        success: true,
        data: notification,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  '/notifications/:id',
  auth,
  async (req, res, next) => {
    try {
      if (req.admin) {
        return res.status(403).json({
          success: false,
          message: 'Doctor notifications are not available to admins.',
        });
      }

      const notification =
        await Notification.findOneAndUpdate(
          {
            _id: req.params.id,
            doctorId: req.user._id,
            dismissedAt: null,
          },
          {
            dismissedAt: new Date(),
          },
          {
            new: true,
          }
        );

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found.',
        });
      }

      res.json({
        success: true,
        message: 'Notification deleted.',
      });
    } catch (error) {
      next(error);
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

        await ensurePaymentNotification(
          account
        );
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