'use client'

import React, { useState, ChangeEvent, FormEvent } from 'react'
import Notification from './notification'
import axios from 'axios'

// Define a type for the form data
interface BotFormData {
  email: string
  accessToken: string
  serverDomain: string
  botName: string
}

// Function to generate a random 5-letter alphanumeric bot name
const generateBotName = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let botName = ''
  for (let i = 0; i < 5; i++) {
    botName += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return botName
}

const BotForm: React.FC<{ user: { email: string; accessToken: string } }> = ({
  user: { email, accessToken },
}) => {
  // State hooks for form data
  const botName = generateBotName() // Bot name initialized with random value
  const [serverDomain, setServerDomain] = useState<string>('') // server domain input value
  const [isLoading, setIsLoading] = useState<boolean>(false) // Loading flag
  const [notification, setNotification] = useState<{
    message: string
    type: 'success' | 'error'
  } | null>(null)

  // Valid server domain.
  const correctServerDomain = () => {
    return (
      serverDomain &&
      serverDomain.length > 0 &&
      serverDomain.startsWith('https://zealy.io/cw/')
    )
  }

  // Handler for server domain input change
  const handleServerDomainChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setServerDomain(e.target.value)
  }

  // Handle form submission (Create Bot button click)
  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault()
    setIsLoading(true)

    const botData: BotFormData = {
      email,
      accessToken,
      serverDomain,
      botName,
    }

    try {
      // Assume there's an endpoint to create the bot in your backend API
      const response = await axios.post('/api/create-bot', botData)

      // Check if the response is successful
      if (response.status === 200) {
        setNotification({
          message: 'Bot created successfully!',
          type: 'success',
        })
      } else {
        setNotification({
          message: 'Failed to create bot. Try again.',
          type: 'error',
        })
      }
      setIsLoading(false)
    } catch (error) {
      console.error(error)
      setIsLoading(false)
      setNotification({
        message: 'An error occurred while creating the bot.',
        type: 'error',
      })
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit}>
        {/* Display the generated bot name in a read-only input */}
        <div className='mb-4'>
          <label htmlFor='botname' className='block text-gray-700 mb-2'>
            Bot Key
          </label>
          <input
            id='botname'
            type='text'
            value={botName}
            readOnly
            className='w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
        </div>

        {/* Server domain input */}
        <div className='mb-4'>
          <label htmlFor='serverDomain' className='block text-gray-700 mb-2'>
            Server Domain{' '}
            <p className='opacity-45'>(e.g: https://zealy.io/cw/memerkat)</p>
          </label>
          <input
            id='serverDomain'
            type='text'
            value={serverDomain}
            onChange={handleServerDomainChange}
            placeholder='Enter server domain'
            required
            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white'
          />
        </div>

        {/* Submit Button */}
        <button
          type='submit'
          className={`w-full bg-blue-500 text-white font-semibold py-2 rounded-lg hover:bg-blue-600 active:scale-105 active:bg-blue-900 transition duration-100 ${
            isLoading || !correctServerDomain()
              ? 'opacity-50 cursor-not-allowed'
              : ''
          }`}
          disabled={isLoading || !correctServerDomain()}
        >
          Create Bot
        </button>
      </form>
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

export default BotForm
