import { useEffect, useState } from 'react'
import {
  Navigate,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom'
import {
  AppstoreOutlined,
  BellOutlined,
  BookOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SearchOutlined,
  SwapOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons'
import {
  Avatar,
  Badge,
  Button,
  Dropdown,
  Input,
  Layout,
  Menu,
  Space,
  Tooltip,
} from 'antd'
import { useDispatch, useSelector } from 'react-redux'
import DashboardPage from './pages/Dashboard'
import BooksPage from './pages/BooksPage'
import LoansPage from './pages/LoansPage'
import UsersPage from './pages/UsersPage'
import AdminCatalogPage from './pages/AdminCatalogPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import LoginPage from './pages/LoginPage'
import ProfilePage from './pages/ProfilePage'
import RegisterPage from './pages/RegisterPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import { clearSession, setSession, toggleSidebar } from './store'
import { authApi } from './api/client'
import { clearStoredTokens, toSessionUser } from './session'
import './catalog.css'

const { Content, Header, Sider } = Layout

const navigation = [
  { key: '/', icon: <AppstoreOutlined />, label: <NavLink to="/">Tổng quan</NavLink> },
  { key: '/books', icon: <BookOutlined />, label: <NavLink to="/books">Kho sách</NavLink> },
  { key: '/loans', icon: <SwapOutlined />, label: <NavLink to="/loans">Mượn & trả</NavLink> },
  { key: '/users', icon: <TeamOutlined />, label: <NavLink to="/users">Người dùng</NavLink> },
  {
    key: '/admin/catalog',
    icon: <AppstoreOutlined />,
    label: <NavLink to="/admin/catalog">Quản lý danh mục</NavLink>,
  },
]

function AppShell({ children }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { collapsed } = useSelector((state) => state.ui)
  const user = useSelector((state) => state.auth.user)
  const [query, setQuery] = useState('')
  const visibleNavigation = user?.role === 'Admin'
    ? navigation
    : navigation.filter((item) => !['/users', '/admin/catalog'].includes(item.key))

  const signOut = async () => {
    try {
      const refresh = localStorage.getItem('refresh_token')
      if (refresh) await authApi.logout(refresh)
    } catch {
      // Clear the local session even when the server cannot revoke the token.
    }
    clearStoredTokens()
    dispatch(clearSession())
    navigate('/login')
  }

  const currentItem = visibleNavigation.find((item) => item.key === location.pathname)
  const title = currentItem?.label?.props?.children
    || (location.pathname === '/profile' ? 'Hồ sơ cá nhân' : 'Thư viện')

  return (
    <Layout className="app-layout">
      <Sider trigger={null} collapsible collapsed={collapsed} className="app-sider">
        <div className="brand">
          <div className="brand-mark">L</div>
          {!collapsed && (
            <div>
              <div className="brand-name">LUMINA</div>
              <div className="brand-subtitle">UNIVERSITY LIBRARY</div>
            </div>
          )}
        </div>
        <div className="menu-caption">KHÔNG GIAN LÀM VIỆC</div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={visibleNavigation}
        />
      </Sider>
      <Layout>
        <Header className="app-header">
          <Space>
            <Button
              type="text"
              className="icon-button"
              aria-label={collapsed ? 'Mở menu' : 'Thu gọn menu'}
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => dispatch(toggleSidebar())}
            />
            <span className="breadcrumb-title">{title}</span>
          </Space>
          <Space>
            <Input
              className="global-search"
              prefix={<SearchOutlined />}
              placeholder="Tìm sách"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onPressEnter={() => query && navigate(`/books?search=${encodeURIComponent(query)}`)}
            />
            <Tooltip title="Thông báo">
              <Badge count={0}>
                <Button type="text" aria-label="Thông báo" icon={<BellOutlined />} />
              </Badge>
            </Tooltip>
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'profile',
                    icon: <UserOutlined />,
                    label: 'Hồ sơ cá nhân',
                    onClick: () => navigate('/profile'),
                  },
                  { type: 'divider' },
                  {
                    key: 'logout',
                    icon: <LogoutOutlined />,
                    label: 'Đăng xuất',
                    onClick: signOut,
                  },
                ],
              }}
            >
              <button className="profile-trigger" type="button">
                <Avatar size={34} className="avatar">{user?.initials || 'U'}</Avatar>
                <span className="profile-name">{user?.username || 'Người dùng'}</span>
              </button>
            </Dropdown>
          </Space>
        </Header>
        <Content className="app-content">{children}</Content>
      </Layout>
    </Layout>
  )
}

export default function App() {
  const location = useLocation()
  const user = useSelector((state) => state.auth.user)
  const dispatch = useDispatch()
  const [initializing, setInitializing] = useState(true)
  const isRecoveryRoute = ['/forgot-password', '/reset-password'].includes(location.pathname)

  useEffect(() => {
    const handleExpiredSession = () => dispatch(clearSession())
    window.addEventListener('library:session-expired', handleExpiredSession)
    return () => window.removeEventListener('library:session-expired', handleExpiredSession)
  }, [dispatch])

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token || user) {
      setInitializing(false)
      return
    }

    authApi.me()
      .then((profile) => dispatch(setSession({
        user: toSessionUser(profile),
        access: token,
        refresh: localStorage.getItem('refresh_token'),
      })))
      .catch(() => {
        clearStoredTokens()
        dispatch(clearSession())
      })
      .finally(() => setInitializing(false))
  }, [dispatch, user])

  if (initializing) {
    return <div style={{ padding: 50, textAlign: 'center' }}>Đang tải dữ liệu...</div>
  }

  if (isRecoveryRoute) {
    return (
      <Routes>
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Routes>
    )
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/books" element={<BooksPage />} />
        <Route path="/loans" element={<LoansPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route
          path="/users"
          element={user.role === 'Admin' ? <UsersPage /> : <Navigate to="/" replace />}
        />
        <Route
          path="/admin/catalog"
          element={user.role === 'Admin' ? <AdminCatalogPage /> : <Navigate to="/" replace />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  )
}
