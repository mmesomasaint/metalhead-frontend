import BotForm from '@/components/bot-create'
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
      {hasTwitterAuth ? (
        <BotForm user={{ email: email.value, accessToken: token.value }} />
      ) : (
        <TwitterAuthForm />
      )}
    </div>
  )
}
