const API_BASE_URL =
  'https://leon-trigraphic-overelegantly.ngrok-free.dev';

type RequestOptions = {
  method?: 'GET' | 'POST';
  body?: unknown;
  params?: Record<string, string>;
};

async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const {method = 'GET', body, params} = options;

  const url = new URL(`${API_BASE_URL}${path}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }

  const response = await fetch(url.toString(), {
    method,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'ngrok-skip-browser-warning': 'true',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.message || `Request failed with status ${response.status}`,
    );
  }

  return data as T;
}

const apiClient = {
  get: <T>(path: string, params?: Record<string, string>) =>
    request<T>(path, {
      method: 'GET',
      params,
    }),

  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'POST',
      body,
    }),
};

export default apiClient;
