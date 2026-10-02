const router = require('express').Router();

const bcrypt = require('bcryptjs');

const Doctor = require('../models/Doctor');
const DoctorRequest = require('../models/DoctorRequest');
const AccessRequest = require('../models/AccessRequest');
const Notification = require('../models/Notification');
const ensurePaymentNotification =
  require('../services/paymentCycle');

const Patient = require('../models/Patient');
const Visit = require('../models/Visit');

const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

router.use(auth, admin);

const addOneMonth = (date, months = 1) => {
  const d = new Date(date);

  if (Number.isNaN(d.getTime())) {
    return null;
  }

  const originalDay = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + months);

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

const daysBetween = (
  start,
  end = new Date()
) => {
  if (!start) {
    return 0;
  }

  const startDate = new Date(start);
  const endDate = new Date(end);

  if (
    Number.isNaN(startDate.getTime()) ||
    Number.isNaN(endDate.getTime())
  ) {
    return 0;
  }

  const diff =
    endDate.getTime() - startDate.getTime();

  return Math.max(
    0,
    Math.floor(diff / (1000 * 60 * 60 * 24))
  );
};

const cleanDoctor = (
  doctor
) => {
  const data =
    doctor &&
    typeof doctor.toObject === 'function'
      ? doctor.toObject()
      : {
          ...(doctor || {}),
        };

  delete data.password;

  const startDate =
    data.accessStartDate ||
    data.registrationDate ||
    data.createdAt ||
    null;

  const nextPayment =
    data.nextPaymentDate ||
    (
      startDate
        ? addOneMonth(startDate)
        : null
    );

  const paymentHistory =
    (data.paymentHistory || []).map(
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

  return {
    ...data,
    paymentHistory,

    registrationDate:
      data.registrationDate ||
      data.createdAt ||
      null,

    accessStartDate:
      startDate,

    accessActive:
      data.active !== false,

    daysUsed:
      daysBetween(startDate),

    nextPaymentDate:
      nextPayment,

    paymentStatus:
      data.paymentStatus ||
      'pending',

    paymentReminderRequested:
      data.paymentReminderRequested === true,

    paymentReminderAt:
      data.paymentReminderAt ||
      null,

    accessRequestStatus:
      data.accessRequestStatus ||
      'none',

    accessRequestedAt:
      data.accessRequestedAt ||
      null,

    accessRequestReviewedAt:
      data.accessRequestReviewedAt ||
      null,
  };
};

/*
|--------------------------------------------------------------------------
| INITIALIZE OLD DOCTORS
|--------------------------------------------------------------------------
*/

const ensureBillingFields = async (
  doctor
) => {
  let changed = false;

  const startDate =
    doctor.accessStartDate ||
    doctor.registrationDate ||
    doctor.createdAt ||
    new Date();

  if (!doctor.registrationDate) {
    doctor.registrationDate =
      doctor.createdAt ||
      new Date();

    changed = true;
  }

  if (!doctor.accessStartDate) {
    doctor.accessStartDate =
      startDate;

    changed = true;
  }

  if (!doctor.paymentStatus) {
    doctor.paymentStatus =
      'pending';

    changed = true;
  }

  if (!doctor.nextPaymentDate) {
    doctor.nextPaymentDate =
      addOneMonth(
        doctor.accessStartDate
      );

    changed = true;
  }

  if (!doctor.accessRequestStatus) {
    doctor.accessRequestStatus =
      'none';

    changed = true;
  }

  if (
    doctor.paymentReminderRequested ===
    undefined
  ) {
    doctor.paymentReminderRequested =
      false;

    changed = true;
  }

  if (
    doctor.paymentReminderAt ===
    undefined
  ) {
    doctor.paymentReminderAt =
      null;

    changed = true;
  }

  if (
    doctor.accessRequestedAt ===
    undefined
  ) {
    doctor.accessRequestedAt =
      null;

    changed = true;
  }

  if (
    doctor.accessRequestReviewedAt ===
    undefined
  ) {
    doctor.accessRequestReviewedAt =
      null;

    changed = true;
  }

  if (changed) {
    await doctor.save();
  }

  return doctor;
};

/*
|--------------------------------------------------------------------------
| REVENUE LEDGER
|--------------------------------------------------------------------------
*/
router.get(
  '/revenue',
  async (req, res, next) => {
    try {
      const page = Math.max(
        1,
        Number.parseInt(req.query.page, 10) || 1
      );
      const pageSize = 20;

      const [result] =
        await Doctor.aggregate([
          {
            $unwind: '$paymentHistory',
          },
          {
            $lookup: {
              from: 'admins',
              localField: 'paymentHistory.recordedBy',
              foreignField: '_id',
              as: 'paymentAdmin',
            },
          },
          {
            $facet: {
              summary: [
                {
                  $group: {
                    _id: null,
                    totalRevenue: {
                      $sum: '$paymentHistory.amount',
                    },
                    paymentCount: {
                      $sum: 1,
                    },
                    doctors: {
                      $addToSet: '$_id',
                    },
                  },
                },
                {
                  $project: {
                    _id: 0,
                    totalRevenue: {
                      $round: ['$totalRevenue', 2],
                    },
                    paymentCount: 1,
                    doctorCount: {
                      $size: '$doctors',
                    },
                  },
                },
              ],
              monthlyRevenue: [
                {
                  $group: {
                    _id: {
                      year: {
                        $year: '$paymentHistory.paidAt',
                      },
                      month: {
                        $month: '$paymentHistory.paidAt',
                      },
                    },
                    amount: {
                      $sum: '$paymentHistory.amount',
                    },
                    payments: {
                      $sum: 1,
                    },
                  },
                },
                {
                  $sort: {
                    '_id.year': -1,
                    '_id.month': -1,
                  },
                },
                {
                  $limit: 12,
                },
              ],
              records: [
                {
                  $sort: {
                    'paymentHistory.paidAt': -1,
                  },
                },
                {
                  $skip: (page - 1) * pageSize,
                },
                {
                  $limit: pageSize,
                },
                {
                  $project: {
                    _id: '$paymentHistory._id',
                    doctorId: '$_id',
                    doctorName: '$name',
                    doctorEmail: '$email',
                    amount: '$paymentHistory.amount',
                    transactionId:
                      '$paymentHistory.transactionId',
                    monthsPaid:
                      '$paymentHistory.monthsPaid',
                    note: '$paymentHistory.note',
                    paidAt: '$paymentHistory.paidAt',
                    nextPaymentDate:
                      '$paymentHistory.nextPaymentDate',
                    recordedBy:
                      '$paymentHistory.recordedBy',
                    recordedByName: {
                      $arrayElemAt: [
                        '$paymentAdmin.name',
                        0,
                      ],
                    },
                    hasPaymentProof: {
                      $cond: [
                        {
                          $ne: [
                            '$paymentHistory.paymentProof.data',
                            null,
                          ],
                        },
                        true,
                        false,
                      ],
                    },
                  },
                },
              ],
              count: [
                {
                  $count: 'total',
                },
              ],
            },
          },
        ]);

      const monthlyRevenue =
        result?.monthlyRevenue || [];

      res.json({
        success: true,
        data: {
          ...(result?.summary?.[0] || {
            totalRevenue: 0,
            paymentCount: 0,
            doctorCount: 0,
          }),
          monthlyRevenue: monthlyRevenue.reverse(),
          records: result?.records || [],
          page,
          pageSize,
          totalRecords:
            result?.count?.[0]?.total || 0,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/*
|--------------------------------------------------------------------------
| GET PENDING REGISTRATION REQUESTS
|--------------------------------------------------------------------------
*/
router.get(
  '/requests',
  async (
    req,
    res,
    next
  ) => {
    try {
      const requests =
        await DoctorRequest.find({
          status: 'pending',
        })
          .select('-password')
          .sort({
            createdAt: -1,
          });

      res.json({
        success: true,
        data: requests,
      });
    } catch (error) {
      next(error);
    }
  }
);

/*
|--------------------------------------------------------------------------
| GET DOCTORS
|--------------------------------------------------------------------------
*/

router.get(
  '/doctors',
  async (
    req,
    res,
    next
  ) => {
    try {
      const doctors =
        await Doctor.find()
          .sort({
            createdAt: -1,
          });

      const result = [];

      for (
        const doctor of doctors
      ) {
        await ensureBillingFields(
          doctor
        );

        await ensurePaymentNotification(
          doctor
        );

        result.push(
          cleanDoctor(
            doctor
          )
        );
      }

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

/*
|--------------------------------------------------------------------------
| GET SINGLE DOCTOR
|--------------------------------------------------------------------------
*/

router.get(
  '/doctors/:id',
  async (
    req,
    res,
    next
  ) => {
    try {
      const doctor =
        await Doctor.findById(
          req.params.id
        );

      if (!doctor) {
        return res.status(404).json({
          success: false,
          message:
            'Doctor not found',
        });
      }

      await ensureBillingFields(
        doctor
      );

      await ensurePaymentNotification(
        doctor
      );

      res.json({
        success: true,
        data:
          cleanDoctor(
            doctor
          ),
      });
    } catch (error) {
      next(error);
    }
  }
);

/*
|--------------------------------------------------------------------------
| UPDATE DOCTOR
|--------------------------------------------------------------------------
*/

router.put(
  '/doctors/:id',
  async (
    req,
    res,
    next
  ) => {
    try {
      const data = {};

      [
        'name',
        'email',
        'phone',
        'qualification',
        'specialization',
        'registrationNumber',
        'clinicName',
        'clinicAddress',
        'clinicLogo',
        'clinicBanner',
        'signature',
      ].forEach(
        (key) => {
          if (
            req.body[key] !==
            undefined
          ) {
            data[key] =
              req.body[key];
          }
        }
      );

      if (req.body.password) {
        data.password =
          await bcrypt.hash(
            req.body.password,
            12
          );
      }

      const doctor =
        await Doctor.findByIdAndUpdate(
          req.params.id,
          data,
          {
            new: true,
            runValidators: true,
          }
        ).select('-password');

      if (!doctor) {
        return res.status(404).json({
          success: false,
          message:
            'Doctor not found',
        });
      }

      res.json({
        success: true,
        data: doctor,
      });
    } catch (error) {
      next(error);
    }
  }
);

/*
|--------------------------------------------------------------------------
| APPROVE NEW DOCTOR REGISTRATION
|--------------------------------------------------------------------------
*/

router.post(
  '/requests/:id/approve',
  async (
    req,
    res,
    next
  ) => {
    try {
      const request =
        await DoctorRequest.findOne({
          _id: req.params.id,
          status: 'pending',
        });

      if (!request) {
        return res.status(404).json({
          success: false,
          message:
            'Pending request not found',
        });
      }

      const existingDoctor =
        await Doctor.findOne({
          email:
            request.email.toLowerCase(),
        });

      if (existingDoctor) {
        return res.status(400).json({
          success: false,
          message:
            'A doctor with this email already exists.',
        });
      }

      const now =
        new Date();

      const doctor =
        await Doctor.create({
          name:
            request.name,

          email:
            request.email,

          phone:
            request.phone,

          password:
            request.password,

          qualification:
            request.qualification,

          specialization:
            request.specialization,

          registrationNumber:
            request.registrationNumber,

          clinicName:
            request.clinicName,

          clinicAddress:
            request.clinicAddress,

          clinicLogo:
            request.clinicLogo,

          clinicBanner:
            request.clinicBanner,

          active:
            true,

          registrationDate:
            request.createdAt ||
            now,

          accessStartDate:
            now,

          paymentStatus:
            'pending',

          nextPaymentDate:
            addOneMonth(now),

          paymentReminderRequested:
            false,

          paymentReminderAt:
            null,

          accessRequestStatus:
            'none',

          accessRequestedAt:
            null,

          accessRequestReviewedAt:
            null,
        });

      request.status =
        'approved';

      request.reviewedAt =
        now;

      await request.save();

      res.json({
        success: true,
        doctor:
          cleanDoctor(
            doctor
          ),
      });
    } catch (error) {
      next(error);
    }
  }
);

/*
|--------------------------------------------------------------------------
| REJECT REGISTRATION REQUEST
|--------------------------------------------------------------------------
*/

router.post(
  '/requests/:id/reject',
  async (
    req,
    res,
    next
  ) => {
    try {
      const item =
        await DoctorRequest.findOneAndUpdate(
          {
            _id: req.params.id,
            status: 'pending',
          },
          {
            status: 'rejected',
            reviewedAt:
              new Date(),
          },
          {
            new: true,
          }
        ).select('-password');

      if (!item) {
        return res.status(404).json({
          success: false,
          message:
            'Pending request not found',
        });
      }

      res.json({
        success: true,
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }
);

/*
|--------------------------------------------------------------------------
| ASK DOCTOR FOR PAYMENT
|--------------------------------------------------------------------------
*/

router.post(
  '/doctors/:id/payment-request',
  async (
    req,
    res,
    next
  ) => {
    try {
      const doctor =
        await Doctor.findById(
          req.params.id
        );

      if (!doctor) {
        return res.status(404).json({
          success: false,
          message:
            'Doctor not found',
        });
      }

      if (
        doctor.paymentStatus ===
        'paid'
      ) {
        return res.status(400).json({
          success: false,
          message:
            'This doctor has already paid for the current payment cycle.',
          data:
            cleanDoctor(
              doctor
            ),
        });
      }

      const reminderRequestedAt =
        doctor.paymentReminderAt
          ? new Date(
              doctor.paymentReminderAt
            ).getTime()
          : null;

      const cooldownActive =
        doctor.paymentReminderRequested ===
          true &&
        Number.isFinite(
          reminderRequestedAt
        ) &&
        Date.now() - reminderRequestedAt <
          24 * 60 * 60 * 1000;

      if (cooldownActive) {
        return res.status(429).json({
          success: false,
          message:
            'A payment request was sent within the last 24 hours. You can send another after the cooldown ends.',
          retryAt: new Date(
            reminderRequestedAt +
              24 * 60 * 60 * 1000
          ),
          data:
            cleanDoctor(
              doctor
            ),
        });
      }

      doctor.paymentReminderRequested =
        true;

      doctor.paymentReminderAt =
        new Date();

      await doctor.save();

      /*
      |--------------------------------------------------------------------------
      | Notification
      |--------------------------------------------------------------------------
      */

      try {
        await Notification.create({
          type:
            'payment_request',

          doctorId:
            doctor._id,

          title:
            'Payment Requested',

          message:
            'Admin has requested your monthly Veda payment.',
        });
      } catch (
        notificationError
      ) {
        console.error(
          'Payment request notification error:',
          notificationError
        );
      }

      /*
      |--------------------------------------------------------------------------
      | Fetch latest doctor
      |--------------------------------------------------------------------------
      */

      const updatedDoctor =
        await Doctor.findById(
          doctor._id
        );

      res.json({
        success: true,

        message:
          'Payment request sent to doctor.',

        data:
          cleanDoctor(
            updatedDoctor
          ),
      });
    } catch (error) {
      console.error(
        '❌ PAYMENT REQUEST ERROR:',
        error
      );

      next(error);
    }
  }
);

/*
|--------------------------------------------------------------------------
| MARK PAYMENT AS PAID
|--------------------------------------------------------------------------
|
| IMPORTANT:
| This route only changes payment information.
| It does NOT automatically restore doctor access.
|
|--------------------------------------------------------------------------
*/

router.patch(
  '/doctors/:id/payment',
  async (
    req,
    res,
    next
  ) => {
    try {
      console.log('');
      console.log(
        '======================================'
      );
      console.log(
        '💰 ADMIN MARK PAYMENT PAID'
      );
      console.log(
        'Doctor ID:',
        req.params.id
      );
      console.log(
        '======================================'
      );

      /*
      |--------------------------------------------------------------------------
      | FIND DOCTOR
      |--------------------------------------------------------------------------
      */

      const doctor =
        await Doctor.findById(
          req.params.id
        );

      if (!doctor) {
        return res.status(404).json({
          success: false,
          message:
            'Doctor not found.',
        });
      }

      if (req.body?.status === 'unpaid') {
        doctor.paymentStatus = 'pending';
        doctor.paymentReminderRequested = false;
        doctor.paymentReminderAt = null;
        await doctor.save();

        return res.json({
          success: true,
          message: 'Payment remains unpaid.',
          data: cleanDoctor(doctor),
        });
      }

      if (req.body?.status !== 'paid') {
        return res.status(400).json({
          success: false,
          message: 'Choose paid or unpaid.',
        });
      }

      const amount =
        Number(req.body?.amount);

      if (
        !Number.isFinite(amount) ||
        amount <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Enter a valid payment amount greater than zero.',
        });
      }

      const monthsPaid =
        Number(req.body?.monthsPaid);

      if (
        !Number.isInteger(monthsPaid) ||
        monthsPaid < 1 ||
        monthsPaid > 24
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Payment duration must be between 1 and 24 months.',
        });
      }

      const paymentNote =
        String(req.body?.note || '')
          .trim()
          .slice(0, 500);

      const transactionId =
        String(req.body?.transactionId || '')
          .trim()
          .slice(0, 120);

      const paymentProof =
        req.body?.paymentProof || null;

      if (
        paymentProof &&
        (
          typeof paymentProof.data !== 'string' ||
          paymentProof.data.length > 1400000 ||
          !/^image\/(jpeg|png|webp)$/.test(
            paymentProof.contentType || ''
          )
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Payment screenshot must be a JPEG, PNG, or WEBP image under 1 MB.',
        });
      }

      /*
      |--------------------------------------------------------------------------
      | PAYMENT DATE
      |--------------------------------------------------------------------------
      */

      let paymentDate =
        req.body?.paymentDate
          ? new Date(
              req.body.paymentDate
            )
          : new Date();

      if (
        Number.isNaN(
          paymentDate.getTime()
        )
      ) {
        paymentDate =
          new Date();
      }

      /*
      |--------------------------------------------------------------------------
      | CALCULATE NEXT PAYMENT DATE
      |--------------------------------------------------------------------------
      */

      const nextPaymentDate =
        addOneMonth(
          paymentDate,
          monthsPaid
        );

      doctor.paymentHistory.push({
        amount,
        transactionId,
        monthsPaid,
        note: paymentNote,
        paidAt: paymentDate,
        nextPaymentDate,
        recordedBy:
          req.admin?._id || null,
        paymentProof: paymentProof
          ? {
              data: paymentProof.data,
              contentType:
                paymentProof.contentType,
              fileName:
                String(paymentProof.fileName || '')
                  .trim()
                  .slice(0, 120),
            }
          : undefined,
      });

      /*
      |--------------------------------------------------------------------------
      | UPDATE PAYMENT FIELDS
      |--------------------------------------------------------------------------
      */

      doctor.paymentStatus =
        'paid';

      doctor.lastPaymentDate =
        paymentDate;

      doctor.nextPaymentDate =
        nextPaymentDate;

      /*
      |--------------------------------------------------------------------------
      | CLEAR PAYMENT REQUEST
      |--------------------------------------------------------------------------
      */

      doctor.paymentReminderRequested =
        false;

      doctor.paymentReminderAt =
        null;

      /*
      |--------------------------------------------------------------------------
      | SAVE TO MONGODB
      |--------------------------------------------------------------------------
      */

      await doctor.save();

      console.log(
        '✅ PAYMENT SAVED TO MONGODB'
      );

      console.log(
        'Doctor:',
        doctor.name
      );

      console.log(
        'Payment status:',
        doctor.paymentStatus
      );

      console.log(
        'Last payment:',
        doctor.lastPaymentDate
      );

      console.log(
        'Next payment:',
        doctor.nextPaymentDate
      );

      /*
      |--------------------------------------------------------------------------
      | CREATE PAYMENT VERIFIED NOTIFICATION
      |--------------------------------------------------------------------------
      |
      | Notification failure must NOT undo
      | the successful payment update.
      |
      */

      try {
        await Notification.create({
          type:
            'payment_verified',

          doctorId:
            doctor._id,

          title:
            'Payment Verified',

          message: paymentNote
<<<<<<< ours
            ? `Your payment of ???${amount} for ${monthsPaid} month(s) has been verified. Admin note: ${paymentNote}`
            : `Your payment of ???${amount} for ${monthsPaid} month(s) has been verified.`,
=======
            ? `Your payment of ₹${amount} for ${monthsPaid} month(s) has been verified. Admin note: ${paymentNote}`
            : `Your payment of ₹${amount} for ${monthsPaid} month(s) has been verified.`,
>>>>>>> theirs
        });

        console.log(
          '✅ PAYMENT NOTIFICATION CREATED'
        );
      } catch (
        notificationError
      ) {
        console.error(
          '⚠️ PAYMENT NOTIFICATION FAILED:',
          notificationError.message
        );
      }

      /*
      |--------------------------------------------------------------------------
      | FETCH THE LATEST DOCUMENT FROM MONGODB
      |--------------------------------------------------------------------------
      */

      const updatedDoctor =
        await Doctor.findById(
          doctor._id
        );

      console.log(
        'FINAL PAYMENT STATUS:',
        updatedDoctor?.paymentStatus
      );

      console.log(
        'FINAL PAYMENT REQUEST:',
        updatedDoctor?.paymentReminderRequested
      );

      /*
      |--------------------------------------------------------------------------
      | RETURN UPDATED DOCTOR
      |--------------------------------------------------------------------------
      */

      return res.json({
        success: true,

        message:
          'Payment marked as paid successfully.',

        data:
          cleanDoctor(
            updatedDoctor
          ),
      });

    } catch (error) {
      console.error(
        '❌ MARK PAYMENT ERROR:',
        error
      );

      next(error);
    }
  }
);

router.get(
  '/doctors/:doctorId/payments/:paymentId/proof',
  async (req, res, next) => {
    try {
      const doctor =
        await Doctor.findById(
          req.params.doctorId
        ).select('paymentHistory');

      const payment =
        doctor?.paymentHistory.id(
          req.params.paymentId
        );

      if (!payment?.paymentProof?.data) {
        return res.status(404).json({
          success: false,
          message: 'Payment screenshot not found.',
        });
      }

      return res.json({
        success: true,
        data: {
          data: payment.paymentProof.data,
          contentType:
            payment.paymentProof.contentType,
          fileName:
            payment.paymentProof.fileName,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  '/doctors/:doctorId/payments/:paymentId',
  async (req, res, next) => {
    try {
      const doctor =
        await Doctor.findById(
          req.params.doctorId
        );

      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: 'Doctor not found.',
        });
      }

      const payment =
        doctor.paymentHistory.id(
          req.params.paymentId
        );

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment record not found.',
        });
      }

      doctor.paymentHistory.pull({
        _id: req.params.paymentId,
      });

      const latestPayment =
        [...doctor.paymentHistory].sort(
          (left, right) =>
            new Date(right.paidAt) -
            new Date(left.paidAt)
        )[0];

      if (latestPayment) {
        doctor.lastPaymentDate =
          latestPayment.paidAt;
        doctor.nextPaymentDate =
          latestPayment.nextPaymentDate;
        doctor.paymentStatus =
          latestPayment.nextPaymentDate >
          new Date()
            ? 'paid'
            : 'pending';
      } else {
        doctor.lastPaymentDate = null;
        doctor.nextPaymentDate =
          new Date();
        doctor.paymentStatus =
          'pending';
      }

      doctor.paymentReminderRequested = false;
      doctor.paymentReminderAt = null;
      await doctor.save();

      return res.json({
        success: true,
        message: 'Payment record deleted.',
        data: cleanDoctor(doctor),
      });
    } catch (error) {
      next(error);
    }
  }
);

/*
|--------------------------------------------------------------------------
| REMOVE / RESTORE ACCESS
|--------------------------------------------------------------------------
*/

router.patch(
  '/doctors/:id/access',
  async (
    req,
    res,
    next
  ) => {
    try {
      const doctor =
        await Doctor.findById(
          req.params.id
        );

      if (!doctor) {
        return res.status(404).json({
          success: false,
          message:
            'Doctor not found',
        });
      }

      const shouldBeActive =
        req.body.active !== false;

      doctor.active =
        shouldBeActive;

      if (shouldBeActive) {
        doctor.accessRemovedAt =
          null;

        doctor.accessRemovalReason =
          '';

        if (
          doctor.accessRequestStatus ===
          'pending'
        ) {
          doctor.accessRequestStatus =
            'approved';

          doctor.accessRequestReviewedAt =
            new Date();
        }

        await AccessRequest.updateMany(
          {
            doctorId:
              doctor._id,

            status:
              'pending',
          },
          {
            status:
              'approved',

            reviewedAt:
              new Date(),
          }
        );

        try {
          await Notification.create({
            type:
              'access_approved',

            doctorId:
              doctor._id,

            title:
              'Access Restored',

            message:
              'Your Veda access has been restored by admin.',
          });
        } catch (notificationError) {
          console.error(
            'Access notification error:',
            notificationError
          );
        }
      } else {
        doctor.accessRemovedAt =
          new Date();

        doctor.accessRemovalReason =
          req.body.reason ||
          'Access removed by admin';

        doctor.accessRequestStatus =
          'none';

        doctor.accessRequestReviewedAt =
          null;
      }

      await doctor.save();

      res.json({
        success: true,

        message:
          shouldBeActive
            ? 'Doctor access restored successfully.'
            : 'Doctor access removed successfully. Account and patient data were preserved.',

        data:
          cleanDoctor(
            doctor
          ),
      });
    } catch (error) {
      next(error);
    }
  }
);

/*
|--------------------------------------------------------------------------
| GET ACCESS REQUESTS
|--------------------------------------------------------------------------
*/

router.get(
  '/access-requests',
  async (
    req,
    res,
    next
  ) => {
    try {
      const requests =
        await AccessRequest.find({
          status: 'pending',
        })
          .populate(
            'doctorId',
            'name email paymentStatus'
          )
          .sort({
            createdAt: -1,
          });

      const requestsWithoutProofData =
        requests.map((request) => {
          const value = request.toObject();

          if (value.paymentProof) {
            value.paymentProof = {
              contentType:
                value.paymentProof.contentType,
              fileName:
                value.paymentProof.fileName,
              uploadedAt:
                value.paymentProof.uploadedAt,
              available: Boolean(
                value.paymentProof.data
              ),
            };
          }

          return value;
        });

      res.json({
        success: true,
        data: requestsWithoutProofData,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/access-requests/:id/payment-proof',
  async (req, res, next) => {
    try {
      const request =
        await AccessRequest.findById(
          req.params.id
        );

      if (!request?.paymentProof?.data) {
        return res.status(404).json({
          success: false,
          message: 'Payment proof not found.',
        });
      }

      res.json({
        success: true,
        data: {
          contentType:
            request.paymentProof.contentType,
          fileName:
            request.paymentProof.fileName,
          data: request.paymentProof.data,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/*
|--------------------------------------------------------------------------
| APPROVE ACCESS REQUEST
|--------------------------------------------------------------------------
*/

router.post(
  '/access-requests/:id/approve',
  async (
    req,
    res,
    next
  ) => {
    try {
      const request =
        await AccessRequest.findOne({
          _id: req.params.id,
          status: 'pending',
        });

      if (!request) {
        return res.status(404).json({
          success: false,
          message:
            'Access request not found',
        });
      }

      const doctor =
        await Doctor.findById(
          request.doctorId
        );

      if (!doctor) {
        return res.status(404).json({
          success: false,
          message:
            'Doctor not found',
        });
      }

      const now =
        new Date();

      doctor.active =
        true;

      doctor.accessRemovedAt =
        null;

      doctor.accessRemovalReason =
        '';

      doctor.accessRequestStatus =
        'approved';

      doctor.accessRequestReviewedAt =
        now;

      await doctor.save();

      request.status =
        'approved';

      request.reviewedAt =
        now;

      await request.save();

      try {
        await Notification.create({
          type:
            'access_approved',

          doctorId:
            doctor._id,

          title:
            'Access Approved',

          message:
            'Doctor access has been restored.',
        });
      } catch (notificationError) {
        console.error(
          'Access notification error:',
          notificationError
        );
      }

      res.json({
        success: true,

        message:
          'Doctor access approved.',

        data:
          cleanDoctor(
            doctor
          ),
      });
    } catch (error) {
      next(error);
    }
  }
);

/*
|--------------------------------------------------------------------------
| REJECT ACCESS REQUEST
|--------------------------------------------------------------------------
*/

router.post(
  '/access-requests/:id/reject',
  async (
    req,
    res,
    next
  ) => {
    try {
      const request =
        await AccessRequest.findOne({
          _id: req.params.id,
          status: 'pending',
        });

      if (!request) {
        return res.status(404).json({
          success: false,
          message:
            'Access request not found',
        });
      }

      const doctor =
        await Doctor.findById(
          request.doctorId
        );

      const now =
        new Date();

      request.status =
        'rejected';

      request.reviewedAt =
        now;

      await request.save();

      if (doctor) {
        doctor.accessRequestStatus =
          'rejected';

        doctor.accessRequestReviewedAt =
          now;

        await doctor.save();

        try {
          await Notification.create({
            type:
              'access_rejected',

            doctorId:
              doctor._id,

            title:
              'Access Request Rejected',

            message:
              'Your Veda access request was rejected by admin.',
          });
        } catch (notificationError) {
          console.error(
            'Access rejection notification error:',
            notificationError
          );
        }
      }

      res.json({
        success: true,

        message:
          'Access request rejected.',
      });
    } catch (error) {
      next(error);
    }
  }
);

/*
|--------------------------------------------------------------------------
| ADMIN NOTIFICATIONS
|--------------------------------------------------------------------------
*/

router.get(
  '/notifications',
  async (
    req,
    res,
    next
  ) => {
    try {
      const doctors =
        await Doctor.find();

      for (
        const doctor of doctors
      ) {
        await ensureBillingFields(
          doctor
        );

        await ensurePaymentNotification(
          doctor
        );
      }

      const notifications =
        await Notification.find({
          dismissedAt: null,
        })
          .populate(
            'doctorId',
            'name email'
          )
          .sort({
            createdAt: -1,
          })
          .limit(100);

      const unread =
        notifications.filter(
          (item) =>
            !item.readAt
        ).length;

      res.json({
        success: true,

        data:
          notifications,

        unread,
      });
    } catch (error) {
      next(error);
    }
  }
);

/*
|--------------------------------------------------------------------------
| MARK NOTIFICATION READ
|--------------------------------------------------------------------------
*/

router.patch(
  '/notifications/:id/read',
  async (
    req,
    res,
    next
  ) => {
    try {
      const notification =
        await Notification.findByIdAndUpdate(
          req.params.id,
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
            'Notification not found',
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

router.delete(
  '/notifications/:id',
  async (req, res, next) => {
    try {
      const notification =
        await Notification.findByIdAndUpdate(
          req.params.id,
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
| DELETE DOCTOR
|--------------------------------------------------------------------------
*/

router.delete(
  '/doctors/:id',
  async (
    req,
    res,
    next
  ) => {
    try {
      console.log('');
      console.log(
        '======================================'
      );
      console.log(
        '🗑️ ADMIN DELETE DOCTOR'
      );
      console.log(
        'Doctor ID:',
        req.params.id
      );
      console.log(
        '======================================'
      );

      const doctor =
        await Doctor.findById(
          req.params.id
        );

      if (!doctor) {
        return res.status(404).json({
          success: false,
          message:
            'Doctor not found',
        });
      }

      const visits =
        await Visit.deleteMany({
          doctorId:
            doctor._id,
        });

      const patients =
        await Patient.deleteMany({
          doctorId:
            doctor._id,
        });

      await AccessRequest.deleteMany({
        doctorId:
          doctor._id,
      });

      await Notification.deleteMany({
        doctorId:
          doctor._id,
      });

      await Doctor.deleteOne({
        _id:
          doctor._id,
      });

      console.log(
        '✅ Doctor deleted'
      );

      console.log(
        'Patients deleted:',
        patients.deletedCount
      );

      console.log(
        'Prescriptions deleted:',
        visits.deletedCount
      );

      res.json({
        success: true,

        message:
          'Doctor, patients and prescriptions deleted successfully',

        deletedPatients:
          patients.deletedCount,

        deletedPrescriptions:
          visits.deletedCount,
      });
    } catch (error) {
      console.error(
        '❌ ADMIN DELETE ERROR:',
        error
      );

      next(error);
    }
  }
);

/*
|--------------------------------------------------------------------------
| EXPORT
|--------------------------------------------------------------------------
*/

module.exports =
  router;