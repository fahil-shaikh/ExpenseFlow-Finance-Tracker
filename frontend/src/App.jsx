
import { useEffect, useState } from 'react'
import {
  LayoutDashboard,
  ArrowLeftRight,
  ChartPie,
  Wallet,
  Settings,
  Bell,
  Search,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  CalendarDays,
  Utensils,
  CarFront,
  ShoppingBag,
  House,
  BriefcaseBusiness,
} from 'lucide-react'

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'

import './App.css'
import Auth from './Auth'
function App() {

const [token, setToken] = useState(
  () => localStorage.getItem('expenseToken')
)

const [user, setUser] = useState(() => {
  try {
    return JSON.parse(localStorage.getItem('expenseUser') || 'null')
  } catch {
    return null
  }
})

const [transactions, setTransactions] = useState([])

const [budgets, setBudgets] = useState([])
const [budgetMonth, setBudgetMonth] = useState(() => {
  const today = new Date()

  return `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, '0')}`
})

const [isLoadingBudgets, setIsLoadingBudgets] = useState(false)
const [budgetError, setBudgetError] = useState('')

// MONTHLY BUDGET FORM STATES
const [showBudgetModal, setShowBudgetModal] = useState(false)
const [isSavingBudget, setIsSavingBudget] = useState(false)
const [budgetFormError, setBudgetFormError] = useState('')

const [budgetFormData, setBudgetFormData] = useState({
  category: '',
  budget_amount: '',
})


// TRANSACTION SEARCH AND FILTERS
const [searchTerm, setSearchTerm] = useState('')
const [typeFilter, setTypeFilter] = useState('all')
const [categoryFilter, setCategoryFilter] = useState('all')
const [isLoadingTransactions, setIsLoadingTransactions] = useState(false)
const [transactionError, setTransactionError] = useState('')

const [showTransactionModal, setShowTransactionModal] = useState(false)
const [editingTransactionId, setEditingTransactionId] = useState(null)
const [isSaving, setIsSaving] = useState(false)
const [formError, setFormError] = useState('')

const [formData, setFormData] = useState(() => {
  const today = new Date()
  const localDate = `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  return {
    title: '',
    category: '',
    amount: '',
    type: 'expense',
    transaction_date: localDate,
    description: '',
  }
})


// Save login information

// Save login information
const handleAuthenticated = (data) => {
  localStorage.setItem('expenseToken', data.token)
  localStorage.setItem('expenseUser', JSON.stringify(data.user))

  setToken(data.token)
  setUser(data.user)
}
// LOGOUT FUNCTION
const handleLogout = () => {
  localStorage.removeItem('expenseToken')
  localStorage.removeItem('expenseUser')

  setToken(null)
  setUser(null)
  setTransactions([])
}
// ADD TRANSACTION FUNCTION
const handleAddTransaction = async (e) => {
  e.preventDefault()
  setFormError('')
  setIsSaving(true)

  try {
    const response = await fetch(
      'http://localhost:5000/api/transactions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          amount: Number(formData.amount),
        }),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Unable to save transaction')
    }

    setTransactions((previous) => [
      {
        id: data.transactionId,
        ...formData,
        amount: Number(formData.amount),
      },
      ...previous,
    ])

    setFormData((previous) => ({
      ...previous,
      title: '',
      category: '',
      amount: '',
      type: 'expense',
      description: '',
    }))

    setShowTransactionModal(false)

  } catch (error) {
    setFormError(error.message)
  } finally {
    setIsSaving(false)
  }
}

const handleUpdateTransaction = async (e) => {
  e.preventDefault()
  setFormError('')
  setIsSaving(true)

  try {
    const response = await fetch(
      `http://localhost:5000/api/transactions/${editingTransactionId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          amount: Number(formData.amount),
        }),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Unable to update transaction')
    }

    setTransactions((previous) =>
      previous.map((item) =>
        Number(item.id) === Number(editingTransactionId)
          ? {
              ...item,
              ...formData,
              amount: Number(formData.amount),
            }
          : item
      )
    )

    setShowTransactionModal(false)
    setEditingTransactionId(null)

    setFormData((previous) => ({
      ...previous,
      title: '',
      category: '',
      amount: '',
      type: 'expense',
      description: '',
    }))

    window.alert('Transaction updated successfully!')

  } catch (error) {
    setFormError(error.message)
  } finally {
    setIsSaving(false)
  }
}

// OPEN TRANSACTION FOR EDITING
const handleEditClick = (item) => {
  setFormError('')
  setEditingTransactionId(item.id)

  setFormData({
    title: item.title,
    category: item.category,
    amount: String(item.amount),
    type: item.type,
    transaction_date: String(item.transaction_date).slice(0, 10),
    description: item.description || '',
  })

  setShowTransactionModal(true)
}

// DELETE TRANSACTION FUNCTION
const handleDeleteTransaction = async (transactionId) => {
  const confirmed = window.confirm(
    'Are you sure you want to delete this transaction?'
  )

  if (!confirmed) return

  try {
    const response = await fetch(
      `http://localhost:5000/api/transactions/${transactionId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Unable to delete transaction')
    }

    setTransactions((previous) =>
      previous.filter(
        (item) => Number(item.id) !== Number(transactionId)
      )
    )

    window.alert('Transaction deleted successfully!')

  } catch (error) {
    window.alert(`Delete failed: ${error.message}`)
  }
}


// SAVE MONTHLY BUDGET
const handleSaveBudget = async (e) => {
  e.preventDefault()
  setBudgetFormError('')
  setIsSavingBudget(true)

  try {
    const response = await fetch(
      'http://localhost:5000/api/budgets',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          category: budgetFormData.category,
          budget_amount: Number(budgetFormData.budget_amount),
          budget_month: budgetMonth,
        }),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Unable to save budget')
    }

    const savedBudget = {
      category: budgetFormData.category,
      budget_amount: Number(budgetFormData.budget_amount),
      budget_month: budgetMonth,
    }

    setBudgets((previous) => {
      const existing = previous.some(
        (item) => item.category === savedBudget.category
      )

      if (existing) {
        return previous.map((item) =>
          item.category === savedBudget.category
            ? { ...item, ...savedBudget }
            : item
        )
      }

      return [...previous, savedBudget]
    })

    setBudgetFormData({
      category: '',
      budget_amount: '',
    })

    setShowBudgetModal(false)

    window.alert('Monthly budget saved successfully!')

  } catch (error) {
    setBudgetFormError(error.message)
  } finally {
    setIsSavingBudget(false)
  }
}

// Fetch transactions from MySQL
useEffect(() => {
  if (!token) return

  let cancelled = false

  const fetchTransactions = async () => {
    setIsLoadingTransactions(true)
    setTransactionError('')

    try {
      const response = await fetch(
        'http://localhost:5000/api/transactions',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Unable to fetch transactions')
      }

      if (!cancelled) {
        setTransactions(
          data.map((item) => ({
            ...item,
            amount: Number(item.amount),
          }))
        )
      }

    } catch (error) {
      if (!cancelled) {
        setTransactionError(error.message)
      }
    } finally {
      if (!cancelled) {
        setIsLoadingTransactions(false)
      }
    }
  }

  fetchTransactions()

  return () => {
    cancelled = true
  }
}, [token])

// FETCH MONTHLY BUDGETS FROM MYSQL
useEffect(() => {
  if (!token) return

  let cancelled = false

  const fetchBudgets = async () => {
    setIsLoadingBudgets(true)
    setBudgetError('')

    try {
      const response = await fetch(
        `http://localhost:5000/api/budgets?month=${budgetMonth}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Unable to fetch budgets')
      }

      if (!cancelled) {
        setBudgets(
          data.map((item) => ({
            ...item,
            budget_amount: Number(item.budget_amount),
          }))
        )
      }

    } catch (error) {
      if (!cancelled) {
        setBudgetError(error.message)
      }
    } finally {
      if (!cancelled) {
        setIsLoadingBudgets(false)
      }
    }
  }

  fetchBudgets()

  return () => {
    cancelled = true
  }
}, [token, budgetMonth])


  const totalIncome = transactions
    .filter((item) => item.type === 'income')
    .reduce((total, item) => total + item.amount, 0)

  const totalExpenses = transactions
    .filter((item) => item.type === 'expense')
    .reduce((total, item) => total + item.amount, 0)

  const balance = totalIncome - totalExpenses

const categoryData = transactions
  .filter((item) => item.type === 'expense')
  .reduce((categories, item) => {
    const category = item.category || 'Other'

    const existing = categories.find(
      (entry) => entry.name === category
    )

    if (existing) {
      existing.value += Number(item.amount)
    } else {
      categories.push({
        name: category,
        value: Number(item.amount),
      })
    }

    return categories
  }, [])
  const categoryColors = [
  '#6558e8',
  '#18a878',
  '#ff8c83',
  '#428cda',
  '#f4b942',
  '#9b59b6',
  '#20b8b0',
  '#e879a9',
]



const monthlyData = (() => {
  const now = new Date()

  // Create the last six months
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(
      now.getFullYear(),
      now.getMonth() - (5 - index),
      1
    )

    const key = `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, '0')}`

    return {
      key,
      month: date.toLocaleDateString('en-IN', {
        month: 'short',
      }),
      income: 0,
      expenses: 0,
    }
  })

  // Match transactions with their months
  const monthMap = new Map(
    months.map((month) => [month.key, month])
  )

  transactions.forEach((item) => {
    const date = String(item.transaction_date).slice(0, 10)
    const key = date.slice(0, 7)

    const month = monthMap.get(key)

    if (!month) return

    if (item.type === 'income') {
      month.income += Number(item.amount)
    } else if (item.type === 'expense') {
      month.expenses += Number(item.amount)
    }
  })

  return months
})()



  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const categoryIcons = {
    Housing: House,
    Shopping: ShoppingBag,
    Food: Utensils,
    Transport: CarFront,
    Salary: BriefcaseBusiness,
    Freelance: BriefcaseBusiness,
  }

// FILTER TRANSACTIONS
const filteredTransactions = transactions.filter((item) => {
  const search = searchTerm.toLowerCase().trim()

  const matchesSearch =
    item.title.toLowerCase().includes(search) ||
    item.category.toLowerCase().includes(search)

  const matchesType =
    typeFilter === 'all' || item.type === typeFilter

  const matchesCategory =
    categoryFilter === 'all' || item.category === categoryFilter

  return matchesSearch && matchesType && matchesCategory
})

// GET AVAILABLE CATEGORIES
const availableCategories = [
  ...new Set(transactions.map((item) => item.category)),
]

// EXPORT FILTERED TRANSACTIONS TO CSV
const handleExportCSV = () => {
  const headers = [
    'ID',
    'Title',
    'Category',
    'Amount',
    'Type',
    'Date',
    'Description',
  ]

  const escapeCSV = (value) =>
    `"${String(value ?? '').replace(/"/g, '""')}"`

  const rows = filteredTransactions.map((item) => [
    item.id,
    item.title,
    item.category,
    item.amount,
    item.type,
    String(item.transaction_date).slice(0, 10),
    item.description || '',
  ])

  const csvContent = [
    headers,
    ...rows,
  ]
    .map((row) => row.map(escapeCSV).join(','))
    .join('\r\n')

  const blob = new Blob(
    ['\uFEFF' + csvContent],
    { type: 'text/csv;charset=utf-8;' }
  )

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = 'ExpenseFlow_Transactions.csv'
  link.click()

  URL.revokeObjectURL(url)
}



  if (!token) {
  return <Auth onAuthenticated={handleAuthenticated} />
}

return (
  <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            <Wallet size={24} />
          </div>
          <h2>Expense<span>Flow</span></h2>
        </div>

        <p className="menu-label">MENU</p>

        <nav className="sidebar-menu">
          <div className="menu-item active">
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </div>

          <div className="menu-item">
            <ArrowLeftRight size={20} />
            <span>Transactions</span>
          </div>

          <div className="menu-item">
            <ChartPie size={20} />
            <span>Reports</span>
          </div>

          <div className="menu-item">
            <Settings size={20} />
            <span>Settings</span>
          </div>
        </nav>

        <div className="sidebar-bottom">
          <div className="profile-avatar">FS</div>
          <div>
            <h4>My Account</h4>
            <p>Personal Finance</p>
          </div>
        </div>
      </aside>

      {/* Main Dashboard */}
      <main className="main-content">

        {/* Header */}
        <header className="top-header">
          <div>
            <h1>Dashboard</h1>
            <p>Welcome back! Here's your financial overview.</p>
          </div>

          <div className="header-actions">
            <button className="icon-button">
              <Bell size={20} />
            </button>

            <div className="header-profile">
              <div className="profile-avatar">FS</div>
              <div>
                <h4>{user?.name || 'My Account'}</h4>
                <p>Personal Account</p>
              </div>
            </div>
            <button
  type="button"
  className="logout-button"
  onClick={handleLogout}
>
  Logout
</button>
          </div>
        </header>
{isLoadingTransactions && (
  <p>Loading your transactions...</p>
)}

{transactionError && (
  <p style={{ color: 'red' }}>{transactionError}</p>
)}

{/* ADD TRANSACTION MODAL */}
{showTransactionModal && (
  <div className="modal-overlay">
    <div className="transaction-modal">

      <div className="modal-header">
        <div>
         <h2>
  {editingTransactionId ? 'Edit Transaction' : 'Add Transaction'}
</h2>
          <p>Record your income or expenses</p>
        </div>

        <button
          type="button"
          className="modal-close"
          onClick={() => setShowTransactionModal(false)}
        >
          ×
        </button>
      </div>

      <form
  onSubmit={
    editingTransactionId
      ? handleUpdateTransaction
      : handleAddTransaction
  }
>

        <div className="form-group">
          <label>Transaction Title</label>
          <input
            type="text"
            placeholder="e.g. Monthly Salary"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            maxLength={150}
            required
          />
        </div>

        <div className="form-row">

          <div className="form-group">
            <label>Transaction Type</label>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value })
              }
              required
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>

          <div className="form-group">
            <label>Category</label>
            <select
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              required
            >
              <option value="">Select Category</option>
              <option value="Salary">Salary</option>
              <option value="Freelance">Freelance</option>
              <option value="Business">Business</option>
              <option value="Food">Food</option>
              <option value="Housing">Housing</option>
              <option value="Transport">Transport</option>
              <option value="Shopping">Shopping</option>
              <option value="Bills">Bills</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Education">Education</option>
              <option value="Entertainment">Entertainment</option>
              <option value="Other">Other</option>
            </select>
          </div>

        </div>

        <div className="form-row">

          <div className="form-group">
            <label>Amount (₹)</label>
            <input
              type="number"
              placeholder="Enter amount"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
              min="0.01"
              step="0.01"
              required
            />
          </div>

          <div className="form-group">
            <label>Date</label>
            <input
              type="date"
              value={formData.transaction_date}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  transaction_date: e.target.value,
                })
              }
              required
            />
          </div>

        </div>

        <div className="form-group">
          <label>Description (Optional)</label>
          <textarea
            placeholder="Add some notes..."
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            rows={3}
          />
        </div>

        {formError && (
          <p className="form-error">{formError}</p>
        )}

        <div className="modal-actions">
          <button
            type="button"
            className="cancel-button"
            onClick={() => setShowTransactionModal(false)}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="save-button"
            disabled={isSaving}
          >
{isSaving
  ? 'Saving...'
  : editingTransactionId
    ? 'Update Transaction'
    : 'Save Transaction'}
          </button>
        </div>

      </form>
    </div>
  </div>
)}

{/* ADD MONTHLY BUDGET MODAL */}
{showBudgetModal && (
  <div className="modal-overlay">
    <div className="transaction-modal">

      <div className="modal-header">
        <div>
          <h2>Set Monthly Budget</h2>
          <p>Set your spending limit for a category</p>
        </div>

        <button
          type="button"
          className="modal-close"
          onClick={() => setShowBudgetModal(false)}
        >
          ×
        </button>
      </div>

      <form onSubmit={handleSaveBudget}>

        <div className="form-group">
          <label>Budget Category</label>

          <select
            value={budgetFormData.category}
            onChange={(e) =>
              setBudgetFormData({
                ...budgetFormData,
                category: e.target.value,
              })
            }
            required
          >
            <option value="">Select Category</option>
            <option value="Food">Food</option>
            <option value="Shopping">Shopping</option>
            <option value="Housing">Housing</option>
            <option value="Transport">Transport</option>
            <option value="Bills">Bills</option>
            <option value="Healthcare">Healthcare</option>
            <option value="Education">Education</option>
            <option value="Entertainment">Entertainment</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="form-group">
          <label>Monthly Budget Amount (₹)</label>

          <input
            type="number"
            placeholder="Enter budget amount"
            min="0.01"
            step="0.01"
            value={budgetFormData.budget_amount}
            onChange={(e) =>
              setBudgetFormData({
                ...budgetFormData,
                budget_amount: e.target.value,
              })
            }
            required
          />
        </div>

        <div className="form-group">
          <label>Budget Month</label>

          <input
            type="month"
            value={budgetMonth}
            onChange={(e) => setBudgetMonth(e.target.value)}
            required
          />
        </div>

        {budgetFormError && (
          <p className="form-error">{budgetFormError}</p>
        )}

        <div className="modal-actions">

          <button
            type="button"
            className="cancel-button"
            onClick={() => setShowBudgetModal(false)}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="save-button"
            disabled={isSavingBudget}
          >
            {isSavingBudget ? 'Saving...' : 'Save Budget'}
          </button>

        </div>

      </form>
    </div>
  </div>
)}


        {/* Summary Cards */}
        <section className="summary-grid">

          <div className="summary-card balance-card">
            <div className="card-top">
              <span>Total Balance</span>
              <div className="card-icon purple">
                <Wallet size={21} />
              </div>
            </div>
            <h2>{formatCurrency(balance)}</h2>
            <p>Your available balance</p>
          </div>

          <div className="summary-card">
            <div className="card-top">
              <span>Total Income</span>
              <div className="card-icon green">
                <ArrowDownRight size={21} />
              </div>
            </div>
            <h2>{formatCurrency(totalIncome)}</h2>
            <p className="positive-text">Money received</p>
          </div>

          <div className="summary-card">
            <div className="card-top">
              <span>Total Expenses</span>
              <div className="card-icon red">
                <ArrowUpRight size={21} />
              </div>
            </div>
            <h2>{formatCurrency(totalExpenses)}</h2>
            <p className="negative-text">Money spent</p>
          </div>

          <div className="summary-card">
            <div className="card-top">
              <span>Savings</span>
              <div className="card-icon blue">
                <ChartPie size={21} />
              </div>
            </div>
            <h2>{formatCurrency(balance)}</h2>
            <p>Income minus expenses</p>
          </div>

        </section>

        {/* Charts Section */}
        <section className="charts-grid">

          <div className="dashboard-card chart-card">
            <div className="section-heading">
              <div>
                <h3>Income vs Expenses</h3>
                <p>Monthly financial overview</p>
              </div>

              <button className="period-button">
                This year
                <CalendarDays size={15} />
              </button>
            </div>

            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#edf0f5"
                  />

                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    axisLine={false}
                    tickLine={false}
                  />

                  <Tooltip />

                  <Bar
                    dataKey="income"
                    name="Income"
                    fill="#6558e8"
                    radius={[5, 5, 0, 0]}
                  />

                  <Bar
                    dataKey="expenses"
                    name="Expenses"
                    fill="#ff8c83"
                    radius={[5, 5, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="dashboard-card insights-card">
            <h3>Financial Summary</h3>
            <p>Your current financial position</p>

            <div className="insight-item">
              <span>Income</span>
              <strong className="positive-text">
                {formatCurrency(totalIncome)}
              </strong>
            </div>

            <div className="insight-item">
              <span>Expenses</span>
              <strong className="negative-text">
                {formatCurrency(totalExpenses)}
              </strong>
            </div>

            <div className="insight-item">
              <span>Net Savings</span>
              <strong>{formatCurrency(balance)}</strong>
            </div>

            <div className="savings-progress">
              <div className="progress-label">
                <span>Savings rate</span>
                <strong>
                  {totalIncome
                    ? Math.round((balance / totalIncome) * 100)
                    : 0}%
                </strong>
              </div>

              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{
                    width: `${
                      totalIncome
                        ? (balance / totalIncome) * 100
                        : 0
                    }%`,
                  }}
                ></div>
              </div>
            </div>
          </div>

        </section>

{/* MONTHLY BUDGET SECTION */}
<section className="dashboard-card budget-card">

  <div className="section-heading">
    <div>
      <h3>Monthly Budget</h3>
      <p>Monitor your category-wise spending limits</p>
    </div>

    <button
      type="button"
      className="add-button"
      onClick={() => {
        setBudgetFormData({
          category: '',
          budget_amount: '',
        })
        setBudgetFormError('')
        setShowBudgetModal(true)
      }}
    >
      <Plus size={17} />
      Set Budget
    </button>
  </div>

  <div className="budget-month-selector">
    <label>Select Month</label>
    <input
      type="month"
      value={budgetMonth}
      onChange={(e) => setBudgetMonth(e.target.value)}
    />
  </div>

  {isLoadingBudgets && (
    <p>Loading monthly budgets...</p>
  )}

  {budgetError && (
    <p className="form-error">{budgetError}</p>
  )}

  {!isLoadingBudgets && budgets.length === 0 && (
    <p className="empty-category">
      No budgets set for this month. Click Set Budget to begin.
    </p>
  )}

  <div className="budget-list">

    {budgets.map((budget) => {
      const spent = transactions
        .filter((item) =>
          item.type === 'expense' &&
          item.category === budget.category &&
          String(item.transaction_date).slice(0, 7) === budgetMonth
        )
        .reduce((total, item) => total + Number(item.amount), 0)

      const percentage = Math.min(
        (spent / budget.budget_amount) * 100,
        100
      )

      const remaining = budget.budget_amount - spent
      const usageRate = (spent / budget.budget_amount) * 100

const budgetWarning =
  usageRate > 100
    ? 'exceeded'
    : usageRate >= 100
      ? 'reached'
      : usageRate >= 80
        ? 'warning'
        : 'safe'

      return (
        <div className="budget-item" key={budget.id || budget.category}>

          <div className="budget-item-top">
            <strong>{budget.category}</strong>

            <span>
              {formatCurrency(spent)} / {formatCurrency(budget.budget_amount)}
            </span>
          </div>

          <div className="budget-progress-track">
            <div
              className={`budget-progress-fill ${
                spent > budget.budget_amount ? 'over-budget' : ''
              }`}
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
          {budgetWarning === 'exceeded' && (
  <p className="budget-warning over">
    ⚠ Budget exceeded! Reduce your spending.
  </p>
)}

{budgetWarning === 'reached' && (
  <p className="budget-warning over">
    ⚠ You have used your entire budget!
  </p>
)}

{budgetWarning === 'warning' && (
  <p className="budget-warning">
    ⚠ You are approaching your budget limit.
  </p>
)}

          <div className="budget-item-bottom">
            <span>{Math.round((spent / budget.budget_amount) * 100)}% used</span>

            <strong className={
              remaining < 0 ? 'negative-text' : 'positive-text'
            }>
              {remaining >= 0
                ? `${formatCurrency(remaining)} remaining`
                : `${formatCurrency(Math.abs(remaining))} over budget`}
            </strong>
          </div>

        </div>
      )
    })}

  </div>

</section>

{/* EXPENSE CATEGORY BREAKDOWN */}
<section className="dashboard-card category-card">

  <div className="section-heading">
    <div>
      <h3>Expense Category Breakdown</h3>
      <p>See where your money is being spent</p>
    </div>
  </div>

  {categoryData.length === 0 ? (
    <p className="empty-category">
      No expenses recorded yet.
    </p>
  ) : (
    <div className="category-chart">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={categoryData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={105}
            label
          >
            {categoryData.map((entry, index) => (
              <Cell
                key={entry.name}
                fill={categoryColors[index % categoryColors.length]}
              />
            ))}
          </Pie>

          <Tooltip
            formatter={(value) => [
              `₹${Number(value).toLocaleString('en-IN')}`,
              'Expense',
            ]}
          />

          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )}

</section>


        {/* Transactions */}
        <section className="dashboard-card transactions-card">

          <div className="section-heading">
            <div>
              <h3>Recent Transactions</h3>
              <p>Track your latest income and expenses</p>
            </div>

            <div className="transaction-header-actions">

  <button
    type="button"
    className="export-button"
    onClick={handleExportCSV}
  >
    Download CSV
  </button>

  <button
    type="button"
    className="add-button"
    onClick={() => {
      const today = new Date()

      const localDate = `${today.getFullYear()}-${String(
        today.getMonth() + 1
      ).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

      setEditingTransactionId(null)

      setFormData({
        title: '',
        category: '',
        amount: '',
        type: 'expense',
        transaction_date: localDate,
        description: '',
      })

      setFormError('')
      setShowTransactionModal(true)
    }}
  >
    <Plus size={17} />
    Add Transaction
  </button>

</div>
          </div>

{/* SEARCH AND FILTER CONTROLS */}
<div className="transaction-filters">

  <input
    type="text"
    className="transaction-search"
    placeholder="Search transactions..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
  />

  <select
    className="filter-select"
    value={typeFilter}
    onChange={(e) => setTypeFilter(e.target.value)}
  >
    <option value="all">All Types</option>
    <option value="income">Income</option>
    <option value="expense">Expense</option>
  </select>

  <select
    className="filter-select"
    value={categoryFilter}
    onChange={(e) => setCategoryFilter(e.target.value)}
  >
    <option value="all">All Categories</option>

    {availableCategories.map((category) => (
      <option key={category} value={category}>
        {category}
      </option>
    ))}
  </select>

</div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>TRANSACTION</th>
                  <th>CATEGORY</th>
                  <th>DATE</th>
                  <th>AMOUNT</th>
                  <th>TYPE</th>
                  <th>ACTION</th>
                </tr>
              </thead>

              <tbody>
                {filteredTransactions.map((item) => {
                  const Icon =
                    categoryIcons[item.category] || Wallet

                  return (
                    <tr key={item.id}>
                      <td>
                        <div className="transaction-name">
                          <div className="transaction-icon">
                            <Icon size={18} />
                          </div>
                          <strong>{item.title}</strong>
                        </div>
                      </td>

                      <td>{item.category}</td>

                      <td>
                        {new Date(
                          item.transaction_date + 'T00:00:00'
                        ).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>

                      <td className={
                        item.type === 'income'
                          ? 'amount-income'
                          : 'amount-expense'
                      }>
                        {item.type === 'income' ? '+' : '-'}
                        {formatCurrency(item.amount)}
                      </td>

                      <td>
                        <span className={`type-badge ${item.type}`}>
                          {item.type}
                        </span>
                      </td>
                      <td>
  <div className="action-buttons">

    <button
      type="button"
      className="edit-button"
      onClick={() => handleEditClick(item)}
    >
      Edit
    </button>

    <button
      type="button"
      className="delete-button"
      onClick={() => handleDeleteTransaction(item.id)}
    >
      Delete
    </button>

  </div>
</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

        </section>

      </main>
    </div>
  )
}

export default App
