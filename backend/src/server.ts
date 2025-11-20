import express from 'express'
import cors from 'cors'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const app = express()
const PORT = process.env.PORT || 5000
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

// Middleware
app.use(cors())
app.use(express.json())

// In-memory user store (replace with database in production)
const users: Array<{
  id: string
  name: string
  email: string
  password: string
}> = []

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'passio-tour-backend',
    environment: process.env.NODE_ENV || 'development'
  })
})

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Passio Tour API - Hot Reload Working! 🔥',
    version: '1.0.0',
    status: 'running',
    hotReload: true
  })
})

// Register endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' })
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' })
    }

    // Check if user exists
    const existingUser = users.find(u => u.email === email)
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user = {
      id: Date.now().toString(),
      name,
      email,
      password: hashedPassword
    }

    users.push(user)

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    })
  } catch (error) {
    console.error('Register error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body

    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' })
    }

    // Find user
    const user = users.find(u => u.email === email)
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// Get current user endpoint
app.get('/api/auth/me', (req, res) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string }

    const user = users.find(u => u.id === decoded.id)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    })
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' })
  }
})

// Tours endpoint - return demo data
app.get('/api/v1/tours', (req, res) => {
  // Demo tours data matching our seeded database
  const tours = [
    {
      id: '1',
      title: 'Bali Island Paradise Experience',
      slug: 'bali-island-paradise',
      description: 'Discover the magical island of Bali with its pristine beaches, ancient temples, and lush rice terraces. This comprehensive tour takes you through the cultural heart of Indonesia.',
      base_price: 1299,
      type: 'beach',
      difficulty_level: 'easy',
      duration_days: 7,
      min_group_size: 2,
      max_group_size: 12,
      is_active: true,
      operator: {
        full_name: 'Bali Adventures DMC'
      },
      images: [
        {
          url: '/api/placeholder/400/300',
          alt_text: 'Bali Beach Paradise',
          is_primary: true
        }
      ],
      categories: [
        {
          category: {
            name: 'Beach Tours',
            slug: 'beach-tours'
          }
        }
      ]
    },
    {
      id: '2',
      title: 'Japan Cultural Discovery',
      slug: 'japan-cultural-discovery',
      description: 'Immerse yourself in the rich culture of Japan, from ancient temples in Kyoto to the bustling streets of Tokyo. Experience traditional tea ceremonies and modern innovation.',
      base_price: 1899,
      type: 'cultural',
      difficulty_level: 'moderate',
      duration_days: 10,
      min_group_size: 4,
      max_group_size: 8,
      is_active: true,
      operator: {
        full_name: 'Japan Explorer Tours'
      },
      images: [
        {
          url: '/api/placeholder/400/300',
          alt_text: 'Traditional Japanese Temple',
          is_primary: true
        }
      ],
      categories: [
        {
          category: {
            name: 'Cultural Tours',
            slug: 'cultural-tours'
          }
        }
      ]
    },
    {
      id: '3',
      title: 'Singapore City Explorer',
      slug: 'singapore-city-explorer',
      description: 'Explore the vibrant city-state of Singapore with its futuristic architecture, diverse neighborhoods, and world-class attractions.',
      base_price: 899,
      type: 'city',
      difficulty_level: 'easy',
      duration_days: 5,
      min_group_size: 2,
      max_group_size: 15,
      is_active: true,
      operator: {
        full_name: 'Singapore Discovery Co'
      },
      images: [
        {
          url: '/api/placeholder/400/300',
          alt_text: 'Singapore Skyline',
          is_primary: true
        }
      ],
      categories: [
        {
          category: {
            name: 'City Tours',
            slug: 'city-tours'
          }
        }
      ]
    },
    {
      id: '4',
      title: 'Thailand Adventure Trek',
      slug: 'thailand-adventure-trek',
      description: 'Trek through the lush jungles of northern Thailand, visit hill tribes, and experience the authentic local culture away from tourist crowds.',
      base_price: 749,
      type: 'adventure',
      difficulty_level: 'challenging',
      duration_days: 8,
      min_group_size: 3,
      max_group_size: 10,
      is_active: true,
      operator: {
        full_name: 'Thai Adventure Tours'
      },
      images: [
        {
          url: '/api/placeholder/400/300',
          alt_text: 'Thai Jungle Trek',
          is_primary: true
        }
      ],
      categories: [
        {
          category: {
            name: 'Adventure Tours',
            slug: 'adventure-tours'
          }
        }
      ]
    },
    {
      id: '5',
      title: 'Malaysia Historical Journey',
      slug: 'malaysia-historical-journey',
      description: "Journey through Malaysia's rich history, from colonial architecture in Penang to the ancient temples of the Cameron Highlands.",
      base_price: 1199,
      type: 'historical',
      difficulty_level: 'moderate',
      duration_days: 6,
      min_group_size: 2,
      max_group_size: 12,
      is_active: true,
      operator: {
        full_name: 'Heritage Malaysia Tours'
      },
      images: [
        {
          url: '/api/placeholder/400/300',
          alt_text: 'Historical Malaysian Architecture',
          is_primary: true
        }
      ],
      categories: [
        {
          category: {
            name: 'Historical Tours',
            slug: 'historical-tours'
          }
        }
      ]
    },
    {
      id: '6',
      title: 'Bangkok Urban Experience',
      slug: 'bangkok-urban-experience',
      description: 'Discover the energy of Bangkok with its street food, floating markets, and vibrant nightlife combined with modern shopping districts.',
      base_price: 599,
      type: 'city',
      difficulty_level: 'easy',
      duration_days: 4,
      min_group_size: 1,
      max_group_size: 20,
      is_active: true,
      operator: {
        full_name: 'Bangkok Urban Tours'
      },
      images: [
        {
          url: '/api/placeholder/400/300',
          alt_text: 'Bangkok Cityscape',
          is_primary: true
        }
      ],
      categories: [
        {
          category: {
            name: 'City Tours',
            slug: 'city-tours'
          }
        }
      ]
    }
  ]

  res.json({
    success: true,
    tours: tours,
    count: tours.length
  })
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`)
  console.log(`📍 Health check: http://localhost:${PORT}/health`)
  console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`)
})

export default app
