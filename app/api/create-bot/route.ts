// app/api/create-bot/route.ts
import { NextResponse, NextRequest } from 'next/server'
import mysql from 'mysql2'

// Define a type for the bot creation data
interface BotData {
  email: string
  accessToken: string
  serverDomain: string
  botName: string
}

// POST API route to create the bot in the database
export async function POST(req: NextRequest) {
  // Parse the incoming JSON request body
  const { email, accessToken, serverDomain, botName }: BotData =
    await req.json()

  const endpoint = process.env.RDS_ENDPOINT
  const username = process.env.RDS_USERNAME
  const password = process.env.RDS_PASSWORD
  const database = process.env.RDS_DATABASE

  // Ensure request came with payload
  if (!email || !accessToken || !serverDomain || !botName) {
    return NextResponse.json(
      { error: 'Request made with incomplete payload' },
      { status: 403 }
    )
  }

  // Ensure mysql credentials are not undefined
  if (!endpoint || !username || !password || !database) {
    return NextResponse.json(
      { error: 'Your DB credentials are missing.' },
      { status: 500 }
    )
  }

  // MySQL connection pool
  const pool = mysql.createPool({
    host: endpoint,
    user: username,
    password: password,
    database: database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  })

  try {
    // SQL query to check if a bot with the same email, accessToken, and serverDomain already exists
    const checkQuery = `
      SELECT COUNT(*) AS count
      FROM bots
      WHERE email = ? AND access_token = ? AND server_domain = ?
    `

    // Execute the check query
    const [rows] = await pool
      .promise()
      .execute(checkQuery, [email, accessToken, serverDomain])
    const botCount = (rows as const)[0].count

    // If a bot already exists with the same details, return an error
    if (botCount > 0) {
      return NextResponse.json(
        { error: 'Duplicate bot detected' },
        { status: 400 }
      )
    }

    // SQL query to insert bot data into the table
    const insertQuery = `
      INSERT INTO bots (email, access_token, server_domain, bot_name)
      VALUES (?, ?, ?, ?)
    `

    // Execute the insert query
    const [results] = await pool
      .promise()
      .execute(insertQuery, [email, accessToken, serverDomain, botName])

    // Respond with success
    return NextResponse.json(
      { message: 'Bot created successfully', body: results },
      { status: 200 }
    )
  } catch (err) {
    console.error('Error inserting data:', err)
    // Respond with an error
    return NextResponse.json({ message: 'Error creating bot' }, { status: 500 })
  }
}
