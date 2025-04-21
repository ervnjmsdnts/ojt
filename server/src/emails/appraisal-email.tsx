import type { FC } from 'react';

interface EmailTemplateProps {
  studentName: string;
  companyName: string;
  accessCode: string;
  appraisalUrl: string;
  supervisorName: string;
}

export const AppraisalEmailTemplate: FC<EmailTemplateProps> = ({
  studentName,
  companyName,
  accessCode,
  appraisalUrl,
  supervisorName,
}) => (
  <div>
    <h3>Student Appraisal Request - BSU OJT Portal</h3>
    <p>
      Dear {supervisorName} at {companyName},
    </p>
    <p>
      We hope this email finds you well. {studentName} has requested you to
      complete an appraisal of their on-the-job training performance.
    </p>
    <p>
      Your assessment is crucial for evaluating the student's skills, work
      ethic, and overall performance during their internship period.
    </p>
    <p>Please use the following access code to submit your appraisal:</p>
    <div
      style={{
        padding: '10px',
        background: '#f5f5f5',
        border: '1px solid #ddd',
        borderRadius: '4px',
        margin: '15px 0',
        textAlign: 'center',
        fontSize: '20px',
        fontWeight: 'bold',
      }}>
      {accessCode}
    </div>
    <p>You can complete the appraisal by visiting this link:</p>
    <a
      href={appraisalUrl}
      style={{
        display: 'inline-block',
        padding: '10px 15px',
        background: '#0056b3',
        color: 'white',
        textDecoration: 'none',
        borderRadius: '4px',
        margin: '10px 0',
      }}>
      Complete Appraisal
    </a>
    <p>
      Thank you for your time and for providing this important evaluation of our
      student.
    </p>
    <p>Best regards,</p>
    <p>BSU OJT Portal Team</p>
  </div>
);
