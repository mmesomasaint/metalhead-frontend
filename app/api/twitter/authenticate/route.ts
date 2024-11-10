import OAuth from 'oauth-1.0a'
import axios from 'axios'
import { NextResponse } from 'next/server'
import * as crypto from 'crypto'

// Define the type for the environment variables
type EnvVariables = {
  TWITTER_CONSUMER_KEY?: string
  TWITTER_CONSUMER_SECRET?: string
  TWITTER_CALLBACK_URL?: string
}

export async function GET() {
  // Get environment variables with proper typing
  const {
    TWITTER_CONSUMER_KEY, // Twitter app's access token
    TWITTER_CONSUMER_SECRET, // Twitter app's access token secret
    TWITTER_CALLBACK_URL, // Callback URL where Twitter will redirect after user authorization
  } = process.env as EnvVariables

  // Check if all required environment variables are present
  if (
    !TWITTER_CONSUMER_KEY ||
    !TWITTER_CONSUMER_SECRET ||
    !TWITTER_CALLBACK_URL
  ) {
    return NextResponse.json({ error: 'Twitter Keys Missing' }, { status: 500 })
  }

  // Initialize OAuth 1.0a client with types
  const oauth = new OAuth({
    consumer: { key: TWITTER_CONSUMER_KEY, secret: TWITTER_CONSUMER_SECRET },
    signature_method: 'HMAC-SHA1',
    hash_function(base_string: string, key: string) {
      return crypto.createHmac('sha1', key).update(base_string).digest('base64')
    },
  })

  try {
    // Step 1: Get the request token from Twitter
    const requestTokenUrl = 'https://api.twitter.com/oauth/request_token'
    const requestData = {
      oauth_callback: TWITTER_CALLBACK_URL,
      key: TWITTER_CONSUMER_KEY,
      secret: TWITTER_CONSUMER_SECRET,
    }

    // Generate the OAuth header for the request
    const headers = oauth.toHeader(
      oauth.authorize({ url: requestTokenUrl, method: 'POST' }, requestData)
    )

    // Log OAuth headers to debug
    console.log('Generated OAuth Headers:', headers)

    // Send POST request to get request token from Twitter
    const { data } = await axios.post(requestTokenUrl, null, {
      headers: headers as any,
    })

    // Log the raw response data
    console.log('Response Data:', data)

    // Parse the response to extract oauth_token and oauth_token_secret
    const params = new URLSearchParams(data)
    const oauthToken = params.get('oauth_token')
    const oauthTokenSecret = params.get('oauth_token_secret')

    if (!oauthToken || !oauthTokenSecret) {
      return NextResponse.json(
        { error: 'Failed to get request token from Twitter' },
        { status: 500 }
      )
    }

    // Step 2: Prepare the authorization URL
    const authorizationUrl = `https://api.twitter.com/oauth/authorize?oauth_token=${oauthToken}`

    // Step 3: Create the response and set cookies
    const response = NextResponse.json({ url: authorizationUrl })

    // Store oauthToken and oauthTokenSecret in cookies
    response.cookies.set(
      'oauthToken',
      JSON.stringify({ oauthToken, oauthTokenSecret }),
      {
        httpOnly: true, // Prevent JavaScript from accessing the cookie
        secure: process.env.NODE_ENV === 'production', // Set secure flag in production
        sameSite: 'lax', // Can be 'strict', 'lax', or 'none'
      }
    )

    return response
  } catch (err) {
    // Handle the error wlith a typed catch block
    if (err instanceof Error) {
      console.error(err.message)
    }
    return NextResponse.json(
      { error: 'Error authenticating user' },
      { status: 500 }
    )
  }
}
