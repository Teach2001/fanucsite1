const COOKIE_NAME = "FANUC_SITE_AUTH";
const COOKIE_MAX_AGE = 3600;

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

function loginPage(errorMessage = "") {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Protected Site Login</title>
    <style>
      body { font-family: Arial, sans-serif; background: #f3f4f6; margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
      .login-box { width: 100%; max-width: 420px; background: white; padding: 32px; border-radius: 12px; box-shadow: 0 20px 50px rgba(0,0,0,.08); }
      h1 { margin: 0 0 16px; font-size: 1.75rem; }
      label { display: block; margin-bottom: 8px; font-weight: 600; }
      input[type=password] { width: 100%; padding: 12px 14px; margin-bottom: 16px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 1rem; }
      button { width: 100%; padding: 12px 14px; border: none; border-radius: 8px; background: #2563eb; color: white; font-size: 1rem; cursor: pointer; }
      .error { color: #b91c1c; margin-bottom: 16px; }
      .footer { margin-top: 16px; color: #6b7280; font-size: 0.95rem; }
    </style>
  </head>
  <body>
    <main class="login-box">
      <h1>Enter Password</h1>
      ${errorMessage ? `<p class="error">${errorMessage}</p>` : ""}
      <form method="post" action="/login">
        <label for="password">Password</label>
        <input id="password" name="password" type="password" autocomplete="current-password" required />
        <button type="submit">Continue</button>
      </form>
      <p class="footer">This content is protected by server-side password authentication.</p>
    </main>
  </body>
</html>`;
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === "GET") {
    const authCookie = getCookie(request, COOKIE_NAME);
    if (authCookie && env.PASSWORD_SECRET) {
      const expectedToken = await makeAuthToken(env.PASSWORD_SECRET);
      if (authCookie === expectedToken) {
        return Response.redirect("/", 302);
      }
    }
    return new Response(loginPage(), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  if (request.method === "POST") {
    const form = await request.formData();
    const password = form.get("password")?.toString() || "";

    if (!env.PASSWORD_SECRET) {
      return new Response(loginPage("Server password is not configured. Set PASSWORD_SECRET in Cloudflare."), {
        status: 500,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    if (password === env.PASSWORD_SECRET) {
      const cookieValue = await makeAuthToken(env.PASSWORD_SECRET);
      const response = Response.redirect("/", 302);
      response.headers.set(
        "Set-Cookie",
        `${COOKIE_NAME}=${cookieValue}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE}`
      );
      return response;
    }

    return new Response(loginPage("Invalid password. Please try again."), {
      status: 401,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  return new Response("Method Not Allowed", { status: 405 });
}
