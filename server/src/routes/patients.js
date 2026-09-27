const router = require('express').Router();

const Patient = require('../models/Patient');
const Visit = require('../models/Visit');

const auth = require('../middleware/auth');

router.use(auth);

/*
|--------------------------------------------------------------------------
| DOCTOR ACCESS CHECK
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
| Generate Patient ID
|--------------------------------------------------------------------------
*/

const generatePatientId = () => {
  return `RX-${new Date().getFullYear()}-${Date.now()
    .toString()
    .slice(-6)}`;
};

/*
|--------------------------------------------------------------------------
| CREATE PATIENT
|--------------------------------------------------------------------------
*/

router.post('/', async (req, res, next) => {
  try {
    const {
      name,
      mobile,
      age,
      gender,
      address,
    } = req.body;

    if (
      !name ||
      age === undefined ||
      !gender
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Name, age and gender are required',
      });
    }

    const patient =
      await Patient.create({
        doctorId: req.doctor._id,

        patientId:
          generatePatientId(),

        name: name.trim(),

        mobile: mobile || '',

        age,

        gender,

        address: address || '',
      });

    console.log(
      '✅ Patient created:',
      patient._id.toString()
    );

    res.status(201).json({
      success: true,
      data: patient,
    });
  } catch (error) {
    next(error);
  }
});

/*
|--------------------------------------------------------------------------
| GET ALL PATIENTS
|--------------------------------------------------------------------------
*/

router.get('/', async (req, res, next) => {
  try {
    const {
      q = '',
      gender,
      disease,
    } = req.query;

    const filter = {
      doctorId: req.doctor._id,
    };

    if (
      gender &&
      gender !== 'All'
    ) {
      filter.gender = gender;
    }

    if (q.trim()) {
      filter.$or = [
        {
          name: {
            $regex: q.trim(),
            $options: 'i',
          },
        },
        {
          mobile: {
            $regex: q.trim(),
            $options: 'i',
          },
        },
        {
          patientId: {
            $regex: q.trim(),
            $options: 'i',
          },
        },
      ];
    }

    let patients =
      await Patient.find(filter)
        .sort({
          updatedAt: -1,
        })
        .limit(50)
        .lean();

    if (
      disease &&
      disease.trim()
    ) {
      const patientIds =
        await Visit.find({
          doctorId: req.doctor._id,

          diagnosis: {
            $regex: disease.trim(),
            $options: 'i',
          },
        }).distinct('patientId');

      patients =
        patients.filter(
          (patient) =>
            patientIds.some(
              (id) =>
                String(id) ===
                String(patient._id)
            )
        );
    }

    res.json({
      success: true,
      data: patients,
    });
  } catch (error) {
    next(error);
  }
});

/*
|--------------------------------------------------------------------------
| GET SINGLE PATIENT
|--------------------------------------------------------------------------
*/

router.get('/:id', async (req, res, next) => {
  try {
    console.log(
      '➡️ GET PATIENT:',
      req.params.id
    );

    const patient =
      await Patient.findOne({
        _id: req.params.id,
        doctorId: req.doctor._id,
      });

    if (!patient) {
      console.log(
        '❌ Patient not found:',
        req.params.id
      );

      return res.status(404).json({
        success: false,
        message:
          'Patient not found or does not belong to this doctor',
      });
    }

    const visits =
      await Visit.find({
        patientId: patient._id,
        doctorId: req.doctor._id,
      }).sort({
        visitDate: -1,
      });

    res.json({
      success: true,

      data: {
        patient,
        visits,
      },
    });
  } catch (error) {
    next(error);
  }
});

/*
|--------------------------------------------------------------------------
| DELETE PATIENT
|--------------------------------------------------------------------------
*/

router.delete('/:id', async (req, res, next) => {
  try {
    console.log('');
    console.log(
      '======================================'
    );
    console.log(
      '🗑️ DELETE PATIENT REQUEST'
    );
    console.log(
      'Patient ID:',
      req.params.id
    );
    console.log(
      'Doctor ID:',
      req.doctor?._id?.toString()
    );
    console.log(
      '======================================'
    );

    /*
    |--------------------------------------------------------------------------
    | Find patient belonging to logged-in doctor
    |--------------------------------------------------------------------------
    */

    const patient =
      await Patient.findOne({
        _id: req.params.id,
        doctorId: req.doctor._id,
      });

    if (!patient) {
      console.log(
        '❌ Patient not found or ownership mismatch'
      );

      return res.status(404).json({
        success: false,
        message:
          'Patient not found or does not belong to this doctor',
      });
    }

    console.log(
      '✅ Patient found:',
      patient.name
    );

    /*
    |--------------------------------------------------------------------------
    | Delete prescriptions
    |--------------------------------------------------------------------------
    */

    const visitsResult =
      await Visit.deleteMany({
        patientId: patient._id,
        doctorId: req.doctor._id,
      });

    console.log(
      '🧾 Prescriptions deleted:',
      visitsResult.deletedCount
    );

    /*
    |--------------------------------------------------------------------------
    | Delete patient
    |--------------------------------------------------------------------------
    */

    const patientResult =
      await Patient.deleteOne({
        _id: patient._id,
        doctorId: req.doctor._id,
      });

    console.log(
      '👤 Patients deleted:',
      patientResult.deletedCount
    );

    /*
    |--------------------------------------------------------------------------
    | Verify deletion
    |--------------------------------------------------------------------------
    */

    if (
      patientResult.deletedCount !== 1
    ) {
      console.log(
        '❌ Patient deletion failed'
      );

      return res.status(500).json({
        success: false,
        message:
          'Patient could not be deleted',
      });
    }

    console.log(
      '✅ PATIENT DELETE SUCCESS'
    );

    res.json({
      success: true,

      message:
        'Patient and all prescriptions deleted successfully',

      deletedPatient:
        patientResult.deletedCount,

      deletedPrescriptions:
        visitsResult.deletedCount,
    });
  } catch (error) {
    console.error(
      '❌ DELETE PATIENT ERROR:',
      error
    );

    next(error);
  }
});

module.exports = router;