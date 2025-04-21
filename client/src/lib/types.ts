export type Role = 'student' | 'coordinator' | 'admin';
export type OJTCategory = 'pre-ojt' | 'ojt' | 'post-ojt';
export type OJTStatus = OJTCategory | 'completed';
export type TemplateSubmission = {
  template: {
    canStudentView: boolean;
    isEmailToSupervisor: boolean;
    templateId: number;
    title: string;
    fileUrl: string | null;
    category: string;
    updatedAt: number | null;
  };
  submissions: {
    submissionId: number;
    submissionOJTId: number;
    supervisorFeedbackResponseId: number | null;
    appraisalResponseId: number | null;
    submittedFileUrl: string | null;
    submissionRemark: string | null;
    submissionStatus: 'pending' | 'approved' | 'resubmit';
    submissionDate: number | null;
  }[];
};

export type Submissions = {
  pre: TemplateSubmission[] | undefined;
  ojt: TemplateSubmission[] | undefined;
  post: TemplateSubmission[] | undefined;
};

export type Months =
  | 'january'
  | 'february'
  | 'march'
  | 'april'
  | 'may'
  | 'june'
  | 'july'
  | 'august'
  | 'september'
  | 'october'
  | 'november'
  | 'december';
