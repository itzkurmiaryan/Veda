const Notification = require('../models/Notification');

const syncPaymentCycle = async (
  doctor,
  now = new Date()
) => {
  if (!doctor?.nextPaymentDate) {
    return false;
  }

  const dueDate =
    new Date(doctor.nextPaymentDate);

  if (
    Number.isNaN(dueDate.getTime()) ||
    dueDate > now
  ) {
    return false;
  }

  let statusChanged = false;

  if (!doctor.paymentStatus) {
    doctor.paymentStatus = 'pending';
    statusChanged = true;
  }

  if (doctor.paymentStatus === 'paid') {
    doctor.paymentStatus = 'pending';
    doctor.paymentReminderRequested = false;
    doctor.paymentReminderAt = null;
    statusChanged = true;
  }

  if (statusChanged) {
    await doctor.save();
  }

  if (doctor.paymentStatus !== 'pending') {
    return false;
  }

  const cycleKey =
    `${doctor._id.toString()}-${dueDate.getFullYear()}-${dueDate.getMonth() + 1}`;

  try {
    await Notification.findOneAndUpdate(
      {
        type: 'payment_due',
        doctorId: doctor._id,
        cycleKey,
      },
      {
        $setOnInsert: {
          title: 'Monthly Payment Due',
          message:
            'Your monthly Veda payment is due. Please contact the administrator after payment.',
        },
      },
      {
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );
  } catch (error) {
    if (error.code !== 11000) {
      console.error(
        'Payment due notification error:',
        error
      );
    }
  }

  return true;
};

module.exports = syncPaymentCycle;