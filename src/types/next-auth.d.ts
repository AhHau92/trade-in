import { DefaultSession } from 'next-auth'

// NextAuth's built-in Session/User/JWT types only know about the default
// fields (name/email/image). This app's authorize() callback and jwt/session
// callbacks (see src/lib/auth.ts) attach `id` and `role` to every session,
// so every route handler was casting `session.user as any` to read them.
// Augmenting the module types here means those fields are properly typed
// everywhere `getServerSession`/`useSession` is used, with no casts needed.
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: string
    } & DefaultSession['user']
  }

  interface User {
    id: string
    role: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
  }
}
