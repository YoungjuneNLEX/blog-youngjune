import { DefaultSession } from 'next-auth'
import { Role } from '@/lib/types'

declare module 'next-auth' {
  interface Session {
    user: {
      role: Role
    } & DefaultSession['user']
  }
}
