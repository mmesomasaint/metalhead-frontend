import { NextResponse, NextRequest } from 'next/server'
import * as admin from 'firebase-admin'

// Define types for bot creation data
interface BotData {
  email: string
  accessToken: string
  serverDomain: string
  botName: string
}

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  if (!serviceAccount) {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set.'
    )
  }

  try {
    const parsedServiceAccount = JSON.parse(serviceAccount)
    admin.initializeApp({
      credential: admin.credential.cert(parsedServiceAccount),
    })
  } catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error)
    throw new Error('Failed to initialize Firebase Admin SDK.')
  }
}

const db = admin.firestore()

// Helper function to check if a bot already exists
async function botExists(
  email: string,
  accessToken: string,
  serverDomain: string
): Promise<boolean> {
  const botsRef = db.collection('bots')
  const snapshot = await botsRef
    .where('email', '==', email)
    .where('access_token', '==', accessToken)
    .where('server_domain', '==', serverDomain)
    .get()

  return !snapshot.empty
}

// Helper function to insert a new bot into Firestore
async function insertBot(
  email: string,
  accessToken: string,
  serverDomain: string,
  botName: string
): Promise<admin.firestore.DocumentReference> {
  const botsRef = db.collection('bots')
  const newBotRef = await botsRef.add({
    email,
    access_token: accessToken,
    server_domain: serverDomain,
    bot_name: botName,
    created_at: admin.firestore.FieldValue.serverTimestamp(),
    updated_at: admin.firestore.FieldValue.serverTimestamp(),
  })

  return newBotRef
}

// POST API route to create the bot in Firestore
export async function POST(req: NextRequest) {
  const appOrigin = process.env.APP_ORIGIN
  const { email, accessToken, serverDomain, botName }: BotData =
    await req.json()

  // Ensure request came with payload
  if (!email || !accessToken || !serverDomain || !botName) {
    return NextResponse.json(
      { error: 'Twitter authentication required' },
      { status: 403 }
    )
  }

  // Ensure the app origin is set
  if (!appOrigin) {
    return NextResponse.json({ error: 'Error loading application' }, { status: 500 })
  }

  try {
    // Check if bot already exists in Firestore
    if (await botExists(email, accessToken, serverDomain)) {
      return NextResponse.json(
        { error: 'Bot already exists' },
        { status: 400 }
      )
    }

    // Insert new bot into Firestore
    const newBotRef = await insertBot(email, accessToken, serverDomain, botName)

    // Redirect user to the home page
    const response = NextResponse.redirect(appOrigin)

    // Set cookie options
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
    }

    // Store the document reference in the cookie (you could store more details here)
    response.cookies.set(
      'details',
      JSON.stringify({ id: newBotRef.id, email, botName }),
      cookieOptions
    )

    return response
  } catch (err) {
    console.error('Error processing request:', err)
    return NextResponse.json({ message: 'Error creating bot' }, { status: 500 })
  }
}
