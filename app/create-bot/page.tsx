import BotForm from '@/components/bot-create'
import { FaRobot } from 'react-icons/fa'
import TwitterAuthForm from '@/components/twitter-auth'
import { cookies } from 'next/headers'

export default async function Home() {
  const cookieStore = await cookies()
  const token = cookieStore.get('access_token')
  const email = cookieStore.get('email')
  const hasTwitterAuth = token && email

  // Move to next auth step if token is present
  if (token) {
    console.log('token: ', token)
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-100'>
      <div className='bg-white p-8 rounded-lg shadow-md w-full max-w-md'>
        <div className='mb-6'>
          <FaRobot className='text-7xl mx-auto text-blue-500/40' />
          <h2 className='text-xl text-center font-semibold text-blue-500/40'>Create a Bot</h2>
        </div>
        {hasTwitterAuth ? (
          <BotForm user={{ email: email.value, accessToken: token.value }} />
        ) : (
          <TwitterAuthForm />
        )}
      </div>
    </div>
  )
}
