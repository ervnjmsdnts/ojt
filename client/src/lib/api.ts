import { hc } from 'hono/client';
import type { ApiRoutes } from '@server/app';
import { queryOptions } from '@tanstack/react-query';
import { OJTCategory, OJTStatus, Role } from './types';

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
