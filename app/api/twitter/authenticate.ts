import { OAuth } from 'oauth'
import { withIronSession } from 'next-iron-session'
import { NextApiRequest, NextApiResponse } from 'next'

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  const { userEmail } = req.body // Get the user email from the request body
  const consumerKey = process.env.TWITTER_CONSUMER_KEY
  const consumerSecret = process.env.TWITTER_CONSUMER_SECRET
  const callbackUrl = process.env.TWITTER_CALLBACK_URL

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

  oauth.getOAuthRequestToken(async function (
    error: any,
    oauthToken: string,
    oauthTokenSecret: string,
    results: any
  ) {
    if (error) {
      return res
        .status(500)
        .json({ error: 'Failed to get request token from Twitter' })
    }

    // Store oauthToken and oauthTokenSecret in S3
    try {
      // Store oauthToken and oauthTokenSecret in the session
      req.session.set('oauthToken', { oauthToken, oauthTokenSecret }) // Save oauthToken in session
      req.session.save() // Save the session to cookie

      const url = `https://api.twitter.com/oauth/authorize?oauth_token=${oauthToken}`
      res.status(200).json({ url }) // Return the URL for the user to go and authorize
    } catch (err) {
      res.status(500).json({ error: 'Error uploading tokens to S3' })
    }
  })
}

// Wrap the handler with the session middleware
export default withIronSession(handler, {
  password: process.env.SECRET_COOKIE_PASSWORD || 'default-password', // A strong password for encrypting the cookies
  cookieName: 'metal-head-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
  },
})
