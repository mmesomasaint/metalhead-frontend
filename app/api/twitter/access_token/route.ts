import { TwitterApi } from 'twitter-api-v2'
import AWS from 'aws-sdk'
import { NextRequest, NextResponse } from 'next/server'

// Initialize the AWS S3 client
const s3 = new AWS.S3()

// This function uploads the tokens to S3
async function uploadTokensToS3(
  userEmail: string,
  client: TwitterApi,
  accessToken: string,
  accessTokenSecret: string
): Promise<void> {
  const params: AWS.S3.PutObjectRequest = {
    Bucket: 'zealore', // Your S3 bucket name
    Key: `${userEmail}/twitter/tokens.json`, // The S3 object key
    Body: JSON.stringify({
      USER: client,
      ACCESS_TOKEN: accessToken,
      ACCESS_TOKEN_SECRET: accessTokenSecret,
    }),
    ContentType: 'application/json',
    ACL: 'private', // Set the ACL to 'private' to ensure the tokens are not publicly accessible
  }

  // Upload the tokens to the specified S3 bucket
  await s3.putObject(params).promise()
  console.log('Tokens successfully uploaded to S3')
}

export async function POST(req: NextRequest) {
  // Extract tokens from query string
  const searchParams = req.nextUrl.searchParams
  const oauth_verifier = searchParams.get('oauth_verifier')
  const oauthToken = searchParams.get('oauth_token')

  // Get the userEmail, oauthToken and oauthTokenSecret from the session
  const authCookie = req.cookies.get('oauthToken')

  // Get env varaibles.
  const consumerKey = process.env.TWITTER_CONSUMER_KEY
  const consumerSecret = process.env.TWITTER_CONSUMER_SECRET
  const callbackUrl = process.env.TWITTER_CALLBACK_URL

  if (!oauthToken || !oauth_verifier) {
    return NextResponse.json({
      error: 'You denied the app or your session expired!',
      status: 500,
    })
  }

  if (!consumerKey || !consumerSecret || !callbackUrl) {
    return NextResponse.json({
      error: 'Twitter environment variables not set',
      status: 500,
    })
  }

  if (!authCookie) {
    return NextResponse.json({ error: 'OAuth tokens not found in session.' })
  }

  // Get the user details from session.
  const { userEmail, oauthTokenSecret } = JSON.parse(authCookie.value)

  if (!userEmail) {
    return NextResponse.json({
      error: 'PIN and userEmail are required',
      status: 400,
    })
  }

  // Create a new Twitter API client
  const twitterClient = new TwitterApi({
    appKey: consumerKey,
    appSecret: consumerSecret,
    accessToken: oauthToken,
    accessSecret: oauthTokenSecret,
  })

  try {
    // Step 2: Exchange the oauth_token, oauth_token_secret, and oauth_verifier for the access token
    const {
      client: user,
      accessToken,
      accessSecret,
    } = await twitterClient.login(oauth_verifier)

    // Save the access token and secret to S3
    await uploadTokensToS3(userEmail, user, accessToken, accessSecret)

    // Create the response object to set the cookie
    const response = NextResponse.redirect('/')

    // Set the 'x-code' in the cookie
    response.cookies.set('x-code', accessToken, {
      httpOnly: true, // Prevent access to the cookie via JavaScript
      secure: process.env.NODE_ENV === 'production', // Secure flag in production
      sameSite: 'lax', // Same-site policy
      maxAge: 60 * 60 * 24, // Cookie expires in 1 day (or customize as needed)
    })

    return response
  } catch (error) {
    console.error('Error during OAuth exchange or S3 upload:', error)
    return NextResponse.json({
      error: 'Failed to exchange PIN for access token or upload tokens to S3',
      status: 500,
    })
  }
}
