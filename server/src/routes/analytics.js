const router = require('express').Router();
const Doctor = require('../models/Doctor');
const DoctorRequest = require('../models/DoctorRequest');
const Patient = require('../models/Patient');
const Visit = require('../models/Visit');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

const startOfDay = date => { const value = new Date(date); value.setHours(0, 0, 0, 0); return value; };
const addDays = (date, days) => { const value = new Date(date); value.setDate(value.getDate() + days); return value; };
const dateKey = date => new Date(date).toISOString().slice(0, 10);
const nextPeriod = (start, unit) => { const value = new Date(start); if (unit === 'day') value.setDate(value.getDate() + 1); if (unit === 'week') value.setDate(value.getDate() + 7); if (unit === 'month') value.setMonth(value.getMonth() + 1); if (unit === 'year') value.setFullYear(value.getFullYear() + 1); return value; };
const rangeCounts = (Model, match, field, starts, unit) => Promise.all(starts.map(async start => ({ date: dateKey(start), count: await Model.countDocuments({ ...match, [field]: { $gte: start, $lt: nextPeriod(start, unit) } }) })));
const analyticsForDoctor = async doctorId => {
  const id = doctorId;
  const doctor = await Doctor.findById(id).select('createdAt').lean();
  const joinedAt = doctor?.createdAt ? startOfDay(doctor.createdAt) : startOfDay(new Date());
  const today = startOfDay(new Date());
  const dailyStarts = Array.from({ length: 7 }, (_, index) => addDays(today, index - 6)).filter(start => start >= joinedAt);
  const weeklyStarts = Array.from({ length: 4 }, (_, index) => addDays(today, (index - 3) * 7)).filter(start => start >= joinedAt);
  const monthlyStarts = Array.from({ length: 12 }, (_, index) => { const value = new Date(today); value.setMonth(value.getMonth() + index - 11); value.setDate(1); return value; }).filter(start => start >= new Date(joinedAt.getFullYear(), joinedAt.getMonth(), 1));
  const yearlyStarts = Array.from({ length: 5 }, (_, index) => new Date(today.getFullYear() + index - 4, 0, 1)).filter(start => start >= new Date(joinedAt.getFullYear(), 0, 1));
  const [totalPatients, totalVisits, newPatientsToday, patientsDaily, visitsDaily] = await Promise.all([
    Patient.countDocuments({ doctorId: id }), Visit.countDocuments({ doctorId: id }), Patient.countDocuments({ doctorId: id, createdAt: { $gte: today, $lt: addDays(today, 1) } }),
    rangeCounts(Patient, { doctorId: id }, 'createdAt', dailyStarts, 'day'), rangeCounts(Visit, { doctorId: id }, 'visitDate', dailyStarts, 'day'),
  ]);
  const [patientsWeekly, visitsWeekly] = await Promise.all([rangeCounts(Patient, { doctorId: id }, 'createdAt', weeklyStarts, 'week'), rangeCounts(Visit, { doctorId: id }, 'visitDate', weeklyStarts, 'week')]);
  const [patientsMonthly, visitsMonthly] = await Promise.all([rangeCounts(Patient, { doctorId: id }, 'createdAt', monthlyStarts, 'month'), rangeCounts(Visit, { doctorId: id }, 'visitDate', monthlyStarts, 'month')]);
  const [patientsYearly, visitsYearly] = await Promise.all([rangeCounts(Patient, { doctorId: id }, 'createdAt', yearlyStarts, 'year'), rangeCounts(Visit, { doctorId: id }, 'visitDate', yearlyStarts, 'year')]);
  return { joinedAt, totalPatients, totalVisits, newPatientsToday, patientsDaily, visitsDaily, patientsWeekly, visitsWeekly, patientsMonthly, visitsMonthly, patientsYearly, visitsYearly, weekly: { patientCount: await Patient.countDocuments({ doctorId: id, createdAt: { $gte: addDays(today, -27), $lt: addDays(today, 1) } }), visitCount: await Visit.countDocuments({ doctorId: id, visitDate: { $gte: addDays(today, -27), $lt: addDays(today, 1) } }) } };
};

router.use(auth);
router.get('/doctor/me', async (req, res, next) => { try { if (!req.doctor) return res.status(403).json({ success: false, message: 'Doctor access required' }); res.json({ success: true, data: await analyticsForDoctor(req.doctor._id) }); } catch (e) { next(e); } });
router.get('/doctors/:id', admin, async (req, res, next) => { try { const doctor = await Doctor.findById(req.params.id).select('-password'); if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' }); res.json({ success: true, doctor, data: await analyticsForDoctor(doctor._id) }); } catch (e) { next(e); } });
router.get('/overview', admin, async (req, res, next) => { try { const [totalDoctors, activeDoctors, inactiveDoctors, pendingRequests, totalPatients, totalVisits] = await Promise.all([Doctor.countDocuments(), Doctor.countDocuments({ active: { $ne: false } }), Doctor.countDocuments({ active: false }), DoctorRequest.countDocuments({ status: 'pending' }), Patient.countDocuments(), Visit.countDocuments()]); res.json({ success: true, data: { totalDoctors, activeDoctors, inactiveDoctors, pendingRequests, totalPatients, totalVisits } }); } catch (e) { next(e); } });
module.exports = router;
