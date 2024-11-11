import { TwitterApi } from 'twitter-api-v2'
import { NextResponse } from 'next/server'

// Define the type for the environment variables
type EnvVariables = {
  TWITTER_CONSUMER_KEY?: string
  TWITTER_CONSUMER_SECRET?: string
  TWITTER_CALLBACK_URL?: string
}

export async function GET() {
  // Get environment variables with proper typing
  const {
    TWITTER_CONSUMER_KEY, // Twitter app's consumer key
    TWITTER_CONSUMER_SECRET, // Twitter app's consumer secret
    TWITTER_CALLBACK_URL, // Callback URL for Twitter OAuth
  } = process.env as EnvVariables

  // Check if all required environment variables are present
  if (
    !TWITTER_CONSUMER_KEY ||
    !TWITTER_CONSUMER_SECRET ||
    !TWITTER_CALLBACK_URL
  ) {
    return NextResponse.json({ error: 'Twitter Keys Missing' }, { status: 500 })
  }

  // Initialize Twitter API client with the necessary credentials
  const twitterClient = new TwitterApi({
    appKey: TWITTER_CONSUMER_KEY,
    appSecret: TWITTER_CONSUMER_SECRET,
  })

  try {
    // Step 1: Get the request token from Twitter
    const { url, oauth_token, oauth_token_secret } =
      await twitterClient.generateAuthLink(TWITTER_CALLBACK_URL)

    if (!oauth_token || !oauth_token_secret || !url) {
      return NextResponse.json(
        { error: 'Failed to get request token & URL from Twitter' },
        { status: 500 }
      )
    }

    // Step 2: Create the response and set cookies with the request tokens
    const response = NextResponse.json({ url })

    // Store oauth_token and oauth_token_secret in cookies for the next step of OAuth
    response.cookies.set(
      'oauthToken',
      JSON.stringify({
        oauthToken: oauth_token,
        oauthTokenSecret: oauth_token_secret,
      }),
      {
        httpOnly: true, // Prevent JavaScript from accessing the cookie
        secure: process.env.NODE_ENV === 'production', // Set secure flag in production
        sameSite: 'lax', // Can be 'strict', 'lax', or 'none'
      }
    )

    return response
  } catch (error) {
    // Handle any errors that occur during the OAuth process
    console.error('Error during Twitter OAuth flow:', error)
    return NextResponse.json(
      { error: 'Error authenticating user' },
      { status: 500 }
    )
  }
}
