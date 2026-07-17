export interface GoogleUser {
  email: string;
  name: string;
  picture?: string;
}

// Decodes the payload of a Google ID token (JWT) for display purposes only.
// The backend independently verifies the token's signature on every request;
// this decode is never trusted for authorization.
export function decodeGoogleIdToken(idToken: string): GoogleUser | null {
  try {
    const payloadSegment = idToken.split('.')[1];
    const json = atob(payloadSegment.replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(decodeURIComponent(escape(json)));
    if (!payload.email) return null;
    return { email: payload.email, name: payload.name || payload.email, picture: payload.picture };
  } catch {
    return null;
  }
}
