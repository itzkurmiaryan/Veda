const router = require('express').Router();

const Visit = require('../models/Visit');
const Patient = require('../models/Patient');

const auth = require('../middleware/auth');
const doctorWriteAccess =
  require('../middleware/doctorWriteAccess');

router.use(auth);

/*
|--------------------------------------------------------------------------
| DOCTOR ACCESS
|--------------------------------------------------------------------------
*/

router.use((req, res, next) => {
  if (!req.doctor) {
    return res.status(403).json({
      success: false,
      message: 'Doctor access required',
    });
  }

  next();
});

/*
|--------------------------------------------------------------------------
| CREATE VISIT
|--------------------------------------------------------------------------
*/

router.post('/', doctorWriteAccess, async (req, res, next) => {
  try {
    const {
      patientId,
      visitDate,
      symptoms,
      diagnosis,
      vitals,
      medicines,
      advice,
      followUpDate,
    } = req.body;

    const patient =
      await Patient.findOne({
        _id: patientId,
        doctorId: req.doctor._id,
      });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message:
          'Patient not found',
      });
    }

    const visit =
      await Visit.create({
        doctorId: req.doctor._id,

        patientId:
          patient._id,

        visitDate:
          visitDate || undefined,

        symptoms:
          symptoms || [],

        diagnosis:
          diagnosis || [],

        vitals:
          vitals || {},

        medicines:
          medicines || [],

        advice:
          advice || [],

        followUpDate:
          followUpDate || undefined,
      });

    console.log(
      '✅ Visit created:',
      visit._id.toString()
    );

    res.status(201).json({
      success: true,
      data: visit,
    });
  } catch (error) {
    next(error);
  }
});

/*
|--------------------------------------------------------------------------
| GET VISIT
|--------------------------------------------------------------------------
*/

router.get('/:id', async (req, res, next) => {
  try {
    const visit =
      await Visit.findOne({
        _id: req.params.id,
        doctorId: req.doctor._id,
      }).populate(
        'patientId'
      );

    if (!visit) {
      return res.status(404).json({
        success: false,
        message:
          'Prescription not found',
      });
    }

    res.json({
      success: true,
      data: visit,
    });
  } catch (error) {
    next(error);
  }
});

/*
|--------------------------------------------------------------------------
| UPDATE VISIT
|--------------------------------------------------------------------------
*/

router.put('/:id', doctorWriteAccess, async (req, res, next) => {
  try {
    const allowed = [
      'visitDate',
      'symptoms',
      'diagnosis',
      'vitals',
      'medicines',
      'advice',
      'followUpDate',
    ];

    const data = {};

    allowed.forEach((key) => {
      if (
        req.body[key] !== undefined
      ) {
        data[key] =
          req.body[key];
      }
    });

    const visit =
      await Visit.findOneAndUpdate(
        {
          _id: req.params.id,
          doctorId: req.doctor._id,
        },
        data,
        {
          new: true,
          runValidators: true,
        }
      );

    if (!visit) {
      return res.status(404).json({
        success: false,
        message:
          'Prescription not found',
      });
    }

    res.json({
      success: true,
      data: visit,
    });
  } catch (error) {
    next(error);
  }
});

/*
|--------------------------------------------------------------------------
| DELETE VISIT
|--------------------------------------------------------------------------
*/

router.delete('/:id', doctorWriteAccess, async (req, res, next) => {
  try {
    console.log('');
    console.log(
      '======================================'
    );
    console.log(
      '🗑️ DELETE PRESCRIPTION REQUEST'
    );
    console.log(
      'Visit ID:',
      req.params.id
    );
    console.log(
      'Doctor ID:',
      req.doctor?._id?.toString()
    );
    console.log(
      '======================================'
    );

    const visit =
      await Visit.findOne({
        _id: req.params.id,
        doctorId: req.doctor._id,
      });

    if (!visit) {
      console.log(
        '❌ Prescription not found'
      );

      return res.status(404).json({
        success: false,
        message:
          'Prescription not found or does not belong to this doctor',
      });
    }

    const result =
      await Visit.deleteOne({
        _id: visit._id,
        doctorId: req.doctor._id,
      });

    if (
      result.deletedCount !== 1
    ) {
      console.log(
        '❌ Prescription deletion failed'
      );

      return res.status(500).json({
        success: false,
        message:
          'Prescription could not be deleted',
      });
    }

    console.log(
      '✅ Prescription deleted:',
      req.params.id
    );

    res.json({
      success: true,

      message:
        'Prescription deleted successfully',

      deletedCount:
        result.deletedCount,
    });
  } catch (error) {
    console.error(
      '❌ DELETE PRESCRIPTION ERROR:',
      error
    );

    next(error);
  }
});

module.exports = router;