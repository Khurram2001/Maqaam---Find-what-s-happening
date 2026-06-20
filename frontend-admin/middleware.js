import { NextResponse } from "next/server";

const AUTH_COOKIE_NAMES = ["mems_access_token", "mems_refresh_token"];

function hasAuthCookie(request) {
  return AUTH_COOKIE_NAMES.some((name) => request.cookies.has(name));
}

export function middleware(request) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/sign-in")) {
    return NextResponse.next();
  }

  if (!hasAuthCookie(request)) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.searchParams.set("next", pathname === "/" ? "/" : pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!sign-in|_next/static|_next/image|favicon\\.ico|favicon-16x16\\.png|favicon-32x32\\.png|apple-touch-icon\\.png|android-chrome-192x192\\.png|android-chrome-512x512\\.png|maqaam-logo-teal\\.png).*)",
  ],
};
