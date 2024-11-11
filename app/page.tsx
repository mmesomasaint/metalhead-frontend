import AuthForm from '@/components/authForm'
import { NextApiRequest } from 'next/types'

export default function Home({code}: {code: string}) {

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-100'>
      <AuthForm />
    </div>
  )
}

export async function getServerSideProps({ req }: {req: NextApiRequest} ) {
  // Get the 'x-code' from the cookies
  const code = req.cookies['x-code']

  // If there's no 'x-code', redirect or render a default message
  if (!code) {
    return {
      props: { code: null },
    }
  }

  return {
    props: { code }, // Pass the 'x-code' to the page component
  }
}