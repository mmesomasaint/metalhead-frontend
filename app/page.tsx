import AuthForm from '@/components/authForm'
import {cookies} from 'next/headers'

export default async function Home() {
  const cookieStore = await cookies()
  const token = cookieStore.get('access_token')

  // Move to next auth step if token is present
  if (token) {
    console.log('token: ', token)
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-100'>
      <AuthForm />
    </div>
  )
}