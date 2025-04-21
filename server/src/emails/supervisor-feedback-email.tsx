import type { FC } from 'react';

interface EmailTemplateProps {
  studentName: string;
  companyName: string;
  accessCode: string;
  feedbackUrl: string;
  supervisorName: string;
}

export const SupervisorFeedbackEmailTemplate: FC<EmailTemplateProps> = ({
  studentName,
  companyName,
  accessCode,
  feedbackUrl,
  supervisorName,
}) => (
  <div>
    <h3>Supervisor Feedback Request - BSU OJT Portal</h3>
    <p>
      Dear {supervisorName} at {companyName},
    </p>
    <p>
      We hope this email finds you well. {studentName} has requested your
      feedback on their on-the-job training performance.
    </p>
    <p>
      Your input is valuable in assessing the student's progress and overall
      performance during their internship.
    </p>
    <p>Please use the following access code to submit your feedback:</p>
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
    <p>You can submit your feedback by visiting this link:</p>
    <a
      href={feedbackUrl}
      style={{
        display: 'inline-block',
        padding: '10px 15px',
        background: '#0056b3',
        color: 'white',
        textDecoration: 'none',
        borderRadius: '4px',
        margin: '10px 0',
      }}>
      Submit Feedback
    </a>
    <p>
      Thank you for your cooperation and for providing this valuable feedback.
    </p>
    <p>Best regards,</p>
    <p>BSU OJT Portal Team</p>
  </div>
);
