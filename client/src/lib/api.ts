import { hc } from 'hono/client';
import type { ApiRoutes } from '@server/app';
import { queryOptions } from '@tanstack/react-query';
import { OJTCategory, OJTStatus, Role } from './types';
import { ParsedFormValue } from 'hono/types';

const client = hc<ApiRoutes>('/');

export const api = client.api;

async function getCurrentUser() {
  const res = await api.user.profile.$get();
  if (!res.ok) {
    throw new Error('server error');
  }
  const data = await res.json();
  return data;
}

export const userQueryOptions = queryOptions({
  queryKey: ['get-current-user'],
  queryFn: getCurrentUser,
  staleTime: Infinity,
});

export const userOJTOptions = queryOptions({
  queryKey: ['student-ojt'],
  queryFn: getCurrentOJT,
  staleTime: Infinity,
});

export const ojtQueryOptions = queryOptions({
  queryKey: ['get-current-ojt'],
  queryFn: getCurrentUser,
  staleTime: Infinity,
});

export async function getUsers() {
  const res = await api.user.$get();
  if (!res.ok) {
    throw new Error('server error');
  }
  const data = await res.json();
  return data;
}

export type UpdateRole = {
  role: Role;
  userId: number;
};

export async function updateUserRole(data: UpdateRole) {
  const res = await api.user[':id'].role.$patch({
    json: { role: data.role },
    param: { id: data.userId.toString() },
  });
  if (!res.ok) {
    throw new Error('server error');
  }
  const json = await res.json();
  return json;
}

export async function getCompaniesWithCount() {
  const res = await api.company.$get();
  if (!res.ok) {
    throw new Error('Server error');
  }

  const data = await res.json();
  return data;
}

export async function getTemplates() {
  const res = await api.template.$get();
  if (!res.ok) {
    throw new Error('server error');
  }
  const data = await res.json();
  return data;
}

export async function updateTemplateFile({
  templateId,
  file,
}: {
  templateId: number;
  file: File;
}) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`/api/template/${templateId}/file`, {
    method: 'PATCH',
    body: formData,
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error('Failed to update template file');
  }

  return res;
}

export type UpdateTemplateCategory = {
  category: OJTCategory;
  templateId: number;
};

export async function updateTemplateCategory(data: UpdateTemplateCategory) {
  const res = await api.template[':id'].category.$patch({
    json: { category: data.category },
    param: { id: data.templateId.toString() },
  });
  if (!res.ok) {
    throw new Error('server error');
  }
  const json = await res.json();
  return json;
}

export type UpdateTemplateTitle = {
  title: string;
  templateId: number;
};

export async function updateTemplateTitle(data: UpdateTemplateTitle) {
  const res = await api.template[':id'].title.$patch({
    json: { title: data.title },
    param: { id: data.templateId.toString() },
  });
  if (!res.ok) {
    throw new Error('server error');
  }
  const json = await res.json();
  return json;
}

export type UpdateCompanyName = {
  name: string;
  companyId: number;
};

export async function updateCompanyName(data: UpdateCompanyName) {
  const res = await api.company[':id'].name.$patch({
    json: { name: data.name },
    param: { id: data.companyId.toString() },
  });
  if (!res.ok) {
    throw new Error('server error');
  }

  const json = await res.json();
  return json;
}

export type UpdateCompanyAddress = {
  address: string;
  companyId: number;
};

export async function updateCompanyAddress(data: UpdateCompanyAddress) {
  const res = await api.company[':id'].address.$patch({
    json: { address: data.address },
    param: { id: data.companyId.toString() },
  });

  if (!res.ok) {
    throw new Error('server error');
  }

  const json = await res.json();
  return json;
}

export type UpdateSubmissionRemark = {
  remark: string;
  submissionId: number;
};

export async function updateSubmissionRemark(data: UpdateSubmissionRemark) {
  const res = await api.student.submission[':id'].remark.$patch({
    json: { remark: data.remark },
    param: { id: data.submissionId.toString() },
  });

  if (!res.ok) {
    throw new Error('Server error');
  }

  const json = await res.json();
  return json;
}

export type UpdateSubmissionStatus = {
  status: 'pending' | 'approved' | 'resubmit';
  submissionId: number;
};

export async function updateSubmissionStatus(data: UpdateSubmissionStatus) {
  const res = await api.student.submission[':id'].status.$patch({
    json: { status: data.status },
    param: { id: data.submissionId.toString() },
  });

  if (!res.ok) {
    throw new Error('Server error');
  }

  const json = await res.json();
  return json;
}

export type FileSubmission = {
  templateId: number;
  file: File;
};

export async function fileSubmission(data: FileSubmission) {
  const res = await api.student.submission.$post({
    form: {
      templateId: data.templateId as unknown as ParsedFormValue,
      file: data.file,
    },
  });

  if (!res.ok) {
    throw new Error('Server error');
  }

  const json = await res.json();
  return json;
}

export type UpdateUserFullName = {
  name: string;
  userId: number;
};

export async function updateUserFullName(data: UpdateUserFullName) {
  const res = await api.user[':id'].name.$patch({
    json: { fullName: data.name },
    param: { id: data.userId.toString() },
  });

  if (!res.ok) {
    throw new Error('Server error');
  }

  const json = await res.json();
  return json;
}

export async function getOJTsAdmin() {
  const res = await api.student.$get();
  if (!res.ok) {
    throw new Error('server error');
  }

  const json = await res.json();
  return json;
}

export async function getSingleOJTAdmin(data: { id: string }) {
  const res = await api.student[':id'].$get({ param: { id: data.id } });

  if (!res.ok) {
    throw new Error('server error');
  }

  const json = await res.json();
  return json;
}

export type UpdateOJTStatus = {
  status: OJTStatus;
  ojtId: number;
};

export async function updateOJTStatus(data: UpdateOJTStatus) {
  const res = await api.student[':id'].status.$patch({
    json: { status: data.status },
    param: { id: data.ojtId.toString() },
  });
  if (!res.ok) {
    throw new Error('server error');
  }

  const json = await res.json();
  return json;
}

export async function getDepartments() {
  const res = await api.department.$get();

  if (!res.ok) {
    throw new Error('server error');
  }

  const json = await res.json();
  return json;
}

export type UpdateDepartmentName = {
  name: string;
  departmentId: number;
};

export async function updateDepartmentName(data: UpdateDepartmentName) {
  const res = await api.department[':id'].name.$patch({
    json: { name: data.name },
    param: { id: data.departmentId.toString() },
  });
  if (!res.ok) {
    throw new Error('server error');
  }

  const json = await res.json();
  return json;
}

export async function getPrograms() {
  const res = await api.program.$get();

  if (!res.ok) {
    throw new Error('server error');
  }

  const json = await res.json();
  return json;
}

type UpdateProgramName = {
  name: string;
  programId: number;
};

export async function updateProgramName(data: UpdateProgramName) {
  const res = await api.program[':id'].name.$patch({
    json: { name: data.name },
    param: { id: data.programId.toString() },
  });
  if (!res.ok) {
    throw new Error('server error');
  }

  const json = await res.json();
  return json;
}

export async function getClasses() {
  const res = await api.class.$get();

  if (!res.ok) {
    throw new Error('server error');
  }

  const json = await res.json();
  return json;
}

export type UpdateClassProgram = {
  classId: number;
  programId: number;
};

export async function updateClassProgram(data: UpdateClassProgram) {
  const res = await api.class[':id'].program.$patch({
    json: { programId: data.programId },
    param: { id: data.classId.toString() },
  });
  if (!res.ok) {
    throw new Error('server error');
  }
  const json = await res.json();
  return json;
}

export type UpdateClassDepartment = {
  classId: number;
  departmentId: number;
};

export async function updateClassDepartment(data: UpdateClassDepartment) {
  const res = await api.class[':id'].department.$patch({
    json: { departmentId: data.departmentId },
    param: { id: data.classId.toString() },
  });
  if (!res.ok) {
    throw new Error('server error');
  }
  const json = await res.json();
  return json;
}

export type UpdateClassName = {
  classId: number;
  name: string;
};

export async function updateClassName(data: UpdateClassName) {
  const res = await api.class[':id'].name.$patch({
    json: { name: data.name },
    param: { id: data.classId.toString() },
  });
  if (!res.ok) {
    throw new Error('server error');
  }
  const json = await res.json();
  return json;
}

export async function getCurrentOJT() {
  const res = await api.student['student-current'].$get();

  if (!res.ok) {
    throw new Error('server error');
  }

  const json = await res.json();
  return json;
}

export async function getCoordinators() {
  const res = await api.coordinator.$get();

  if (!res.ok) {
    throw new Error('server error');
  }

  const json = await res.json();
  return json;
}

export async function getOJTsCoordinator() {
  const res = await api.coordinator.ojt.$get();
  if (!res.ok) {
    throw new Error('server error');
  }

  const json = await res.json();
  return json;
}

export async function requestForCoordinator(data: { coordinatorId: number }) {
  const res = await api.request.$post({ json: data });

  if (!res.ok) {
    throw new Error('server error');
  }

  const json = await res.json();
  return json;
}

export async function getCoordinatorRequests() {
  const res = await api.request.$get();

  if (!res.ok) {
    throw new Error('server error');
  }

  const json = await res.json();
  return json;
}

export async function approveRequest(data: { requestId: number }) {
  const res = await api.request.approve.$post({ json: data });

  if (!res.ok) {
    throw new Error('server error');
  }

  const json = await res.json();
  return json;
}

export async function rejectRequest(data: { requestId: number }) {
  const res = await api.request.reject.$post({ json: data });

  if (!res.ok) {
    throw new Error('server error');
  }

  const json = await res.json();
  return json;
}

export async function assignCompany(data: {
  companyId: number;
  supervisorEmail: string;
  supervisorName: string;
  supervisorContactNumber: string;
  supervisorAddress: string;
  totalOJTHours: number;
}) {
  const res = await api.company.assign.$post({ json: data });

  if (!res.ok) {
    throw new Error('server error');
  }

  const json = await res.json();
  return json;
}

export async function getReports() {
  const res = await api.reports.$get();

  if (!res.ok) {
    throw new Error('server error');
  }

  const json = await res.json();
  return json;
}

type CreateReport = {
  date: Date;
  accomplishments: string;
  workingHours: number;
};

export async function createReport(data: CreateReport) {
  const res = await api.reports.$post({ json: data });

  if (!res.ok) {
    throw new Error('server error');
  }

  const json = await res.json();
  return json;
}

export async function getAdminDashboard() {
  const res = await api.dashboards.admin.$get();

  if (!res.ok) {
    throw new Error('server error');
  }

  const json = await res.json();
  return json;
}

export async function getCoordinatorDashboard() {
  const res = await api.dashboards.coordinator.$get();

  if (!res.ok) {
    throw new Error('server error');
  }

  const json = await res.json();
  return json;
}

export async function createLink(data: { url: string; name: string }) {
  const res = await api.links.$post({ json: data });

  if (!res.ok) {
    throw new Error('server error');
  }

  const json = await res.json();
  return json;
}

export async function getStudentDashboard() {
  const res = await api.dashboards.student.$get();

  if (!res.ok) {
    throw new Error('server error');
  }

  const json = await res.json();
  return json;
}

export async function createGlobalNotification(data: { message: string }) {
  const res = await api.notification.global.$post({
    json: data,
  });

  if (!res.ok) {
    throw new Error('Server error');
  }

  const json = await res.json();
  return json;
}

export async function createStudentNotification(data: {
  message: string;
  targetStudentIds: number[];
}) {
  const res = await api.notification.student.$post({
    json: data,
  });

  if (!res.ok) {
    throw new Error('Server error');
  }

  const json = await res.json();
  return json;
}

export async function updateCompanyFile(data: {
  companyId: number;
  file: File;
}) {
  const res = await api.company[':id'].memorandum.$patch({
    form: {
      memorandum: data.file,
    },
    param: { id: data.companyId.toString() },
  });

  if (!res.ok) {
    throw new Error('server error');
  }

  const json = await res.json();
  return json;
}

export async function getStudentFeedbackTemplates() {
  const res = await api['student-feedback'].$get();
  if (!res.ok) {
    throw new Error('server error');
  }

  const json = await res.json();
  return json;
}

export async function createStudentFeedbackTemplate() {
  const res = await api['student-feedback'].$post();

  if (!res.ok) {
    throw new Error('server error');
  }

  const json = await res.json();
  return json;
}

export async function updateStudentFeedbackQuestions(data: {
  templateId: number;
  questions: string[];
}) {
  const res = await api['student-feedback'][':id'].questions.$patch({
    json: { questions: data.questions },
    param: { id: data.templateId.toString() },
  });

  if (!res.ok) {
    throw new Error('server error');
  }

  const json = await res.json();
  return json;
}

export async function studentFeedbackResponse(data: {
  templateId: number;
  signature: File;
  feedback: Record<string, string>;
  problemsMet?: string;
  otherConcerns?: string;
}) {
  try {
    const formData = new FormData();

    // Add signature file
    formData.append('signature', data.signature);

    // Create a single JSON object with all the non-file data
    const jsonData = {
      templateId: data.templateId,
      feedback: data.feedback,
      problemsMet: data.problemsMet,
      otherConcerns: data.otherConcerns,
    };

    formData.append('data', JSON.stringify(jsonData));

    const res = await fetch(`/api/student-feedback/response`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Server error response:', errorText);
      throw new Error(`Server error: ${errorText}`);
    }

    const json = await res.json();
    return json;
  } catch (error) {
    console.error('Error in studentFeedbackResponse:', error);
    throw error;
  }
}

export async function getStudentOJTFeedbackResponses() {
  const res = await api['student-feedback'].response.ojt.$get();
  if (!res.ok) {
    throw new Error('server error');
  }

  const json = await res.json();
  return json;
}

export async function getSupervisorFeedbackResponses(data: { ojtId: number }) {
  const res = await api['supervisor-feedback'].response.ojt[':ojtId'].$get({
    param: { ojtId: data.ojtId.toString() },
  });
  if (!res.ok) {
    throw new Error('server error');
  }

  const json = await res.json();
  return json;
}

export async function sendSupervisorFeedbackEmail(data: { email: string }) {
  const res = await api['supervisor-feedback'].email.$post({ json: data });

  if (!res.ok) {
    throw new Error('server error');
  }

  const json = await res.json();
  return json;
}

export async function verifySupervisorAccessCode(code: string) {
  const res = await api['supervisor-feedback'].verify.$post({ json: { code } });

  if (!res.ok) {
    throw new Error('server error');
  }

  const json = await res.json();
  return json;
}

export async function createSupervisorFeedbackTemplate(data: {
  studentSubmissionTemplateId: number;
}) {
  const res = await api['supervisor-feedback'].$post({ json: data });
  if (!res.ok) {
    throw new Error('server error');
  }
  const json = await res.json();
  return json;
}

export async function getSupervisorFeedbackTemplates() {
  const res = await api['supervisor-feedback'].$get();
  if (!res.ok) {
    throw new Error('server error');
  }

  const json = await res.json();
  return json;
}

export async function checkSupervisorFeedbackEmail() {
  const res = await api['supervisor-feedback'].email.check.$get();

  if (!res.ok) {
    throw new Error('server error');
  }

  const json = await res.json();
  return json;
}

export async function supervisorFeedbackResponse(data: {
  templateId: number;
  signature: File;
  ojtId: number;
  feedback: Record<string, string>;
  otherCommentsAndSuggestions?: string;
}) {
  try {
    const formData = new FormData();

    // Add signature file
    formData.append('signature', data.signature);
    formData.append('ojtId', data.ojtId.toString());

    // Create a single JSON object with all the non-file data
    const jsonData = {
      templateId: data.templateId,
      feedback: data.feedback,
      otherCommentsAndSuggestions: data.otherCommentsAndSuggestions,
    };

    formData.append('data', JSON.stringify(jsonData));

    const res = await fetch(`/api/supervisor-feedback/response`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Server error response:', errorText);
      throw new Error(`Server error: ${errorText}`);
    }

    const json = await res.json();
    return json;
  } catch (error) {
    console.error('Error in supervisorFeedbackResponse:', error);
    throw error;
  }
}

export async function getAppraisalTemplates() {
  const res = await api.appraisal.$get();
  if (!res.ok) {
    throw new Error('server error');
  }
  const data = await res.json();
  return data;
}

export async function createAppraisalTemplate(data: {
  formTemplateId: number;
}) {
  const res = await api.appraisal.$post({ json: data });
  if (!res.ok) {
    throw new Error('server error');
  }
  const json = await res.json();
  return json;
}

export async function updateAppraisalCategories(data: {
  templateId: number;
  categories: Array<{
    id?: number;
    name: string;
    displayOrder: number;
  }>;
}) {
  const res = await api.appraisal[':id'].categories.$patch({
    json: { categories: data.categories },
    param: { id: data.templateId.toString() },
  });

  if (!res.ok) {
    throw new Error('server error');
  }

  const json = await res.json();
  return json;
}

export async function updateAppraisalQuestions(data: {
  categoryId: number;
  questions: string[];
}) {
  const res = await api.appraisal.category[':categoryId'].questions.$patch({
    json: { questions: data.questions },
    param: { categoryId: data.categoryId.toString() },
  });

  if (!res.ok) {
    throw new Error('server error');
  }

  const json = await res.json();
  return json;
}

export async function getAppraisalResponses(data: { ojtId: number }) {
  const res = await api.appraisal.response.ojt[':ojtId'].$get({
    param: { ojtId: data.ojtId.toString() },
  });
  if (!res.ok) {
    throw new Error('server error');
  }

  const json = await res.json();
  return json;
}

export async function sendAppraisalEmail(data: { email: string }) {
  const res = await api.appraisal.email.$post({ json: data });

  if (!res.ok) {
    throw new Error('server error');
  }

  const json = await res.json();
  return json;
}

export async function verifyAppraisalAccessCode(code: string) {
  const res = await api.appraisal.verify.$post({ json: { code } });

  if (!res.ok) {
    throw new Error('server error');
  }

  const json = await res.json();
  return json;
}

export async function checkAppraisalEmail() {
  const res = await api.appraisal.email.check.$get();

  if (!res.ok) {
    throw new Error('server error');
  }

  const json = await res.json();
  return json;
}

export async function appraisalResponse(data: {
  templateId: number;
  signature: File;
  ojtId: number;
  ratings: Record<string, number>;
  comments?: string;
}) {
  try {
    const formData = new FormData();

    // Add signature file
    formData.append('signature', data.signature);
    formData.append('ojtId', data.ojtId.toString());

    // Create a single JSON object with all the non-file data
    const jsonData = {
      templateId: data.templateId,
      ratings: data.ratings,
      comments: data.comments,
    };

    formData.append('data', JSON.stringify(jsonData));

    const res = await fetch(`/api/appraisal/response`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Server error response:', errorText);
      throw new Error(`Server error: ${errorText}`);
    }

    const json = await res.json();
    return json;
  } catch (error) {
    console.error('Error in appraisalResponse:', error);
    throw error;
  }
}

export async function getAppraisalTemplate(id: number) {
  const res = await api.appraisal[':id'].$get({
    param: { id: id.toString() },
  });

  if (!res.ok) {
    throw new Error('server error');
  }

  const json = await res.json();
  return json;
}

export async function submitAppraisalResponse(data: {
  templateId: number;
  signature: File;
  ojtId: number;
  ratings: Record<string, number>;
  comments?: string;
}) {
  try {
    const formData = new FormData();

    // Add signature file
    formData.append('signature', data.signature);
    formData.append('ojtId', data.ojtId.toString());

    // Create a single JSON object with all the non-file data
    const jsonData = {
      templateId: data.templateId,
      ratings: data.ratings,
      comments: data.comments,
    };

    formData.append('data', JSON.stringify(jsonData));

    const res = await fetch(`/api/appraisal/response`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Server error response:', errorText);
      throw new Error(`Server error: ${errorText}`);
    }

    const json = await res.json();
    return json;
  } catch (error) {
    console.error('Error in submitAppraisalResponse:', error);
    throw error;
  }
}

export async function getAllFeedbackResponses(filters?: {
  departmentId?: number;
  programId?: number;
}) {
  try {
    // Build URL with query parameters
    let url = '/api/student-feedback/response/all';
    if (filters) {
      const params = new URLSearchParams();
      if (filters.departmentId) {
        params.append('departmentId', filters.departmentId.toString());
      }
      if (filters.programId) {
        params.append('programId', filters.programId.toString());
      }
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
    }

    // Fetch student feedback responses with filters
    const studentRes = await fetch(url, {
      method: 'GET',
      credentials: 'include',
    });

    if (!studentRes.ok) {
      throw new Error('Failed to fetch student feedback responses');
    }
    const studentData = await studentRes.json();

    // Build URL for supervisor feedback with the same query parameters
    let supervisorUrl = '/api/supervisor-feedback/response/all';
    if (filters) {
      const params = new URLSearchParams();
      if (filters.departmentId) {
        params.append('departmentId', filters.departmentId.toString());
      }
      if (filters.programId) {
        params.append('programId', filters.programId.toString());
      }
      if (params.toString()) {
        supervisorUrl += `?${params.toString()}`;
      }
    }

    // Fetch supervisor feedback responses with filters
    const supervisorRes = await fetch(supervisorUrl, {
      method: 'GET',
      credentials: 'include',
    });

    if (!supervisorRes.ok) {
      throw new Error('Failed to fetch supervisor feedback responses');
    }
    const supervisorData = await supervisorRes.json();

    return {
      student: studentData,
      supervisor: supervisorData,
    };
  } catch (error) {
    console.error('Error fetching feedback responses:', error);
    throw error;
  }
}

export async function getUnansweredFeedback(filters?: {
  departmentId?: number;
  programId?: number;
}) {
  try {
    // Build query parameters for student feedback
    let studentParams = new URLSearchParams();
    if (filters?.departmentId) {
      studentParams.append('departmentId', filters.departmentId.toString());
    }
    if (filters?.programId) {
      studentParams.append('programId', filters.programId.toString());
    }

    const studentUrl = `/api/student-feedback/response/unanswered${studentParams.toString() ? `?${studentParams.toString()}` : ''}`;

    // Build query parameters for supervisor feedback
    let supervisorParams = new URLSearchParams();
    if (filters?.departmentId) {
      supervisorParams.append('departmentId', filters.departmentId.toString());
    }
    if (filters?.programId) {
      supervisorParams.append('programId', filters.programId.toString());
    }

    const supervisorUrl = `/api/supervisor-feedback/response/unanswered${supervisorParams.toString() ? `?${supervisorParams.toString()}` : ''}`;

    // Make parallel requests
    const [studentRes, supervisorRes] = await Promise.all([
      fetch(studentUrl, {
        method: 'GET',
        credentials: 'include',
      }),
      fetch(supervisorUrl, {
        method: 'GET',
        credentials: 'include',
      }),
    ]);

    if (!studentRes.ok) {
      throw new Error('Failed to fetch unanswered student feedback data');
    }

    if (!supervisorRes.ok) {
      throw new Error('Failed to fetch unanswered supervisor feedback data');
    }

    const studentData = await studentRes.json();
    const supervisorData = await supervisorRes.json();

    return {
      student: studentData,
      supervisor: supervisorData,
    };
  } catch (error) {
    console.error('Error fetching unanswered feedback data:', error);
    throw error;
  }
}

export async function updateUserPassword(data: {
  currentPassword: string;
  newPassword: string;
}) {
  const res = await api.user['change-password'].$patch({
    json: data,
  });

  if (!res.ok) {
    throw new Error('server error');
  }

  const json = await res.json();
  return json;
}

export async function updateStudentPersonalInfo(data: {
  fullName: string;
  gender: 'male' | 'female';
  yearLevel: string;
  semester: string;
  totalOJTHours: number;
}) {
  const res = await api.student['personal-info'].$patch({
    json: data,
  });

  if (!res.ok) {
    throw new Error('server error');
  }

  const json = await res.json();
  return json;
}

export async function updateStudentSupervisorInfo(data: {
  supervisorName: string;
  supervisorEmail: string;
  supervisorContactNumber?: string | undefined;
  supervisorAddress?: string | undefined;
}) {
  const res = await api.student['supervisor-info'].$patch({
    json: data,
  });

  if (!res.ok) {
    throw new Error('server error');
  }

  const json = await res.json();
  return json;
}

export async function updateProfilePicture(data: { file: File }) {
  const res = await api.user['profile-picture'].$patch({
    form: { profilePicture: data.file },
  });

  if (!res.ok) {
    throw new Error('server error');
  }

  const json = await res.json();
  return json;
}

export async function updateAdminOrCoordinatorPersonalInfo(data: {
  fullName: string;
  gender: 'male' | 'female';
}) {
  const res = await api.user['personal-info'].$patch({ json: data });

  if (!res.ok) {
    throw new Error('server error');
  }

  const json = await res.json();
  return json;
}
