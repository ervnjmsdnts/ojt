export type Role = 'student' | 'coordinator' | 'admin';
export type OJTCategory = 'pre-ojt' | 'ojt' | 'post-ojt';
export type OJTStatus = OJTCategory | 'completed';
export type TemplateSubmission = {
  template: {
    templateId: number;
    title: string;
    type: 'form' | 'template';
    formId: string | null;
    formUrl: string | null;
    fileUrl: string | null;
    category: string;
    updatedAt: number | null;
  };
  submissions: {
    submissionId: number;
    submissionOJTId: number;
    submittedFileUrl: string | null;
    submittedGoogleForm: boolean | null;
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
