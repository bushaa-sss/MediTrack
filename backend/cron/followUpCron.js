// Follow-up cron to notify each doctor at 9 AM local time.
const cron = require('node-cron');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const { sendPushToDoctor } = require('../services/notificationService');

const getLocalParts = (date, timeZone) => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  const parts = formatter.formatToParts(date).reduce((acc, part) => {
    acc[part.type] = part.value;
    return acc;
  }, {});

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute)
  };
};

const toDateKey = ({ year, month, day }) =>
  `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

const addDaysKey = (year, month, day, delta) => {
  const utc = new Date(Date.UTC(year, month - 1, day));
  utc.setUTCDate(utc.getUTCDate() + delta);
  return {
    year: utc.getUTCFullYear(),
    month: utc.getUTCMonth() + 1,
    day: utc.getUTCDate()
  };
};

const formatDateKey = (date, timeZone) => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(date);
};

const resolveTimeZone = (timeZone) => {
  try {
    Intl.DateTimeFormat('en-US', { timeZone });
    return timeZone;
  } catch (err) {
    return 'UTC';
  }
};

const scheduleFollowUpCron = () => {
  const timezone = process.env.CRON_TZ || 'UTC';

  // Run frequently, but only send when it's 9 AM in each doctor's timezone.
  cron.schedule(
    '*/15 * * * *',
    async () => {
      try {
        const now = new Date();

        const patients = await Patient.find({
          followUps: { $elemMatch: { notificationSent: false } }
        }).select('doctor name followUps');

        const followUpsByDoctor = new Map();

        patients.forEach((patient) => {
          const doctorKey = patient.doctor.toString();
          if (!followUpsByDoctor.has(doctorKey)) {
            followUpsByDoctor.set(doctorKey, { patients: [] });
          }
          followUpsByDoctor.get(doctorKey).patients.push(patient);
        });

        for (const [doctorId, entry] of followUpsByDoctor.entries()) {
          const doctor = await Doctor.findById(doctorId);
          if (!doctor) continue;

          const doctorTimezone = resolveTimeZone(doctor.timezone || 'UTC');
          const localParts = getLocalParts(now, doctorTimezone);
          if (localParts.hour !== 9) continue;

          const tomorrowParts = addDaysKey(localParts.year, localParts.month, localParts.day, 1);
          const tomorrowKey = toDateKey(tomorrowParts);

          const items = [];
          const patientMap = new Map();

          entry.patients.forEach((patient) => {
            const dueFollowUps = patient.followUps.filter((followUp) => {
              if (!followUp.followUpDate || followUp.notificationSent) return false;
              const followUpKey = formatDateKey(new Date(followUp.followUpDate), doctorTimezone);
              return followUpKey === tomorrowKey;
            });

            if (dueFollowUps.length === 0) return;

            dueFollowUps.forEach((followUp) => {
              items.push({
                patientId: patient._id,
                patientName: patient.name,
                followUpDate: followUp.followUpDate,
                followUpId: followUp._id
              });

              const patientId = patient._id.toString();
              const ids = patientMap.get(patientId) || [];
              ids.push(followUp._id);
              patientMap.set(patientId, ids);
            });
          });

          if (items.length === 0) continue;

          const sorted = items.sort((a, b) => new Date(a.followUpDate) - new Date(b.followUpDate));
          const count = sorted.length;
          const previewList = sorted.slice(0, 5);
          const previewText = previewList
            .map((item) =>
              `${item.patientName} (${new Date(item.followUpDate).toLocaleDateString('en-US', {
                timeZone: doctorTimezone
              })})`
            )
            .join(', ');

          const result = await sendPushToDoctor(doctor, {
            title: 'Follow-ups Tomorrow',
            body: previewText
              ? `You have ${count} follow-ups tomorrow: ${previewText}${count > 5 ? '...' : ''}`
              : `You have ${count} follow-ups tomorrow`,
            data: {
              followUpCount: count,
              followUps: JSON.stringify(
                previewList.map((item) => ({
                  patientId: item.patientId.toString(),
                  patientName: item.patientName,
                  followUpDate: new Date(item.followUpDate).toISOString()
                }))
              )
            }
          });

          if (!result.success) continue;

          for (const [patientId, followUpIds] of patientMap.entries()) {
            await Patient.updateOne(
              { _id: patientId },
              { $set: { 'followUps.$[item].notificationSent': true } },
              { arrayFilters: [{ 'item._id': { $in: followUpIds } }] }
            );
          }
        }
      } catch (err) {
        console.error('Follow-up cron error:', err);
      }
    },
    { timezone }
  );
};

module.exports = scheduleFollowUpCron;
