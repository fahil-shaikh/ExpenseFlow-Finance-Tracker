
// Load environment variables
require('dotenv').config()

// Import packages
const express = require('express')
const cors = require('cors')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const db = require('./db')

// Create Express application
const app = express()

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
  ],
}))
app.use(express.json())

// Generate authentication token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  )
}

// Welcome route
app.get('/', (req, res) => {
  res.send('Expense Tracker Backend is Running!')
})

// Test database connection
app.get('/api/health', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT DATABASE() AS databaseName'
    )

    res.json({
      status: 'success',
      message: 'Database connected successfully!',
      database: rows[0].databaseName,
    })

  } catch (error) {
    console.error('Database error:', error.message)

    res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
    })
  }
})

// USER REGISTRATION API
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({
        message: 'All fields are required',
      })
    }

    const cleanName = name.trim()
    const cleanEmail = email.trim().toLowerCase()

    if (!cleanName || cleanName.length > 100) {
      return res.status(400).json({
        message: 'Please enter a valid name',
      })
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({
        message: 'Please enter a valid email address',
      })
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: 'Password must contain at least 8 characters',
      })
    }

    // Check whether email already exists
    const [existingUsers] = await db.execute(
      'SELECT id FROM users WHERE email = ?',
      [cleanEmail]
    )

    if (existingUsers.length > 0) {
      return res.status(409).json({
        message: 'Email is already registered',
      })
    }

    // Hash password before storing
    const passwordHash = await bcrypt.hash(password, 12)

    // Save user in MySQL
    const [result] = await db.execute(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      [cleanName, cleanEmail, passwordHash]
    )

    // Generate login token
    const token = generateToken(result.insertId)

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: {
        id: result.insertId,
        name: cleanName,
        email: cleanEmail,
      },
    })

  } catch (error) {
    console.error('Registration error:', error.message)

    res.status(500).json({
      message: 'Registration failed',
    })
  }
})

// USER LOGIN API
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required',
      })
    }

    const cleanEmail = email.trim().toLowerCase()

    // Find user in database
    const [users] = await db.execute(
      'SELECT * FROM users WHERE email = ?',
      [cleanEmail]
    )

    if (users.length === 0) {
      return res.status(401).json({
        message: 'Invalid email or password',
      })
    }

    const user = users[0]

    // Compare entered password with saved hash
    const isPasswordValid = await bcrypt.compare(
      password,
      user.password_hash
    )

    if (!isPasswordValid) {
      return res.status(401).json({
        message: 'Invalid email or password',
      })
    }

    // Generate login token
    const token = generateToken(user.id)

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    })

  } catch (error) {
    console.error('Login error:', error.message)

    res.status(500).json({
      message: 'Login failed',
    })
  }
})

// AUTHENTICATION MIDDLEWARE
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization

  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({
      message: 'Access denied. Please login.',
    })
  }

  jwt.verify(token, process.env.JWT_SECRET, (error, decoded) => {
    if (error) {
      return res.status(403).json({
        message: 'Invalid or expired token',
      })
    }

    req.userId = decoded.userId
    next()
  })
}

// GET ALL TRANSACTIONS FOR LOGGED-IN USER
app.get('/api/transactions', authenticateToken, async (req, res) => {
  try {
    const [transactions] = await db.execute(
      `SELECT
        id,
        title,
        category,
        amount,
        type,
        DATE_FORMAT(transaction_date, '%Y-%m-%d') AS transaction_date,
        description
       FROM transactions
       WHERE user_id = ?
       ORDER BY transaction_date DESC, id DESC`,
      [req.userId]
    )

    res.json(transactions)

  } catch (error) {
    console.error('Fetch transactions error:', error.message)

    res.status(500).json({
      message: 'Failed to fetch transactions',
    })
  }
})

// ADD INCOME OR EXPENSE
app.post('/api/transactions', authenticateToken, async (req, res) => {
  try {
    const {
      title,
      category,
      amount,
      type,
      transaction_date,
      description,
    } = req.body

    // Validate required fields
    if (!title || !category || !amount || !type || !transaction_date) {
      return res.status(400).json({
        message: 'Please provide all required transaction details',
      })
    }

    // Validate amount
    const numericAmount = Number(amount)

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        message: 'Amount must be greater than zero',
      })
    }

    // Validate transaction type
    if (!['income', 'expense'].includes(type)) {
      return res.status(400).json({
        message: 'Type must be income or expense',
      })
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(transaction_date)) {
      return res.status(400).json({
        message: 'Please provide a valid date',
      })
    }

    // Save transaction in MySQL
    const [result] = await db.execute(
      `INSERT INTO transactions
       (user_id, title, category, amount, type, transaction_date, description)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        req.userId,
        title.trim(),
        category.trim(),
        numericAmount,
        type,
        transaction_date,
        description || null,
      ]
    )

    res.status(201).json({
      message: 'Transaction added successfully',
      transactionId: result.insertId,
    })

  } catch (error) {
    console.error('Add transaction error:', error.message)

    res.status(500).json({
      message: 'Failed to add transaction',
    })
  }
})

 // DELETE TRANSACTION
app.delete('/api/transactions/:id', authenticateToken, async (req, res) => {
  try {
    const transactionId = Number(req.params.id)

    if (!Number.isInteger(transactionId) || transactionId <= 0) {
      return res.status(400).json({
        message: 'Invalid transaction ID',
      })
    }

    const [result] = await db.execute(
      'DELETE FROM transactions WHERE id = ? AND user_id = ?',
      [transactionId, req.userId]
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: 'Transaction not found',
      })
    }

    res.json({
      message: 'Transaction deleted successfully',
    })

  } catch (error) {
    console.error('Delete transaction error:', error.message)

    res.status(500).json({
      message: 'Failed to delete transaction',
    })
  }
})

// EDIT TRANSACTION
app.put('/api/transactions/:id', authenticateToken, async (req, res) => {
  try {
    const transactionId = Number(req.params.id)

    const {
      title,
      category,
      amount,
      type,
      transaction_date,
      description,
    } = req.body

    // Validate transaction ID
    if (!Number.isInteger(transactionId) || transactionId <= 0) {
      return res.status(400).json({
        message: 'Invalid transaction ID',
      })
    }

    // Validate required fields
    if (
      typeof title !== 'string' || !title.trim() ||
      typeof category !== 'string' || !category.trim() ||
      amount === undefined || amount === null || amount === '' ||
      !type || !transaction_date
    ) {
      return res.status(400).json({
        message: 'Please provide all required transaction details',
      })
    }

    const numericAmount = Number(amount)

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        message: 'Amount must be greater than zero',
      })
    }

    if (!['income', 'expense'].includes(type)) {
      return res.status(400).json({
        message: 'Type must be income or expense',
      })
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(transaction_date)) {
      return res.status(400).json({
        message: 'Please provide a valid date',
      })
    }

    // Check that this transaction belongs to the logged-in user
    const [existing] = await db.execute(
      'SELECT id FROM transactions WHERE id = ? AND user_id = ?',
      [transactionId, req.userId]
    )

    if (existing.length === 0) {
      return res.status(404).json({
        message: 'Transaction not found',
      })
    }

    // Update transaction in MySQL
    await db.execute(
      `UPDATE transactions
       SET title = ?, category = ?, amount = ?, type = ?,
           transaction_date = ?, description = ?
       WHERE id = ? AND user_id = ?`,
      [
        title.trim(),
        category.trim(),
        numericAmount,
        type,
        transaction_date,
        description || null,
        transactionId,
        req.userId,
      ]
    )

    res.json({
      message: 'Transaction updated successfully',
      transactionId,
    })

  } catch (error) {
    console.error('Update transaction error:', error.message)

    res.status(500).json({
      message: 'Failed to update transaction',
    })
  }
})


// GET MONTHLY BUDGETS
app.get('/api/budgets', authenticateToken, async (req, res) => {
  try {
    const { month } = req.query

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({
        message: 'Please provide a valid month in YYYY-MM format',
      })
    }

    const budgetMonth = `${month}-01`

    const [budgets] = await db.execute(
      `SELECT id, category, budget_amount,
              DATE_FORMAT(budget_month, '%Y-%m') AS budget_month
       FROM monthly_budgets
       WHERE user_id = ? AND budget_month = ?
       ORDER BY category`,
      [req.userId, budgetMonth]
    )

    res.json(budgets)

  } catch (error) {
    console.error('Fetch budgets error:', error.message)

    res.status(500).json({
      message: 'Failed to fetch budgets',
    })
  }
})

// ADD OR UPDATE MONTHLY BUDGET
app.post('/api/budgets', authenticateToken, async (req, res) => {
  try {
    const { category, budget_amount, budget_month } = req.body

    if (
      typeof category !== 'string' ||
      !category.trim() ||
      category.trim().length > 100 ||
      budget_amount === undefined ||
      budget_amount === null ||
      budget_amount === '' ||
      !budget_month ||
      !/^\d{4}-\d{2}$/.test(budget_month)
    ) {
      return res.status(400).json({
        message: 'Please provide valid budget details',
      })
    }

    const numericAmount = Number(budget_amount)

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        message: 'Budget amount must be greater than zero',
      })
    }

    const budgetMonth = `${budget_month}-01`

    await db.execute(
      `INSERT INTO monthly_budgets
       (user_id, category, budget_amount, budget_month)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       budget_amount = VALUES(budget_amount)`,
      [
        req.userId,
        category.trim(),
        numericAmount,
        budgetMonth,
      ]
    )

    res.status(200).json({
      message: 'Monthly budget saved successfully',
    })

  } catch (error) {
    console.error('Save budget error:', error.message)

    res.status(500).json({
      message: 'Failed to save monthly budget',
    })
  }
})

// Start server
const PORT = process.env.PORT || 5000

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is missing from .env')
}

app.listen(PORT, () => {
  console.log(
    `Expense Tracker server running at http://localhost:${PORT}`
  )
})
