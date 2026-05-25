const COOKIE_NAME = "FANUC_SITE_AUTH";

async function makeAuthToken(secret) {
  const encoder = new TextEncoder();
  const data = encoder.encode(`AUTH|${secret}`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function getCookie(request, name) {
  const cookieHeader = request.headers.get("Cookie") || "";
  const match = cookieHeader.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? match[1] : null;
}

async function isAuthorized(request, env) {
  const authToken = getCookie(request, COOKIE_NAME);
  if (!authToken) return false;
  if (!env.PASSWORD_SECRET) return false;
  const expectedToken = await makeAuthToken(env.PASSWORD_SECRET);
  return authToken === expectedToken;
}

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  if (path === "/login" || path === "/favicon.ico") {
    return context.next();
  }

  if (await isAuthorized(request, context.env)) {
    return context.next();
  }

  return Response.redirect(`${url.origin}/login`, 302);
}
