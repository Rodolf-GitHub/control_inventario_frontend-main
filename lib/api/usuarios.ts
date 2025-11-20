import { apiRequest } from '../api-client';

export type LoginResponse = {
  token: string | null;
  id?: number | null;
  username: string;
  permisos?: any[] | null;
  es_superusuario?: boolean;
};

export async function loginApi(username: string, password: string): Promise<LoginResponse> {
  return apiRequest<LoginResponse>('/api/usuario/login/', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export async function crearUsuarioApi(data: { username: string; password: string; es_superusuario?: boolean }, token?: string) {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return apiRequest('/api/usuario/crear/', {
    method: 'POST',
    body: JSON.stringify(data),
    headers,
  });
}

export async function changePasswordApi(data: { old_password: string; new_password: string }, token?: string) {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return apiRequest('/api/usuario/password/change/', {
    method: 'PUT',
    body: JSON.stringify(data),
    headers,
  });
}

export async function superResetPasswordApi(usuarioId: number, data: { new_password: string }, token?: string) {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return apiRequest(`/api/usuario/password/reset/${usuarioId}/`, {
    method: 'POST',
    body: JSON.stringify(data),
    headers,
  });
}

export async function logoutApi(token?: string) {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return apiRequest('/api/usuario/logout/', {
    method: 'POST',
    headers,
  });
}

export async function getPermisosUsuarioApi(usuarioId: number, token?: string) {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return apiRequest(`/api/usuario/permisos/usuario/${usuarioId}/`, {
    method: 'GET',
    headers,
  });
}

export async function listarUsuariosApi(token?: string) {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  // Some backends expose this at /api/usuario/listar/
  return apiRequest('/api/usuario/listar/', {
    method: 'GET',
    headers,
  });
}

export async function actualizarPermisoApi(permisoId: number, data: any, token?: string) {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return apiRequest(`/api/usuario/permisos/actualizar/${permisoId}/`, {
    method: 'PUT',
    body: JSON.stringify(data),
    headers,
  });
}

export async function eliminarPermisoApi(permisoId: number, token?: string) {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return apiRequest(`/api/usuario/permisos/eliminar/${permisoId}/`, {
    method: 'DELETE',
    headers,
  });
}

export async function crearPermisoApi(data: any, token?: string) {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return apiRequest('/api/usuario/permisos/crear/', {
    method: 'POST',
    body: JSON.stringify(data),
    headers,
  });
}

export async function eliminarUsuarioApi(usuarioId: number, token?: string) {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return apiRequest(`/api/usuario/eliminar/${usuarioId}/`, {
    method: 'DELETE',
    headers,
  });
}
