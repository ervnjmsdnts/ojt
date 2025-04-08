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
  const res = await api.notification.global.$post({ json: data });

  if (!res.ok) {
    throw new Error('server error');
  }

  const json = await res.json();
  return json;
}
