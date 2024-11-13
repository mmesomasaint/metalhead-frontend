import { NextResponse, NextRequest } from 'next/server'
import mysql, { Pool, RowDataPacket } from 'mysql2'

// Define types for bot creation data
interface BotData {
  email: string
  accessToken: string
  serverDomain: string
  botName: string
}

// Define types for MySQL query results
interface BotCheckResult extends RowDataPacket {
  count: number
}

interface InsertResult extends RowDataPacket {
  insertId: number
}

// Database connection pool configuration
function createPool(): Pool {
  const { RDS_ENDPOINT, RDS_USERNAME, RDS_PASSWORD, RDS_DATABASE } = process.env
  if (!RDS_ENDPOINT || !RDS_USERNAME || !RDS_PASSWORD || !RDS_DATABASE) {
    throw new Error('Your DB credentials are missing.')
  }

  return mysql.createPool({
    host: RDS_ENDPOINT,
    user: RDS_USERNAME,
    password: RDS_PASSWORD,
    database: RDS_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  })
}

// Create the table (run this only once during app setup or migration)
async function createBotTable(pool: Pool) {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS bots (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      access_token VARCHAR(255) NOT NULL,
      server_domain VARCHAR(255) NOT NULL,
      bot_name VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_bot (bot_name, server_domain)
    );
  `

  const connection = await pool.promise().getConnection()
  try {
    await connection.query(createTableQuery)
    console.log('Table "bots" ensured to exist.')
  } catch (err) {
    console.error('Error creating table:', err)
    throw new Error('Error ensuring the table exists.')
  } finally {
    connection.release()
  }
}

// Helper function to check if the bot already exists
async function botExists(
  pool: Pool,
  email: string,
  accessToken: string,
  serverDomain: string
): Promise<boolean> {
  const checkQuery = `
    SELECT COUNT(*) AS count
    FROM bots
    WHERE email = ? AND access_token = ? AND server_domain = ?
  `
  const [rows] = await pool
    .promise()
    .execute<BotCheckResult[]>(checkQuery, [email, accessToken, serverDomain])
  return rows[0].count > 0
}

// Helper function to insert a new bot into the database
async function insertBot(
  pool: Pool,
  email: string,
  accessToken: string,
  serverDomain: string,
  botName: string
): Promise<InsertResult> {
  const insertQuery = `
    INSERT INTO bots (email, access_token, server_domain, bot_name)
    VALUES (?, ?, ?, ?)
  `
  const [result] = await pool
    .promise()
    .execute<InsertResult[]>(insertQuery, [
      email,
      accessToken,
      serverDomain,
      botName,
    ])
  return result[0]
}

// POST API route to create the bot in the database
export async function POST(req: NextRequest) {
  const { email, accessToken, serverDomain, botName }: BotData =
    await req.json()

  // Ensure request came with payload
  if (!email || !accessToken || !serverDomain || !botName) {
    return NextResponse.json(
      { error: 'Request made with incomplete payload' },
      { status: 403 }
    )
  }

  try {
    const pool = createPool()

    // Ensure the table exists during app initialization (one-time setup)
    await createBotTable(pool)

    // Check if bot already exists
    if (await botExists(pool, email, accessToken, serverDomain)) {
      return NextResponse.json(
        { error: 'Duplicate bot detected' },
        { status: 400 }
      )
    }

    // Insert new bot into the database
    const insertResults = await insertBot(
      pool,
      email,
      accessToken,
      serverDomain,
      botName
    )

    // Redirect user to the home page
    const homePage = req.headers.get('origin')!
    const response = NextResponse.redirect(homePage)

    // Set cookie options
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
    }

    // Store db results in cookie
    response.cookies.set(
      'details',
      JSON.stringify(insertResults),
      cookieOptions
    )

    return response
  } catch (err) {
    console.error('Error processing request:', err)
    return NextResponse.json({ message: 'Error creating bot' }, { status: 500 })
  }
}
