type TokenStorage = "local" | "session";

type StoredTokens = {
  accessToken: string | null;
  refreshToken: string | null;
  storage: TokenStorage | null;
};

function readTokensFrom(storage: Storage): StoredTokens {
  const accessToken = storage.getItem("accessToken");
  const refreshToken = storage.getItem("refreshToken");
  if (!accessToken && !refreshToken) {
    return { accessToken: null, refreshToken: null, storage: null };
  }
  return {
    accessToken,
    refreshToken,
    storage: storage === localStorage ? "local" : "session",
  };
}

export function getStoredTokens(): StoredTokens {
  if (typeof window === "undefined") {
    return { accessToken: null, refreshToken: null, storage: null };
  }
  const local = readTokensFrom(localStorage);
  if (local.accessToken || local.refreshToken) {
    return local;
  }
  return readTokensFrom(sessionStorage);
}

export function getAccessToken(): string | null {
  return getStoredTokens().accessToken;
}

export function getRefreshToken(): { token: string | null; storage: TokenStorage | null } {
  const tokens = getStoredTokens();
  return { token: tokens.refreshToken, storage: tokens.storage };
}

export function setTokens(options: {
  accessToken: string;
  refreshToken: string;
  remember: boolean;
}) {
  const storage = options.remember ? localStorage : sessionStorage;
  storage.setItem("accessToken", options.accessToken);
  storage.setItem("refreshToken", options.refreshToken);
  const other = options.remember ? sessionStorage : localStorage;
  other.removeItem("accessToken");
  other.removeItem("refreshToken");
}

export function setAccessToken(accessToken: string, storage: TokenStorage) {
  const target = storage === "local" ? localStorage : sessionStorage;
  target.setItem("accessToken", accessToken);
}

export async function refreshAccessToken(
  apiBase: string,
): Promise<string | null> {
  const { token, storage } = getRefreshToken();
  if (!token || !storage) return null;
  try {
    const res = await fetch(`${apiBase}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: token }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { accessToken: string };
    setAccessToken(data.accessToken, storage);
    return data.accessToken;
  } catch {
    return null;
  }
}

export function clearTokens() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  sessionStorage.removeItem("accessToken");
  sessionStorage.removeItem("refreshToken");
}
