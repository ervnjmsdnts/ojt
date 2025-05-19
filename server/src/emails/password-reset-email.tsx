import type { FC } from 'react';

interface EmailTemplateProps {
  fullName: string;
  resetUrl: string;
}

export const PasswordResetEmailTemplate: FC<EmailTemplateProps> = ({
  fullName,
  resetUrl,
}) => (
  <div>
    <h3>Password Reset Request - BSU OJT Portal</h3>
    <p>Dear {fullName},</p>
    <p>
      We received a request to reset your password for your BSU OJT Portal
      account.
    </p>
    <p>To reset your password, please click the button below:</p>
    <a
      href={resetUrl}
      style={{
        display: 'inline-block',
        padding: '10px 15px',
        background: '#0056b3',
        color: 'white',
        textDecoration: 'none',
        borderRadius: '4px',
        margin: '10px 0',
      }}>
      Reset Password
    </a>
    <p>This link will expire in 1 hour for security reasons.</p>
    <p>
      If you did not request a password reset, please ignore this email or
      contact support if you have concerns.
    </p>
    <p>Best regards,</p>
    <p>BSU OJT Portal Team</p>
  </div>
);
