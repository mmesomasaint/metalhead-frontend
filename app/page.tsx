export default function Home() {
  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-100'>
      <div className='bg-white p-8 rounded-lg shadow-md w-full max-w-md'>
        <h1 className='text-2xl text-center font-semibold text-black/50 mb-6'>Metal Head Control Panel</h1>
        <div className='h-full flex flex-col gap-5 mb-6'>
          <a
            href='/create-bot'
            className='w-full bg-blue-500 text-white py-4 text-center font-semibold rounded-lg hover:bg-blue-600 active:scale-105 active:bg-blue-900 transition duration-100'
          >
            Create A Bot
          </a>
          <a
            href='#'
            className='w-full bg-blue-500/30 text-white py-4 text-center font-semibold rounded-lg hover:bg-blue-600/30 active:scale-105 active:bg-blue-900/30 transition duration-100'
          >
            View Bot Logs
          </a>
          <a
            href='#'
            className='w-full bg-blue-500/30 text-white py-4 text-center font-semibold rounded-lg hover:bg-blue-600/30 active:scale-105 active:bg-blue-900/30 transition duration-100'
          >
            Upload Post Screenshot
          </a>
        </div>
      </div>
    </div>
  )
}
