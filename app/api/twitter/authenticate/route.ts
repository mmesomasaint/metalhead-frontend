import { TwitterApi } from 'twitter-api-v2'
import { NextResponse, NextRequest } from 'next/server'

// Define the type for the environment variables
type EnvVariables = {
  TWITTER_CLIENT_ID?: string
  TWITTER_CLIENT_SECRET?: string
  TWITTER_CALLBACK_URL?: string
}

export async function POST(req: NextRequest) {
  const { userEmail } = await req.json()
  // Get environment variables with proper typing
  const {
    TWITTER_CLIENT_ID, // Twitter app's client ID for OAuth 2.0
    TWITTER_CLIENT_SECRET, // Twitter app's client secret
    TWITTER_CALLBACK_URL, // Callback URL for Twitter OAuth
  } = process.env as EnvVariables

  // Check if all required environment variables are present
  if (!TWITTER_CLIENT_ID || !TWITTER_CLIENT_SECRET || !TWITTER_CALLBACK_URL) {
    return NextResponse.json(
      { error: 'Twitter OAuth credentials missing' },
      { status: 500 }
    )
  }

  // Initialize the Twitter API client using OAuth 2.0 credentials
  const twitterClient = new TwitterApi({
    clientId: TWITTER_CLIENT_ID,
    clientSecret: TWITTER_CLIENT_SECRET,
  })

  try {
    // Generate the authorization URL for OAuth 2.0
    const { url, codeVerifier, state } = twitterClient.generateOAuth2AuthLink(
      TWITTER_CALLBACK_URL,
      {
        scope: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'], // Scopes for user permissions (adjust based on your needs)
      }
    )

    if (!url || !codeVerifier || !state) {
      return NextResponse.json(
        { error: 'Failed to generate OAuth2 authorization URL' },
        { status: 500 }
      )
    }

    // Create the response and set cookies with the necessary OAuth2 data
    const response = NextResponse.redirect(url)

    // Set cookie options to create session.
    const cookieOptions = {
      httpOnly: true, // Prevent JavaScript from accessing the cookie
      secure: process.env.NODE_ENV === 'production', // Set secure flag in production
      sameSite: 'lax' as const, // Set cookie SameSite policy
    }

    // Store codeVerifier and state in cookies
    response.cookies.set('state', state, cookieOptions)
    response.cookies.set('codeVerifier', codeVerifier, cookieOptions)
    response.cookies.set('userEmail', userEmail, cookieOptions)

    return response
  } catch (error) {
    console.error('Error during Twitter OAuth2 flow:', error)
    return NextResponse.json(
      { error: 'Error initiating OAuth2 authentication' },
      { status: 500 }
    )
  }
}
