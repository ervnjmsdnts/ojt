import type { FC } from 'react';

interface EmailTemplateProps {
  coordinatorName: string;
  studentName: string;
  studentClass: string;
  studentRegistrationForm: string;
}

export const EmailTemplate: FC<EmailTemplateProps> = ({
  studentName,
  studentClass,
  studentRegistrationForm,
  coordinatorName,
}) => (
  <div>
    <h3>Hello {coordinatorName}!</h3>
    <p>
      {studentName} from class {studentClass} is requesting that you serve as
      their coordinator.
    </p>
    <img
      src={studentRegistrationForm}
      alt='Coordinator Request'
      style={{ display: 'block', marginTop: '20px' }}
    />
  </div>
);
