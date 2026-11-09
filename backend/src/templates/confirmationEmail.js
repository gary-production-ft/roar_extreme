export function renderConfirmationEmail({ fullName, bookingReference, phone, preferredTime, fitnessGoal }) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Your Free Session Pass to Roar Fitness</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #080808; color: #FFFFFF; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background-color: #111111; border: 1px solid #222222; border-top: 4px solid #FF5A1F; padding: 32px; }
    .header { text-align: center; margin-bottom: 24px; }
    .brand { font-size: 28px; font-weight: 900; letter-spacing: 2px; color: #FFFFFF; }
    .brand-accent { color: #FF5A1F; }
    .tagline { color: #A0A0A0; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; margin-top: 4px; }
    .pass-box { background-color: #171717; border: 1px solid #333333; padding: 20px; margin: 24px 0; text-align: center; }
    .ref-label { font-size: 11px; color: #FF5A1F; text-transform: uppercase; letter-spacing: 1.5px; font-family: monospace; }
    .ref-code { font-size: 24px; font-weight: 900; color: #FFFFFF; font-family: monospace; letter-spacing: 2px; margin: 8px 0; }
    .details { font-size: 13px; color: #CCCCCC; line-height: 1.6; margin: 20px 0; }
    .detail-item { margin-bottom: 8px; }
    .detail-label { color: #888888; text-transform: uppercase; font-size: 11px; font-weight: bold; }
    .next-steps { background-color: #0a0a0a; border-left: 3px solid #FF5A1F; padding: 16px; margin: 24px 0; font-size: 13px; color: #BBBBBB; }
    .checklist { list-style: none; padding-left: 0; margin-top: 8px; }
    .checklist li { margin-bottom: 6px; padding-left: 18px; position: relative; }
    .checklist li::before { content: "✓"; position: absolute; left: 0; color: #FF5A1F; font-weight: bold; }
    .location-card { background-color: #171717; padding: 16px; font-size: 12px; color: #AAAAAA; margin-top: 24px; border-top: 1px solid #222222; }
    .footer { text-align: center; font-size: 11px; color: #555555; margin-top: 32px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="brand">ROAR <span class="brand-accent">EXTREME</span></div>
      <div class="tagline">UNLEASH YOUR INNER BEAST • NASHIK</div>
    </div>

    <p style="font-size: 16px; color: #FFFFFF;">Hi <strong>${fullName}</strong>,</p>
    <p style="font-size: 14px; color: #AAAAAA; line-height: 1.6;">
      Welcome to Roar Fitness (Roar Extreme) Nashik. Your application for a complimentary <strong>Free Single Session Pass</strong> has been successfully received.
    </p>

    <div class="pass-box">
      <div class="ref-label">DIGITAL PASS REFERENCE</div>
      <div class="ref-code">${bookingReference}</div>
      <div style="font-size: 11px; color: #777777;">Please show this pass ID upon rooftop arena arrival</div>
    </div>

    <div class="details">
      <div class="detail-item"><span class="detail-label">Registered Mobile:</span> +91 ${phone}</div>
      <div class="detail-item"><span class="detail-label">Preferred Time Slot:</span> ${preferredTime.toUpperCase()}</div>
      <div class="detail-item"><span class="detail-label">Primary Goal:</span> ${fitnessGoal.replace('-', ' ').toUpperCase()}</div>
    </div>

    <div class="next-steps">
      <strong style="color: #FFFFFF; text-transform: uppercase; font-size: 12px;">What Happens Next:</strong>
      <p style="margin: 6px 0 12px 0;">Our head performance coach will contact you directly to confirm your exact training schedule.</p>
      <strong style="color: #FFFFFF; text-transform: uppercase; font-size: 12px;">What To Bring on Day 1:</strong>
      <ul class="checklist">
        <li>Clean change of athletic sports shoes (mandatory for turf and lifting platform hygiene)</li>
        <li>Personal workout towel</li>
        <li>This digital pass / confirmation reference code</li>
      </ul>
    </div>

    <div class="location-card">
      <strong style="color: #FFFFFF;">FACILITY ADDRESS:</strong><br>
      601/602 Rushiraj Regency, Vidya Vikas Circle, above Axis Bank, Patil Colony, Canada Corner, Nashik, Maharashtra 422005.<br><br>
      <strong style="color: #FFFFFF;">OPERATING HOURS:</strong><br>
      Monday through Saturday, 6:00 AM – 10:00 PM
    </div>

    <div class="footer">
      © ${new Date().getFullYear()} ROAR FITNESS NASHIK. All rights reserved.
    </div>
  </div>
</body>
</html>
`;
}

