'use client'

import { useState } from 'react'
import Notification from '@/components/notification'

export default function AuthForm() {
  const [userEmail, setUserEmail] = useState('')
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [notification, setNotification] = useState<{
    message: string
    type: 'success' | 'error'
  } | null>(null)

  const handleAuth = () => {
    setIsRedirecting(true)
    fetch('/api/twitter/authenticate', {
      method: 'POST',
      body: JSON.stringify({ userEmail }),
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((res) => res.json())
      .then((data) => {
        // Redirect user to Twitter's authorization URL
        console.log('data: ', data)
        window.location.href = data.url
      })
      .catch((err) => {
        console.log('error', err) // log the error
        setNotification({
          message: 'Error initiating authentication',
          type: 'error',
        }) // Notify
        setIsRedirecting(false) // Reset the state if there's an error
      })
  }

  return (
    <>
      <div className='bg-white p-8 rounded-lg shadow-md w-full max-w-md'>
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
      </div>
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </>
  )
}
