export function renderAdminNotificationEmail({ fullName, phone, email, preferredTime, fitnessGoal, experienceLevel, bookingReference }) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Lead: Free Session Pass Application</title>
</head>
<body style="font-family: sans-serif; background-color: #111; color: #eee; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #1c1c1c; border-top: 4px solid #FF5A1F; padding: 24px;">
    <h2 style="color: #FF5A1F; margin-top: 0;">NEW LEAD APPLICATION RECEIVED</h2>
    <p>A new customer has applied for a Free Single Session Pass at Roar Extreme:</p>
    <ul>
      <li><strong>Full Name:</strong> ${fullName}</li>
      <li><strong>Mobile:</strong> +91 ${phone}</li>
      <li><strong>Email:</strong> ${email || 'Not provided'}</li>
      <li><strong>Time Slot:</strong> ${preferredTime}</li>
      <li><strong>Goal:</strong> ${fitnessGoal}</li>
      <li><strong>Experience:</strong> ${experienceLevel}</li>
      <li><strong>Reference ID:</strong> <code>${bookingReference}</code></li>
    </ul>
    <p>Log into the <a href="http://localhost:5173/admin/leads" style="color: #FF5A1F;">Admin Dashboard</a> to update lead status and assign coach notes.</p>
  </div>
</body>
</html>
`;
}

