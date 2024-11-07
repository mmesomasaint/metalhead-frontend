'use client'

import { useState } from 'react'
import Notification from '@/components/notification'

export default function Home() {
  const [userEmail, setUserEmail] = useState('')
  const [pin, setPin] = useState('')
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [notification, setNotification] = useState<{
    message: string
    type: 'success' | 'error'
  } | null>(null)

  const handleAuth = () => {
    setIsRedirecting(true)
    fetch('/api/twitter/authenticate')
      .then((res) => res.json())
      .then((data) => {
        // Redirect user to Twitter's authorization URL
        setIsRedirecting(true)
        window.location.href = data.url
      })
      .catch((err) => {
        console.log("error", err) // log the error
        setNotification({
          message: 'Error initiating authentication',
          type: 'error',
        }) // Notify
        setIsRedirecting(false) // Reset the state if there's an error
      })
  }

  const handleSubmitPin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Send PIN and userEmail to the backend
    fetch('/api/twitter/access_token', {
      method: 'POST',
      body: JSON.stringify({ pin, userEmail }),
      headers: { 'Content-Type': 'application/json' },
    })
      .then((res) => res.json())
      .then((data) => {
        setNotification({
          message: 'Successfully authenticated and tokens stored in S3',
          type: 'success',
        })
      })
      .catch((err) => {
        setNotification({
          message: 'Error during access token exchange',
          type: 'error',
        })
      })
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-100'>
      <div className='bg-white p-8 rounded-lg shadow-md w-full max-w-md'>
        <h1 className='text-2xl font-bold mb-6 text-center'>METAL HEAD</h1>

        <div className='mb-4'>
          <input
            type='email'
            placeholder='Enter your email'
            value={userEmail}
            onChange={(e) => setUserEmail(e.target.value)}
            className='w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white'
            disabled={isRedirecting}
          />
        </div>

        <button
          type='button'
          onClick={handleAuth}
          className={`w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition duration-300 ${
            isRedirecting ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          disabled={isRedirecting}
        >
          Authenticate with Twitter
        </button>

        <form onSubmit={handleSubmitPin} className='mt-6'>
          <div className='mb-4'>
            <input
              type='text'
              placeholder='Enter PIN'
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className='w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white'
            />
          </div>
          <button
            type='submit'
            className='w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition duration-300'
          >
            Submit PIN
          </button>
        </form>
      </div>
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  )
}
