import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { getAccessToken, tryRefresh } from "@/lib/v1Api";

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  const token = getAccessToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const headers: Record<string, string> = {
    ...getAuthHeaders(),
  };
  if (data) {
    headers["Content-Type"] = "application/json";
  }
  const body = data ? JSON.stringify(data) : undefined;
  let res = await fetch(url, {
    method,
    headers,
    body,
    credentials: "include",
  });

  // Access token may have expired (15m lifetime). Refresh once and retry.
  if (res.status === 401 && getAccessToken()) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      res = await fetch(url, {
        method,
        headers: { ...headers, ...getAuthHeaders() },
        body,
        credentials: "include",
      });
    }
  }

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey.join("/") as string;
    let res = await fetch(url, {
      credentials: "include",
      headers: getAuthHeaders(),
    });

    // Access token may have expired (15m lifetime). Refresh once and retry.
    if (res.status === 401 && getAccessToken()) {
      const refreshed = await tryRefresh();
      if (refreshed) {
        res = await fetch(url, {
          credentials: "include",
          headers: getAuthHeaders(),
        });
      }
    }

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
