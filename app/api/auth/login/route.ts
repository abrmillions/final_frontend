import { type NextRequest, NextResponse } from "next/server"
import bcryptjs from "bcryptjs"

interface User {
  id: string
  email: string
  password: string
  name: string
  role: string
  phone: string
  createdAt: string
}

// In-memory storage (replace with database in production)
const users: User[] = []

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Validate input
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Find user
    const user = users.find((u) => u.email === email)

    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    // Compare passwords
    const isValidPassword = await bcryptjs.compare(password, user.password)

    if (!isValidPassword) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    // Return user data (excluding password)
    const { password: _, ...userWithoutPassword } = user

    // Set HTTP-only cookie for session
    const response = NextResponse.json({
      success: true,
      user: userWithoutPassword,
    })

    response.cookies.set("clms_session", JSON.stringify({ userId: user.id, email: user.email, role: user.role }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return response
  } catch (error) {
    console.error("[clms] Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
