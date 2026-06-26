const API_BASE_URL =
  'https://api-plugin.getmelon.co';

let currentToken = '';
let currentMelonType: 'core' | 'stack' = 'stack';
let shopifyAppUrl = '';
let currentShop = '';
let currentStoreDomain = '';

export function setMelonConfig(config: {
  token: string;
  melonType?: 'core' | 'stack';
  shop: string;
  shopifyAppUrl: string;
  storeDomain?: string;
}) {
  currentToken = config.token;
  currentMelonType = config.melonType || 'stack';
  currentShop = config.shop;
  currentStoreDomain = config.storeDomain || config.shop;
  shopifyAppUrl = config.shopifyAppUrl.replace(/\/$/, '');
}

export function getMelonType() {
  return currentMelonType;
}
export function getMelonStoreDomain() {
  return currentStoreDomain || currentShop;
}

export function getCurrentToken() {
  return currentToken;
}

type RequestOptions = {
  method?: 'GET' | 'POST';
  body?: unknown;
  params?: Record<string, string>;
  retry?: boolean;
  onTokenRefresh?: (freshToken: string, body: unknown) => unknown;
};

function isTokenExpiredError(status: number, message: string) {
  return status === 401 || /token|expired|unauthorized/i.test(message);
}

async function refreshMelonToken() {
  if (!currentShop) {
    throw new Error('Shop is missing. Cannot refresh Melon token.');
  }

  if (!shopifyAppUrl) {
    throw new Error('Shopify app URL is missing. Cannot refresh Melon token.');
  }

  const formData = new FormData();
  formData.append('shop', currentShop);

  const response = await fetch(`${shopifyAppUrl}/api/refresh-melon-token`, {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();

  if (!response.ok || !data.token) {
    throw new Error(data.error || 'Failed to refresh Melon token');
  }

  currentToken = data.token;
  currentMelonType = data.melonType || currentMelonType || 'stack';
  currentStoreDomain = data.storeDomain || currentStoreDomain || currentShop;

  return data.token as string;
}

async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const {
    method = 'GET',
    body,
    params,
    retry = true,
    onTokenRefresh,
  } = options;

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
    const message =
      data?.message ||
      data?.error ||
      `Request failed with status ${response.status}`;

    if (retry && isTokenExpiredError(response.status, message)) {
      const freshToken = await refreshMelonToken();

      const retryBody = onTokenRefresh
        ? onTokenRefresh(freshToken, body)
        : body;

      return request<T>(path, {
        method,
        body: retryBody,
        params,
        retry: false,
      });
    }

    throw new Error(message);
  }

  return data as T;
}

const apiClient = {
  get: <T>(path: string, params?: Record<string, string>) =>
    request<T>(path, {
      method: 'GET',
      params,
    }),

  post: <T>(
    path: string,
    body?: unknown,
    options?: Pick<RequestOptions, 'onTokenRefresh'>,
  ) =>
    request<T>(path, {
      method: 'POST',
      body,
      onTokenRefresh: options?.onTokenRefresh,
    }),
};

export default apiClient;
