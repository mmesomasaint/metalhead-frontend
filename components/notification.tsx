import React, { useEffect, useState } from 'react'

interface NotificationProps {
  message: string
  type: 'success' | 'error'
  onClose: () => void
}

const Notification: React.FC<NotificationProps> = ({
  message,
  type,
  onClose,
}) => {
  const [animate, setAnimate] = useState(false)

  useEffect(() => {
    // Trigger animation on message change
    setAnimate(true)

    // Reset the animation state after the animation duration (0.5s)
    const timer = setTimeout(() => {
      setAnimate(false)
    }, 500) // After 0.5 seconds the animation is reset

    return () => clearTimeout(timer)
  }, [message])

  return (
    <div
      className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg text-white transition-all ${
        type === 'success' ? 'bg-green-500' : 'bg-red-500'
      } ${animate ? 'animate-slide-in-right' : ''}`}
    >
      <div className='flex items-center justify-between'>
        <span>{message}</span>
        <button
          type='button'
          onClick={onClose}
          className='ml-4 text-xl font-bold'
        >
          &times;
        </button>
      </div>
    </div>
  )
}

export default Notification
