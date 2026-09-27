const router = require('express').Router();

const Doctor = require('../models/Doctor');
const DoctorRequest = require('../models/DoctorRequest');
const Patient = require('../models/Patient');
const Visit = require('../models/Visit');

const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

router.use(auth, admin);

/*
|--------------------------------------------------------------------------
| GET PENDING REQUESTS
|--------------------------------------------------------------------------
*/

router.get(
  '/requests',
  async (req, res, next) => {
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
  async (req, res, next) => {
    try {
      const doctors =
        await Doctor.find()
          .select('-password')
          .sort({
            createdAt: -1,
          });

      res.json({
        success: true,
        data: doctors,
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
  async (req, res, next) => {
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
      ].forEach((key) => {
        if (
          req.body[key] !== undefined
        ) {
          data[key] =
            req.body[key];
        }
      });

      if (req.body.password) {
        data.password =
          await require('bcryptjs').hash(
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
| APPROVE DOCTOR REQUEST
|--------------------------------------------------------------------------
*/

router.post(
  '/requests/:id/approve',
  async (req, res, next) => {
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

      const doctor =
        await Doctor.create({
          name: request.name,
          email: request.email,
          phone: request.phone,
          password: request.password,
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
          active: true,
        });

      request.status =
        'approved';

      request.reviewedAt =
        new Date();

      await request.save();

      res.json({
        success: true,
        doctor:
          doctor.toObject(),
      });
    } catch (error) {
      next(error);
    }
  }
);

/*
|--------------------------------------------------------------------------
| REJECT REQUEST
|--------------------------------------------------------------------------
*/

router.post(
  '/requests/:id/reject',
  async (req, res, next) => {
    try {
      const item =
        await DoctorRequest.findOneAndUpdate(
          {
            _id: req.params.id,
            status: 'pending',
          },
          {
            status: 'rejected',
            reviewedAt: new Date(),
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
| ENABLE / DISABLE DOCTOR
|--------------------------------------------------------------------------
*/

router.patch(
  '/doctors/:id/access',
  async (req, res, next) => {
    try {
      const doctor =
        await Doctor.findByIdAndUpdate(
          req.params.id,
          {
            active:
              req.body.active !== false,
          },
          {
            new: true,
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
| DELETE DOCTOR
|--------------------------------------------------------------------------
*/

router.delete(
  '/doctors/:id',
  async (req, res, next) => {
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

      /*
      |--------------------------------------------------------------------------
      | Delete all prescriptions
      |--------------------------------------------------------------------------
      */

      const visits =
        await Visit.deleteMany({
          doctorId: doctor._id,
        });

      /*
      |--------------------------------------------------------------------------
      | Delete all patients
      |--------------------------------------------------------------------------
      */

      const patients =
        await Patient.deleteMany({
          doctorId: doctor._id,
        });

      /*
      |--------------------------------------------------------------------------
      | Delete doctor
      |--------------------------------------------------------------------------
      */

      await Doctor.deleteOne({
        _id: doctor._id,
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

module.exports = router;