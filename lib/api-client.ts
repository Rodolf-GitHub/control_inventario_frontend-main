const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  // Build headers and attach token if available
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> | undefined),
  };

  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) headers['Authorization'] = `Bearer ${token}`;
  } catch {
    // ignore localStorage errors
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    // If unauthorized, clear token and redirect to login
    if (response.status === 401) {
      try {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          // navigate to login page to force re-auth
          window.location.href = '/login';
        }
      } catch {
        // ignore
      }
    }

    // Try to parse backend error message
    let errorMessage = `API Error: ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData && errorData.message) {
        errorMessage = errorData.message;
      } else if (errorData && errorData.detail) {
        errorMessage = errorData.detail;
      } else if (typeof errorData === 'string') {
        errorMessage = errorData;
      }
    } catch {
      // if parsing fails, use status text
    }
    throw new Error(errorMessage);
  }

  // Parse and log response (non-production) to help debug payloads
  const data = await response.json();
  if (process.env.NODE_ENV !== 'production') {
    try {
      // eslint-disable-next-line no-console
      console.debug('[apiRequest] ', { url, options: { ...options, headers }, responseStatus: response.status, responseData: data });
    } catch (err) {
      // ignore logging errors
    }
  }

  return data;
}
