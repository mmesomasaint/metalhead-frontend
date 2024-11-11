import AuthForm from '@/components/authForm'
import {cookies} from 'next/headers'

export default async function Home() {
  const cookieStore = await cookies()
  const code = cookieStore.get('x-code')

  // Move to next auth step if code is present
  if (code) {
    console.log('code: ', code)
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-100'>
      <AuthForm />
    </div>
  )
}