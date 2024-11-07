import { OAuth } from 'oauth'
import AWS from 'aws-sdk'
import { withIronSession } from 'next-iron-session'
import { NextApiRequest, NextApiResponse } from 'next'

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

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  const { pin, userEmail } = req.body // Get the PIN and user email from the request body
  const { oauthToken, oauthTokenSecret } = req.session.get('oauthToken') // Get the oauthToken and oauthTokenSecret from the session
  const consumerKey = process.env.TWITTER_CONSUMER_KEY
  const consumerSecret = process.env.TWITTER_CONSUMER_SECRET
  const callbackUrl = process.env.TWITTER_CALLBACK_URL

  if (!pin || !userEmail) {
    return res.status(400).json({ error: 'PIN and userEmail are required' })
  }

  if (!oauthToken || !oauthTokenSecret) {
    return res.status(500).json({ error: 'OAuth tokens not found in session' })
  }

  if (!consumerKey || !consumerSecret || !callbackUrl) {
    return res
      .status(500)
      .json({ error: 'Twitter environment variables not set' })
  }

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
        return res
          .status(500)
          .json({ error: 'Failed to exchange PIN for access token' })
      }

      // Save the access token and secret to S3
      try {
        // Store tokens in S3 using the user's email (this will be a unique path for each user)
        await uploadTokensToS3(userEmail, accessToken, accessTokenSecret)
        res.status(200).json({ message: 'Tokens successfully uploaded to S3' })
      } catch (err) {
        res.status(500).json({ error: 'Error uploading tokens to S3' })
      }
    }
  )
}

// Wrap the handler with the session middleware
export default withIronSession(handler, {
  password: process.env.SECRET_COOKIE_PASSWORD || 'default-password', // A strong password for encrypting the cookies
  cookieName: 'metal-head-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
  },
})
