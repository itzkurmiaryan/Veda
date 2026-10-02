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

/*
|--------------------------------------------------------------------------
| TOKEN
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| CLEAN ACCOUNT
|--------------------------------------------------------------------------
|
| Never send password or raw payment proof to the mobile app.
|
*/

const clean = (account) => {
  const value = account.toObject();

  delete value.password;

  /*
  |--------------------------------------------------------------------------
  | Verified payment history
  |--------------------------------------------------------------------------
  */

  if (Array.isArray(value.paymentHistory)) {
    value.paymentHistory = value.paymentHistory.map(
      (record) => ({
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
      })
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Pending payment
  |--------------------------------------------------------------------------
  |
  | Do not send base64 screenshot to the mobile app.
  | Only send metadata.
  |
  */

  if (value.pendingPayment) {
    value.pendingPayment = {
      ...value.pendingPayment,
      paymentProof:
        value.pendingPayment.paymentProof?.data
          ? {
              available: true,
              contentType:
                value.pendingPayment.paymentProof
                  .contentType,
              fileName:
                value.pendingPayment.paymentProof
                  .fileName,
            }
          : null,
    };
  }

  return value;
};

/*
|--------------------------------------------------------------------------
| ADD ONE MONTH
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| REGISTER FIELDS
|--------------------------------------------------------------------------
*/

const fields = (b) => ({
  name: b.name.trim(),
  email: b.email.trim().toLowerCase(),
  phone: b.phone || '',
  qualification: b.qualification || '',
  specialization: b.specialization || '',
  registrationNumber:
    b.registrationNumber || '',
  clinicName: b.clinicName || '',
  clinicAddress:
    b.clinicAddress || '',
  clinicLogo: b.clinicLogo || '',
  clinicBanner:
    b.clinicBanner || '',
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
| A disabled doctor cannot pass the normal auth middleware.
| We verify email + password here before creating the request.
|
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

      /*
      |--------------------------------------------------------------------------
      | PAYMENT PROOF VALIDATION
      |--------------------------------------------------------------------------
      */

      const incomingProof =
        req.body.paymentProof;

      if (
        incomingProof &&
        (
          typeof incomingProof.data !==
            'string' ||
          incomingProof.data.length >
            1800000 ||
          !/^image\/(jpeg|png|webp)$/.test(
            incomingProof.contentType ||
              ''
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
        }).sort({
          createdAt: -1,
        });

      const createdRequest =
        !request;

      if (!request) {
        request =
          new AccessRequest({
            doctorId:
              doctor._id,
            status:
              'pending',
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
          data:
            incomingProof.data,
          contentType:
            incomingProof.contentType,
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

      doctor.accessRequestedAt =
        now;

      doctor.accessRequestReviewedAt =
        null;

      await doctor.save();

      if (
        createdRequest ||
        incomingProof
      ) {
        await Notification.create({
          type:
            'access_request',
          doctorId:
            doctor._id,
          title:
            incomingProof
              ? 'Payment proof submitted'
              : 'Access request received',
          message:
            incomingProof
              ? `${doctor.name} requested access and attached payment proof.`
              : `${doctor.name} has requested Veda access.`,
        });
      }

      res.status(
        createdRequest
          ? 201
          : 200
      ).json({
        success: true,
        alreadyPending:
          !createdRequest,
        message:
          incomingProof
            ? 'Access request and payment proof sent to admin.'
            : createdRequest
              ? 'Access request sent to admin.'
              : 'Your access request is already pending with admin.',
        status: 'pending',
        requestId:
          request._id,
      });
    } catch (e) {
      next(e);
    }
  }
);

/*
|--------------------------------------------------------------------------
| REQUEST ACCESS FROM SIGNED-IN DOCTOR SESSION
|--------------------------------------------------------------------------
*/

router.post(
  '/request-access-session',
  auth,
  async (req, res, next) => {
    try {
      if (!req.doctor) {
        return res.status(403).json({
          success: false,
          message:
            'Doctor access required.',
        });
      }

      const doctor =
        await Doctor.findById(
          req.doctor._id
        );

      if (!doctor) {
        return res.status(404).json({
          success: false,
          message:
            'Doctor account not found.',
        });
      }

      if (doctor.active !== false) {
        return res.status(400).json({
          success: false,
          message:
            'Your access is already active.',
        });
      }

      let request =
        await AccessRequest.findOne({
          doctorId:
            doctor._id,
          status:
            'pending',
        });

      const createdRequest =
        !request;

      if (!request) {
        request =
          new AccessRequest({
            doctorId:
              doctor._id,
            status:
              'pending',
          });
      }

      request.message =
        req.body?.message ||
        'Doctor requested access from their signed-in workspace.';

      request.requestedAt =
        new Date();

      await request.save();

      doctor.accessRequestStatus =
        'pending';

      doctor.accessRequestedAt =
        new Date();

      doctor.accessRequestReviewedAt =
        null;

      await doctor.save();

      if (createdRequest) {
        try {
          await Notification.create({
            type:
              'access_request',
            doctorId:
              doctor._id,
            title:
              'Access request received',
            message:
              `${doctor.name} requested access from their signed-in workspace.`,
          });
        } catch (
          notificationError
        ) {
          console.error(
            'Access request notification error:',
            notificationError
          );
        }
      }

      return res.status(
        createdRequest
          ? 201
          : 200
      ).json({
        success: true,
        alreadyPending:
          !createdRequest,
        message:
          createdRequest
            ? 'Access request sent to the administrator.'
            : 'Your access request is already pending.',
        status:
          'pending',
      });
    } catch (error) {
      next(error);
    }
  }
);

/*
|--------------------------------------------------------------------------
| DOCTOR PAYMENT SUBMISSION
|--------------------------------------------------------------------------
|
| Doctor submits:
| - Amount
| - Number of months
| - Transaction / UTR ID
| - Note
| - Payment screenshot
|
| IMPORTANT:
| This does NOT mark payment as paid.
|
| Admin must verify the payment from AdminDoctorDashboard.
|
|--------------------------------------------------------------------------
*/

router.post(
  '/payment/submit',
  auth,
  async (req, res, next) => {
    try {
      /*
      |--------------------------------------------------------------------------
      | Only doctor can submit payment
      |--------------------------------------------------------------------------
      */

      if (!req.doctor) {
        return res.status(403).json({
          success: false,
          message:
            'Doctor access required.',
        });
      }

      const doctor =
        await Doctor.findById(
          req.doctor._id
        );

      if (!doctor) {
        return res.status(404).json({
          success: false,
          message:
            'Doctor account not found.',
        });
      }

      /*
      |--------------------------------------------------------------------------
      | Validate active account
      |--------------------------------------------------------------------------
      */

      if (doctor.active === false) {
        return res.status(403).json({
          success: false,
          message:
            'Your Veda access is currently inactive. Please request access first.',
        });
      }

      /*
      |--------------------------------------------------------------------------
      | Prevent duplicate pending payment
      |--------------------------------------------------------------------------
      */

      if (
        doctor.pendingPayment &&
        doctor.pendingPayment.status ===
          'pending'
      ) {
        return res.status(409).json({
          success: false,
          message:
            'A payment is already waiting for admin verification.',
          pendingPayment:
            true,
        });
      }

      const body =
        req.body || {};

      /*
      |--------------------------------------------------------------------------
      | Amount
      |--------------------------------------------------------------------------
      */

      const amount =
        Number(body.amount);

      if (
        !Number.isFinite(amount) ||
        amount <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Enter a valid payment amount.',
        });
      }

      if (amount > 10000000) {
        return res.status(400).json({
          success: false,
          message:
            'Payment amount is too large.',
        });
      }

      /*
      |--------------------------------------------------------------------------
      | Months
      |--------------------------------------------------------------------------
      */

      const monthsPaid =
        Number(body.monthsPaid);

      if (
        !Number.isInteger(
          monthsPaid
        ) ||
        monthsPaid < 1 ||
        monthsPaid > 24
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Months paid must be between 1 and 24.',
        });
      }

      /*
      |--------------------------------------------------------------------------
      | Transaction ID / UTR
      |--------------------------------------------------------------------------
      */

      const transactionId =
        String(
          body.transactionId || ''
        ).trim();

      if (!transactionId) {
        return res.status(400).json({
          success: false,
          message:
            'Transaction ID / UTR is required.',
        });
      }

      if (
        transactionId.length > 120
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Transaction ID is too long.',
        });
      }

      /*
      |--------------------------------------------------------------------------
      | Note
      |--------------------------------------------------------------------------
      */

      const note =
        String(
          body.note || ''
        ).trim();

      if (note.length > 500) {
        return res.status(400).json({
          success: false,
          message:
            'Payment note cannot exceed 500 characters.',
        });
      }

      /*
      |--------------------------------------------------------------------------
      | Screenshot
      |--------------------------------------------------------------------------
      */

      const paymentProof =
        body.paymentProof;

      if (
        !paymentProof ||
        typeof paymentProof !==
          'object'
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Payment screenshot is required.',
        });
      }

      if (
        typeof paymentProof.data !==
        'string'
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Invalid payment screenshot.',
        });
      }

      /*
      |--------------------------------------------------------------------------
      | Keep request under Express 2 MB JSON limit
      |--------------------------------------------------------------------------
      */

      if (
        paymentProof.data.length >
        1400000
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Payment screenshot is too large. Please choose a smaller image.',
        });
      }

      /*
      |--------------------------------------------------------------------------
      | Valid image type
      |--------------------------------------------------------------------------
      */

      const contentType =
        String(
          paymentProof.contentType ||
            ''
        ).toLowerCase();

      if (
        !/^image\/(jpeg|png|webp)$/.test(
          contentType
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Payment screenshot must be JPEG, PNG, or WEBP.',
        });
      }

      /*
      |--------------------------------------------------------------------------
      | Save pending payment
      |--------------------------------------------------------------------------
      */

      const now =
        new Date();

      doctor.pendingPayment = {
        amount,
        monthsPaid,
        transactionId,
        note,
        submittedAt:
          now,
        status:
          'pending',
        reviewedAt:
          null,
        reviewedBy:
          null,
        adminNote:
          '',
        paymentProof: {
          data:
            paymentProof.data,
          contentType,
          fileName:
            paymentProof.fileName ||
            'payment-proof.jpg',
        },
      };

      /*
      |--------------------------------------------------------------------------
      | IMPORTANT
      |--------------------------------------------------------------------------
      |
      | Do NOT change:
      | paymentStatus
      | lastPaymentDate
      | nextPaymentDate
      | paymentHistory
      |
      | Those are changed only after admin verification.
      |
      |--------------------------------------------------------------------------
      */

      await doctor.save();

      return res.status(201).json({
        success: true,
        message:
          'Payment submitted successfully. Please wait for administrator verification.',
        pendingPayment: {
          amount:
            doctor.pendingPayment.amount,
          monthsPaid:
            doctor.pendingPayment
              .monthsPaid,
          transactionId:
            doctor.pendingPayment
              .transactionId,
          note:
            doctor.pendingPayment
              .note,
          submittedAt:
            doctor.pendingPayment
              .submittedAt,
          status:
            doctor.pendingPayment
              .status,
          paymentProof: {
            available:
              true,
            contentType:
              doctor.pendingPayment
                .paymentProof
                .contentType,
            fileName:
              doctor.pendingPayment
                .paymentProof
                .fileName,
          },
        },
      });
    } catch (error) {
      console.error(
        'Doctor payment submission error:',
        error
      );

      next(error);
    }
  }
);

/*
|--------------------------------------------------------------------------
| DOCTOR NOTIFICATIONS
|--------------------------------------------------------------------------
|
| Returns ALL active notifications:
| - unread
| - read
|
| Dismissed notifications are excluded.
|
| This allows the frontend notification center to show
| notification history instead of only the latest unread item.
|
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
          message:
            'Doctor notifications are not available to admins.',
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
          doctorId:
            req.user._id,

          // Deleted/dismissed notifications
          // should not appear for the doctor.
          dismissedAt:
            null,
        })
          .sort({
            createdAt: -1,
          })
          .limit(50);

      const unread =
        notifications.filter(
          (notification) =>
            !notification.readAt
        ).length;

      res.json({
        success: true,

        data:
          notifications,

        unread,

        total:
          notifications.length,
      });
    } catch (error) {
      next(error);
    }
  }
);

/*
|--------------------------------------------------------------------------
| MARK ALL NOTIFICATIONS AS READ
|--------------------------------------------------------------------------
*/

router.patch(
  '/notifications/read-all',
  auth,
  async (req, res, next) => {
    try {
      if (req.admin) {
        return res.status(403).json({
          success: false,
          message:
            'Doctor notifications are not available to admins.',
        });
      }

      const result =
        await Notification.updateMany(
          {
            doctorId:
              req.user._id,

            readAt:
              null,

            dismissedAt:
              null,
          },
          {
            $set: {
              readAt:
                new Date(),
            },
          }
        );

      res.json({
        success: true,

        modifiedCount:
          result.modifiedCount || 0,

        message:
          'All notifications marked as read.',
      });
    } catch (error) {
      next(error);
    }
  }
);

/*
|--------------------------------------------------------------------------
| MARK NOTIFICATION AS READ
|--------------------------------------------------------------------------
*/

router.patch(
  '/notifications/:id/read',
  auth,
  async (req, res, next) => {
    try {
      if (req.admin) {
        return res.status(403).json({
          success: false,
          message:
            'Doctor notifications are not available to admins.',
        });
      }

      const notification =
        await Notification.findOneAndUpdate(
          {
            _id:
              req.params.id,

            doctorId:
              req.user._id,
          },
          {
            readAt:
              new Date(),
          },
          {
            new: true,
          }
        );

      if (!notification) {
        return res.status(404).json({
          success: false,
          message:
            'Notification not found.',
        });
      }

      res.json({
        success: true,
        data:
          notification,
      });
    } catch (error) {
      next(error);
    }
  }
);

/*
|--------------------------------------------------------------------------
| DELETE / DISMISS NOTIFICATION
|--------------------------------------------------------------------------
|
| Soft delete:
| We keep the notification in MongoDB but hide it from
| the doctor's active notification list.
|
|--------------------------------------------------------------------------
*/

router.delete(
  '/notifications/:id',
  auth,
  async (req, res, next) => {
    try {
      if (req.admin) {
        return res.status(403).json({
          success: false,
          message:
            'Doctor notifications are not available to admins.',
        });
      }

      const notification =
        await Notification.findOneAndUpdate(
          {
            _id:
              req.params.id,

            doctorId:
              req.user._id,

            dismissedAt:
              null,
          },
          {
            dismissedAt:
              new Date(),
          },
          {
            new: true,
          }
        );

      if (!notification) {
        return res.status(404).json({
          success: false,
          message:
            'Notification not found.',
        });
      }

      res.json({
        success: true,
        message:
          'Notification deleted.',
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
|
| Always fetch latest account from MongoDB.
|
|--------------------------------------------------------------------------
*/

router.get(
  '/me',
  auth,
  async (req, res, next) => {
    try {
      const Model =
        req.admin
          ? Admin
          : Doctor;

      const account =
        await Model.findById(
          req.user._id
        );

      if (!account) {
        return res.status(404).json({
          success: false,
          message:
            'Account not found.',
        });
      }

      /*
      |--------------------------------------------------------------------------
      | Ensure billing fields for older doctor accounts
      |--------------------------------------------------------------------------
      */

      if (!req.admin) {
        let changed =
          false;

        const startDate =
          account.accessStartDate ||
          account.registrationDate ||
          account.createdAt ||
          new Date();

        if (
          !account.registrationDate
        ) {
          account.registrationDate =
            account.createdAt ||
            new Date();

          changed = true;
        }

        if (
          !account.accessStartDate
        ) {
          account.accessStartDate =
            startDate;

          changed = true;
        }

        if (
          !account.paymentStatus
        ) {
          account.paymentStatus =
            'pending';

          changed = true;
        }

        if (
          !account.nextPaymentDate
        ) {
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

        /*
        |--------------------------------------------------------------------------
        | Older doctor accounts
        |--------------------------------------------------------------------------
        |
        | pendingPayment is optional, so no database migration
        | is required here.
        |
        */

        if (changed) {
          await account.save();
        }

        await ensurePaymentNotification(
          account
        );
      }

      const cleaned =
        clean(account);

      return res.json({
        success: true,

        role:
          req.admin
            ? 'admin'
            : 'doctor',

        user:
          cleaned,

        doctor:
          req.admin
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
          req.body[key] !==
          undefined
        ) {
          data[key] =
            req.body[key];
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
              runValidators:
                true,
            }
          )
          .select(
            '-password'
          );

      res.json({
        success: true,

        user:
          updated,

        doctor:
          req.admin
            ? null
            : updated,
      });
    } catch (e) {
      next(e);
    }
  }
);

module.exports = router;