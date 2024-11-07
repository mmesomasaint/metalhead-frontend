import React from 'react'

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
  return (
    <div
      className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg text-white ${
        type === 'success' ? 'bg-green-500' : 'bg-red-500'
      }`}
    >
      <div className='flex items-center justify-between'>
        <span>{message}</span>
        <button type='button' onClick={onClose} className='ml-4 text-xl font-bold'>
          &times;
        </button>
      </div>
    </div>
  )
}

export default Notification
