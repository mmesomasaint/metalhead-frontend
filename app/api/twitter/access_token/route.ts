import { OAuth } from 'oauth'
import AWS from 'aws-sdk'
import { NextRequest, NextResponse } from 'next/server'

// Initialize the AWS S3 client
const s3 = new AWS.S3()

// This function uploads the tokens to S3
async function uploadTokensToS3(
  userEmail: string,
  accessToken: string,
  accessTokenSecret: string
): Promise<void> {
  const params: AWS.S3.PutObjectRequest = {
    Bucket: 'zealore', // Your S3 bucket name
    Key: `${userEmail}/twitter/tokens.json`, // The S3 object key
    Body: JSON.stringify({
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

export default async function POST(
  req: NextRequest
) {
  const { pin, userEmail } = await req.json() // Get the PIN and user email from the request body
  const authCookie = req.cookies.get('oauthToken') // Get the oauthToken and oauthTokenSecret from the session
  const consumerKey = process.env.TWITTER_CONSUMER_KEY
  const consumerSecret = process.env.TWITTER_CONSUMER_SECRET
  const callbackUrl = process.env.TWITTER_CALLBACK_URL

  if (!pin || !userEmail) {
    return NextResponse.json({ error: 'PIN and userEmail are required', status: 500 })
  }

  if (!consumerKey || !consumerSecret || !callbackUrl) {
    return NextResponse
      .json({ error: 'Twitter environment variables not set', status: 500 })
  }

  if (!authCookie) {
    return NextResponse.json({ error: "OAuth tokens not found in session."})
  }

  const { oauthToken, oauthTokenSecret } = JSON.parse(authCookie.value)

  const oauth = new OAuth(
    'https://api.twitter.com/oauth/request_token',
    'https://api.twitter.com/oauth/access_token',
    consumerKey,
    consumerSecret,
    '1.0A',
    callbackUrl,
    'HMAC-SHA1'
  )

  // Step 2: Exchange the PIN for an access token
  oauth.getOAuthAccessToken(
    oauthToken,
    oauthTokenSecret,
    pin, // This is the PIN the user provided
    async function (
      error: any,
      accessToken: string,
      accessTokenSecret: string,
      results: any
    ) {
      if (error) {
        return NextResponse
          .json({ error: 'Failed to exchange PIN for access token', status: 200 })
      }

      // Save the access token and secret to S3
      try {
        // Store tokens in S3 using the user's email (this will be a unique path for each user)
        await uploadTokensToS3(userEmail, accessToken, accessTokenSecret)
        return NextResponse.json({ message: 'Tokens successfully uploaded to S3', status: 200 })
      } catch (err) {
        return NextResponse.json({ error: 'Error uploading tokens to S3', status: 200 })
      }
    }
  )
}
