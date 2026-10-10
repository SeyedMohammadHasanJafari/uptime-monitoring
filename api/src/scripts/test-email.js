import { sendTestEmail } from '../services/email.service.js';

const email = process.argv[2] || 'test@pulseguard.io';

console.log(`\n========================================`);
console.log(`🚀 PulseGuard Telemetry Email Tester`);
console.log(`Sending simulated outage alert to: ${email}`);
console.log(`========================================\n`);

try {
  const result = await sendTestEmail(email);
  if (result.success) {
    console.log('\n✅ EMAIL DISPATCH SUCCESSFUL!');
    if (result.previewUrl) {
      console.log('\n👉 Ethereal Sandbox Web Preview:');
      console.log(`   ${result.previewUrl}`);
      console.log('\n(Click or open the link above in your browser to inspect the full HTML email)\n');
    } else {
      console.log('\n📬 Delivered directly via configured SMTP server!');
    }
  } else {
    console.error('\n❌ EMAIL DISPATCH FAILED:', result.error);
  }
} catch (err) {
  console.error('\n❌ UNEXPECTED ERROR:', err);
}
process.exit(0);
