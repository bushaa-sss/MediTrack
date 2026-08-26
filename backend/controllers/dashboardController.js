// Dashboard summary for doctor/receptionist — real, role-appropriate metrics
// computed from existing collections. Admin has its own dedicated stats
// endpoint (adminController.getStats) since its metrics are clinic-wide by
// nature rather than personal-to-the-requester.
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');

const startOfToday = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

const endOfToday = () => {
  const date = startOfToday();
  date.setDate(date.getDate() + 1);
  return date;
};

const getDoctorSummary = async (req) => {
  const clinic = req.doctor.clinic;
  const doctorId = req.doctor._id;
  const today = startOfToday();
  const tomorrow = endOfToday();

  const [totalPatients, todaysAppointments, upcomingAppointments, patientsWithPendingFollowUps, myPatients] =
    await Promise.all([
      Patient.countDocuments({ clinic }),
      Appointment.countDocuments({ clinic, doctor: doctorId, date: { $gte: today, $lt: tomorrow } }),
      Appointment.countDocuments({
        clinic,
        doctor: doctorId,
        date: { $gte: today },
        status: { $in: ['scheduled', 'confirmed'] }
      }),
      Patient.countDocuments({
        clinic,
        doctor: doctorId,
        followUps: { $elemMatch: { followUpDate: { $gte: today }, notificationSent: false } }
      }),
      Patient.find({ clinic, doctor: doctorId })
        .select('name prescriptions reports')
        .sort({ updatedAt: -1 })
        .limit(20)
    ]);

  // Recent prescriptions/reports are embedded per-patient with no top-level
  // query, so flatten the most-recently-touched patients' entries in memory
  // (bounded to 20 patients above) rather than introducing an aggregation
  // pipeline this codebase doesn't otherwise use.
  const recentPrescriptions = myPatients
    .flatMap((patient) =>
      patient.prescriptions.map((prescription) => ({
        patientName: patient.name,
        diagnosis: prescription.diagnosis,
        createdAt: prescription.createdAt
      }))
    )
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const recentReports = myPatients
    .flatMap((patient) =>
      patient.reports.map((report) => ({
        patientName: patient.name,
        originalName: report.originalName,
        uploadedAt: report.uploadedAt
      }))
    )
    .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
    .slice(0, 5);

  return {
    totalPatients,
    todaysAppointments,
    upcomingAppointments,
    patientsWithPendingFollowUps,
    recentPrescriptions,
    recentReports
  };
};

const getReceptionistSummary = async (req) => {
  const clinic = req.doctor.clinic;
  const today = startOfToday();
  const tomorrow = endOfToday();

  const [
    totalPatients,
    todaysAppointments,
    upcomingAppointments,
    scheduledCount,
    confirmedCount,
    completedCount,
    cancelledCount,
    noShowCount,
    recentPatients
  ] = await Promise.all([
    Patient.countDocuments({ clinic }),
    Appointment.countDocuments({ clinic, date: { $gte: today, $lt: tomorrow } }),
    Appointment.countDocuments({ clinic, date: { $gte: today }, status: { $in: ['scheduled', 'confirmed'] } }),
    Appointment.countDocuments({ clinic, status: 'scheduled' }),
    Appointment.countDocuments({ clinic, status: 'confirmed' }),
    Appointment.countDocuments({ clinic, status: 'completed' }),
    Appointment.countDocuments({ clinic, status: 'cancelled' }),
    Appointment.countDocuments({ clinic, status: 'no_show' }),
    Patient.find({ clinic }).select('name mrNumber createdAt').sort({ createdAt: -1 }).limit(5)
  ]);

  return {
    totalPatients,
    todaysAppointments,
    upcomingAppointments,
    pendingAppointments: scheduledCount,
    appointmentsByStatus: {
      scheduled: scheduledCount,
      confirmed: confirmedCount,
      completed: completedCount,
      cancelled: cancelledCount,
      no_show: noShowCount
    },
    recentPatients
  };
};

const getDashboardSummary = async (req, res, next) => {
  try {
    const summary =
      req.doctor.role === 'receptionist' ? await getReceptionistSummary(req) : await getDoctorSummary(req);

    return res.json({ summary });
  } catch (err) {
    next(err);
  }
};

module.exports = { getDashboardSummary };
