/**
 * Configurable Operating Hours for ROAR EXTREME (Asia/Kolkata Timezone)
 * Can be overridden via environment variables or modified here.
 */
export const businessHoursConfig = {
  timezone: 'Asia/Kolkata',
  // Weekly schedule: dayOfWeek 0 = Sunday, 1 = Monday, ... 6 = Saturday
  schedule: {
    0: { open: false, start: '00:00', end: '00:00', byAppointmentOnly: true }, // Sunday
    1: { open: true, start: '06:00', end: '22:00' }, // Monday
    2: { open: true, start: '06:00', end: '22:00' }, // Tuesday
    3: { open: true, start: '06:00', end: '22:00' }, // Wednesday
    4: { open: true, start: '06:00', end: '22:00' }, // Thursday
    5: { open: true, start: '06:00', end: '22:00' }, // Friday
    6: { open: true, start: '06:00', end: '22:00' }, // Saturday
  },
  allowSundayAccess: process.env.ALLOW_SUNDAY_ACCESS === 'true', // Sunday appointment override
};

/**
 * Helper to get current hour and minute in Asia/Kolkata
 * @param {Date} date
 * @returns {{ dayOfWeek: number, hour: number, minute: number, timeString: string, dateString: string }}
 */
export function getKolkataTime(date = new Date()) {
  // Format into Asia/Kolkata
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    weekday: 'short',
  });

  const parts = formatter.formatToParts(date);
  const partMap = {};
  for (const p of parts) {
    partMap[p.type] = p.value;
  }

  // Determine weekday index (0-6)
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayOfWeek = days.indexOf(partMap.weekday);

  const hour = parseInt(partMap.hour, 10);
  const minute = parseInt(partMap.minute, 10);
  const timeString = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  const dateString = `${partMap.year}-${partMap.month}-${partMap.day}`;

  return { dayOfWeek, hour, minute, timeString, dateString };
}

/**
 * Check if the given date/time is within gym operating hours
 * @param {Date} date
 * @returns {boolean}
 */
export function isWithinOperatingHours(date = new Date()) {
  const { dayOfWeek, timeString } = getKolkataTime(date);
  const daySchedule = businessHoursConfig.schedule[dayOfWeek];

  if (!daySchedule) return false;

  // Sunday
  if (dayOfWeek === 0) {
    if (!businessHoursConfig.allowSundayAccess) {
      return false;
    }
  }

  if (!daySchedule.open && !businessHoursConfig.allowSundayAccess) {
    return false;
  }

  return timeString >= daySchedule.start && timeString <= daySchedule.end;
}
