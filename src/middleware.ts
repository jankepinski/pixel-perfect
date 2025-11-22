import { NextRequest, NextResponse } from 'next/server';

export const config = {
  matcher: ['/:path*'],
};

export function middleware(req: NextRequest) {
  const basicAuth = req.headers.get('authorization');
  const url = req.nextUrl;

  if (basicAuth) {
    const authValue = basicAuth.split(' ')[1];
    const [user, pwd] = atob(authValue).split(':');

    const validUser = process.env.BASIC_AUTH_USER;
    const validPass = process.env.BASIC_AUTH_PASSWORD;

    if (user === validUser && pwd === validPass) {
      return NextResponse.next();
    }
  }

  url.pathname = '/api/auth';

  return new NextResponse('Auth Required.', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Area"',
    },
  });
}
