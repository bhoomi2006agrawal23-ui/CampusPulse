/**
 * CampusPulse Secure API Client
 * - Manages short-lived JWT access token EXCLUSIVELY in runtime memory.
 * - NEVER persists access token to localStorage, sessionStorage, or IndexedDB.
 * - Transparently recovers sessions via HttpOnly cookie refresh requests without infinite loops.
 */

let memoryAccessToken: string | null = null;
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

export function getMemoryAccessToken(): string | null {
  return memoryAccessToken;
}

export function setMemoryAccessToken(token: string | null): void {
  memoryAccessToken = token;
}

function subscribeTokenRefresh(callback: (token: string) => void) {
  refreshSubscribers.push(callback);
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
}

export interface ApiClientOptions extends RequestInit {
  skipAuth?: boolean;
}

export async function apiClient<T = any>(
  endpoint: string,
  options: ApiClientOptions = {}
): Promise<{ success: boolean; data?: T; message?: string; meta?: any; error?: any }> {
  const url = endpoint.startsWith('http') ? endpoint : endpoint.startsWith('/') ? endpoint : `/api/${endpoint}`;

  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Attach in-memory access token
  if (!options.skipAuth && memoryAccessToken) {
    headers.set('Authorization', `Bearer ${memoryAccessToken}`);
  }

  const fetchOptions: RequestInit = {
    ...options,
    headers,
    credentials: 'include', // Transmit HttpOnly refresh cookies
  };

  try {
    let response = await fetch(url, fetchOptions);

    // 401 Unauthorized handling & automatic token refresh recovery
    if (response.status === 401 && !options.skipAuth && !url.includes('/api/auth/refresh') && !url.includes('/api/auth/login')) {
      if (!isRefreshing) {
        isRefreshing = true;

        try {
          const refreshRes = await fetch('/api/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
          });

          if (refreshRes.ok) {
            const refreshData = await refreshRes.json();
            const newAccessToken = refreshData?.data?.accessToken;
            if (newAccessToken) {
              setMemoryAccessToken(newAccessToken);
              onRefreshed(newAccessToken);
              isRefreshing = false;

              // Retry original request with newly issued access token
              headers.set('Authorization', `Bearer ${newAccessToken}`);
              response = await fetch(url, { ...fetchOptions, headers });
            } else {
              setMemoryAccessToken(null);
              isRefreshing = false;
            }
          } else {
            setMemoryAccessToken(null);
            isRefreshing = false;
          }
        } catch {
          setMemoryAccessToken(null);
          isRefreshing = false;
        }
      } else {
        // Wait for active refresh to complete then retry
        const retryPromise = new Promise<{ success: boolean; data?: T; error?: any }>((resolve) => {
          subscribeTokenRefresh(async (newToken: string) => {
            headers.set('Authorization', `Bearer ${newToken}`);
            const retryRes = await fetch(url, { ...fetchOptions, headers });
            const data = await retryRes.json();
            resolve(data);
          });
        });
        return retryPromise;
      }
    }

    const data = await response.json();
    return data;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Network request failed';
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message },
    };
  }
}
