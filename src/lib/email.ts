import 'server-only';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.RESEND_FROM_EMAIL ?? 'SchoolSys <noreply@schoolsys.app>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

function isConfigured() {
    return !!resend;
}

export async function sendWelcomeEmail(opts: {
    to: string;
    username: string;
    tempPassword: string;
    schoolName: string;
    schoolSlug: string;
}) {
    if (!isConfigured()) return;
    const loginUrl = `${APP_URL}/login?school=${opts.schoolSlug}`;
    await resend!.emails.send({
        from: FROM,
        to: opts.to,
        subject: `Welcome to ${opts.schoolName} — your account is ready`,
        html: `
<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
  <h2 style="color:#5b21b6">Welcome to ${opts.schoolName}!</h2>
  <p>Your admin has created an account for you on SchoolSys. Here are your login credentials:</p>
  <table style="border-collapse:collapse;margin:16px 0">
    <tr><td style="padding:4px 12px 4px 0;color:#6b7280">Username</td><td style="font-weight:600">${opts.username}</td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#6b7280">Password</td><td style="font-family:monospace;font-weight:600">${opts.tempPassword}</td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#6b7280">School</td><td>${opts.schoolSlug}</td></tr>
  </table>
  <a href="${loginUrl}" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600">Sign In Now</a>
  <p style="color:#9ca3af;font-size:13px;margin-top:24px">Please change your password after first login. This is a temporary password.</p>
</div>`,
    });
}

export async function sendPasswordResetEmail(opts: {
    to: string;
    username: string;
    token: string;
}) {
    if (!isConfigured()) return;
    const resetUrl = `${APP_URL}/login/reset/${opts.token}`;
    await resend!.emails.send({
        from: FROM,
        to: opts.to,
        subject: 'Reset your SchoolSys password',
        html: `
<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
  <h2 style="color:#5b21b6">Password Reset Request</h2>
  <p>Hi <strong>${opts.username}</strong>, we received a request to reset your password.</p>
  <p>Click the button below to set a new password. This link expires in <strong>1 hour</strong>.</p>
  <a href="${resetUrl}" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;margin:16px 0">Reset Password</a>
  <p style="color:#9ca3af;font-size:13px">If you didn't request this, you can safely ignore this email.</p>
</div>`,
    });
}
