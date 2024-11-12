// app/api/create-bot/route.ts
import { NextResponse } from 'next/server'
import mysql from 'mysql2'

// Define a type for the bot creation data
interface BotData {
  email: string
  accessToken: string
  serverDomain: string
  botName: string
}

// POST API route to create the bot in the database
export async function POST(req: Request) {
  const endpoint = process.env.RDS_ENDPOINT
  const username = process.env.RDS_USERNAME
  const password = process.env.RDS_PASSWORD
  const database = process.env.RDS_DATABASE

  // Ensure mysql credentials are not undefined
  if (!endpoint || !username || password || database) {
    return NextResponse.json({
      error: 'Your DB credentials are missing.',
      status: 500,
    })
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
    // Parse the incoming JSON request body
    const { email, accessToken, serverDomain, botName }: BotData =
      await req.json()

    // SQL query to insert bot data into the table
    const query = `
      INSERT INTO bots (email, access_token, server_domain, bot_name)
      VALUES (?,?, ?, ?)
    `

    // Execute the query
    const [results] = await pool
      .promise()
      .execute(query, [email, accessToken, serverDomain, botName])

    // Respond with success
    return NextResponse.json(
      { message: 'Bot created successfully' },
      { status: 200 }
    )
  } catch (err) {
    console.error('Error inserting data:', err)
    // Respond with an error
    return NextResponse.json({ message: 'Error creating bot' }, { status: 500 })
  }
}
