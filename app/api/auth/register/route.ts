import { type NextRequest, NextResponse } from "next/server"
import bcryptjs from "bcryptjs"

interface User {
  id: string
  email: string
  password: string
  fullName: string
  phone: string
  role: string
  profilePhoto?: string
  createdAt: string
}

// In-memory storage (replace with database in production)
let users: User[] = []

export async function POST(request: NextRequest) {
  try {
    const { email, password, confirmPassword, fullName, phone, role } = await request.json()

    // Validate input
    if (!email || !password || !confirmPassword || !fullName || !phone || !role) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: "Passwords do not match" }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
    }

    // Check if user already exists
    if (users.some((u) => u.email === email)) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 409 })
    }

    // Hash password with bcrypt
    const hashedPassword = await bcryptjs.hash(password, 10)

    // Create new user
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      email,
      password: hashedPassword,
      fullName,
      phone,
      role,
      createdAt: new Date().toISOString(),
    }

    users.push(newUser)

    // Return user data (excluding password)
    const { password: _, ...userWithoutPassword } = newUser

    // Set HTTP-only cookie for session
    const response = NextResponse.json(
      {
        success: true,
        user: userWithoutPassword,
      },
      { status: 201 },
    )

    response.cookies.set(
      "clms_session",
      JSON.stringify({ userId: newUser.id, email: newUser.email, role: newUser.role }),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      },
    )

    return response
  } catch (error) {
    console.error("[clms] Registration error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
