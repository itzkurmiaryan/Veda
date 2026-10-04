require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Admin = require('./models/Admin');
const Doctor = require('./models/Doctor');

const ensurePaymentNotification =
  require('./services/paymentCycle');

const app = express();

/*
|--------------------------------------------------------------------------
| Middleware
|--------------------------------------------------------------------------
*/

app.use(cors());

app.use(
  express.json({
    limit: '2mb',
  })
);

app.use(morgan('dev'));

/*
|--------------------------------------------------------------------------
| Health Check
|--------------------------------------------------------------------------
*/

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Veda API is running',
  });
});

/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
*/

app.use(
  '/api/auth',
  require('./routes/auth')
);

app.use(
  '/api/admin',
  require('./routes/admin')
);

app.use(
  '/api/analytics',
  require('./routes/analytics')
);

app.use(
  '/api/patients',
  require('./routes/patients')
);

app.use(
  '/api/visits',
  require('./routes/visits')
);

/*
|--------------------------------------------------------------------------
| Veda App Version / Update
|--------------------------------------------------------------------------
|
| Public endpoint.
|
| No login/token required.
|
| GET:
| /api/app-version
|
*/

app.use(
  '/api/app-version',
  require('./routes/appVersion')
);

/*
|--------------------------------------------------------------------------
| Error Handler
|--------------------------------------------------------------------------
*/

app.use(
  (err, req, res, next) => {
    console.error(
      'SERVER ERROR:',
      err
    );

    res.status(
      err.status || 500
    ).json({
      success: false,

      message:
        err.message ||
        'Server error',
    });
  }
);

/*
|--------------------------------------------------------------------------
| Start Server
|--------------------------------------------------------------------------
*/

const port =
  process.env.PORT || 5000;

/*
|--------------------------------------------------------------------------
| Payment Notification Sync
|--------------------------------------------------------------------------
*/

const syncDuePayments = async () => {
  try {
    const doctors =
      await Doctor.find({
        nextPaymentDate: {
          $lte: new Date(),
        },
      });

    await Promise.all(
      doctors.map((doctor) =>
        ensurePaymentNotification(doctor)
      )
    );
  } catch (error) {
    console.error(
      'Monthly payment sync failed:',
      error
    );
  }
};

/*
|--------------------------------------------------------------------------
| Server Logs
|--------------------------------------------------------------------------
*/

console.log(
  '--------------------------------'
);

console.log(
  'Starting Veda server...'
);

console.log(
  'PORT:',
  port
);

console.log(
  'MongoDB URI loaded:',
  !!process.env.MONGO_URI
);

console.log(
  'JWT Secret loaded:',
  !!process.env.JWT_SECRET
);

console.log(
  '--------------------------------'
);

/*
|--------------------------------------------------------------------------
| MongoDB Connection
|--------------------------------------------------------------------------
*/

mongoose
  .connect(
    process.env.MONGO_URI
  )

  .then(async () => {
    console.log(
      '✅ MongoDB connected successfully'
    );

    /*
    |--------------------------------------------------------------------------
    | Payment Sync
    |--------------------------------------------------------------------------
    */

    syncDuePayments();

    const paymentSyncInterval =
      setInterval(
        syncDuePayments,
        60 * 60 * 1000
      );

    paymentSyncInterval.unref();

    /*
    |--------------------------------------------------------------------------
    | Admin Setup
    |--------------------------------------------------------------------------
    */

    try {
      const email =
        (
          process.env.ADMIN_EMAIL ||
          ''
        ).toLowerCase();

      const existing =
        await Admin.findOne({
          email,
        });

      if (
        !existing &&
        process.env.ADMIN_EMAIL &&
        process.env.ADMIN_PASSWORD
      ) {
        await Admin.create({
          name:
            process.env.ADMIN_NAME ||
            'Administrator',

          email:
            process.env.ADMIN_EMAIL,

          password:
            await bcrypt.hash(
              process.env.ADMIN_PASSWORD,
              12
            ),
        });

        console.log(
          '✅ Admin account created'
        );
      }
    } catch (error) {
      console.error(
        '❌ Admin setup error:',
        error
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Start Express Server
    |--------------------------------------------------------------------------
    */

    app.listen(
      port,
      () => {
        console.log(
          `🚀 Veda API running on ${port}`
        );

        console.log(
          `📱 Version API: /api/app-version`
        );
      }
    );
  })

  .catch((error) => {
    console.error(
      '❌ MongoDB connection failed'
    );

    console.error(error);

    process.exit(1);
  });