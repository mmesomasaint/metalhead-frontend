// next.d.ts or custom type definition file
import { NextApiRequest as NextRequest } from 'next'
import { Session } from 'next-iron-session' // Adjust based on your session library

declare module 'next' {
  interface NextApiRequest extends NextRequest {
    session: Session // Replace `Session` with the actual type from your session library
  }
}
