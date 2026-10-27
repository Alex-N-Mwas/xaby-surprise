import type { Config, Context } from "@netlify/edge-functions";
import { hasValidSession, usablePasscode } from "../../lib/session.ts";

// Keeps the private page, its media, and the media lists behind the passcode.
export default async (request: Request, context: Context) => {
  const { pathname } = new URL(request.url);
  const signedIn = await hasValidSession(request, usablePasscode(Netlify.env.get("ACCESS_CODE")));
  const redirect = (location: string) => new Response(null, { status: 302, headers: { Location: location, "Cache-Control": "no-store" } });

  if (pathname === "/" || pathname === "/index.html" || pathname === "/gate.html") {
    if (signedIn) return redirect("/surprise");
    if (pathname !== "/") return redirect("/");
    return context.next();
  }
  if (!signedIn) return redirect("/");

  const response = await context.next();
  response.headers.set("Cache-Control", "private, no-store");
  return response;
};

export const config: Config = {
  path: "/*",
  excludedPath: ["/styles.css", "/app.js", "/api/access"],
};
