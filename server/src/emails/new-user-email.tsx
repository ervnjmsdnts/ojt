import type { FC } from 'react';

interface EmailTemplateProps {
  fullName: string;
  srCode: string;
  email: string;
  password: string;
}

export const NewUserEmailTemplate: FC<EmailTemplateProps> = ({
  fullName,
  srCode,
  email,
  password,
}) => (
  <div>
    <h3>Welcome to BSU OJT Portal, {fullName}!</h3>
    <p>Your account has been created successfully.</p>
    <p>Here are your account details:</p>
    <ul>
      <li>ID: {srCode}</li>
      <li>Email: {email}</li>
      <li>Password: {password}</li>
    </ul>
    <p>Please change your password upon your first login for security purposes.</p>
    <p>Best regards,</p>
    <p>BSU OJT Portal Team</p>
  </div>
); 