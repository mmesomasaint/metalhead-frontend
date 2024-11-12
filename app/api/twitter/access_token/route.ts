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
  refreshToken: string | undefined,
  expiresIn: number
): Promise<void | NextResponse<unknown>> {
  const bucketName = process.env.AWS_BUCKET_NAME
  if (!bucketName) {
    return NextResponse.json({error: "Bucket name missing.", status: 500})
  }

  const params: AWS.S3.PutObjectRequest = {
    Bucket: bucketName, // Your S3 bucket name
    Key: `${userEmail}/twitter/tokens.json`, // The S3 object key
    Body: JSON.stringify({
      USER: client,
      ACCESS_TOKEN: accessToken,
      REFRESH_TOKEN: refreshToken,
      EXPIRES_IN: expiresIn,
    }),
    ContentType: 'application/json',
    ACL: 'private', // Set the ACL to 'private' to ensure the tokens are not publicly accessible
  }

  // Upload the tokens to the specified S3 bucket
  await s3.putObject(params).promise()
  console.log('Tokens successfully uploaded to S3')
}

export async function GET(req: NextRequest) {
  const searchParms = req.nextUrl.searchParams
  const code = searchParms.get('code')
  const state = searchParms.get('state')
  const cookieStore = req.cookies
  const sessionState = cookieStore.get('state')
  const codeVerifier = cookieStore.get('codeVerifier')
  const userEmail = cookieStore.get('userEmail')
  const clientId = process.env.TWITTER_CLIENT_ID
  const clientSecret = process.env.TWITTER_CLIENT_SECRET
  const redirectUri = process.env.TWITTER_CALLBACK_URL

  if (!state || !code) {
    return NextResponse.json(
      { error: 'You denied app or your session expired' },
      { status: 400 }
    )
  }

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.json(
      { error: 'Twitter OAuth credentials missing' },
      { status: 500 }
    )
  }

  if (!sessionState || !codeVerifier || !userEmail) {
    return NextResponse.json({ error: 'User session missing' }, { status: 400 })
  }

  if (state !== sessionState.value) {
    return NextResponse.json(
      { error: 'Stored tokens didnt match!' },
      { status: 400 }
    )
  }

  // Initialize the Twitter API client using OAuth 2.0 credentials
  const twitterClient = new TwitterApi({
    clientId,
    clientSecret,
  })

  try {
    // Step 3: Exchange the authorization code for an access token
    const {
      client: loggedClient,
      accessToken,
      refreshToken,
      expiresIn,
    } = await twitterClient.loginWithOAuth2({
      code,
      codeVerifier: codeVerifier.value,
      redirectUri,
    })

    // Store the access token in s3
    await uploadTokensToS3(
      userEmail.value,
      loggedClient,
      accessToken,
      refreshToken,
      expiresIn
    )

    // Create the response and set the access token in a secure, HttpOnly cookie
    const homePage = new URL(redirectUri).origin
    const response = NextResponse.redirect(homePage)

    // Set cookie options
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
    }

    // Store sessions in cookie
    response.cookies.set('access_token', accessToken, cookieOptions)
    response.cookies.set('email', userEmail.value, cookieOptions)

    return response
  } catch (error) {
    console.error('Error during OAuth2 token exchange:', error)
    return NextResponse.json(
      { error: 'Error exchanging authorization code for access token' },
      { status: 500 }
    )
  }
}
