export type Role = 'student' | 'coordinator' | 'admin';
export type OJTCategory = 'pre-ojt' | 'ojt' | 'post-ojt';
export type OJTStatus = OJTCategory | 'completed';
export type TemplateSubmission = {
  template: {
    templateId: number;
    title: string;
    fileUrl: string;
    category: string;
    updatedAt: number | null;
  };
  submissions: {
    submissionId: number;
    submittedFileUrl: string;
    submissionDate: number | null;
  }[];
};
