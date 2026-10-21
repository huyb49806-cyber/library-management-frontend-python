import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Layout, Menu, Avatar, Badge, Button, Input, InputNumber, Dropdown, Space, Tooltip, notification, Table, Tag, Modal, Form, Select, DatePicker } from 'antd'
import { AppstoreOutlined, BookOutlined, SwapOutlined, TeamOutlined, BellOutlined, SearchOutlined, MenuFoldOutlined, MenuUnfoldOutlined, LogoutOutlined, UserOutlined, ArrowRightOutlined, PlusOutlined, ClockCircleOutlined, CheckCircleFilled } from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import { clearSession, setSession, toggleSidebar } from './store'
import LoginPage from './pages/LoginPage'; 
import RegisterPage from './pages/RegisterPage'; 
import ProfilePage from './pages/ProfilePage'
import { authApi, catalogApi, circulationApi } from './api/client'; import { clearStoredTokens, toSessionUser } from './session'; import './catalog.css'
const { Sider, Header, Content } = Layout
const navigation = [{ key: '/', icon: <AppstoreOutlined />, label: <NavLink to="/">Tổng quan</NavLink> }, { key: '/books', icon: <BookOutlined />, label: <NavLink to="/books">Kho sách</NavLink> }, { key: '/loans', icon: <SwapOutlined />, label: <NavLink to="/loans">Mượn & trả</NavLink> }, { key: '/users', icon: <TeamOutlined />, label: <NavLink to="/users">Người dùng</NavLink> }]
const listPayload = (payload) => Array.isArray(payload) ? payload : payload?.results || []
function AppShell({ children }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { collapsed } = useSelector((s) => s.ui)
  const user = useSelector((s) => s.auth.user)
  const [query, setQuery] = useState('')

  const visible = user?.role === 'Admin' ? navigation : navigation.filter((i) => i.key !== '/users')

  const signOut = async () => {
    try {
      const refresh = localStorage.getItem('refresh_token')
      if (refresh) await authApi.logout(refresh)
    } catch {}
    clearStoredTokens()
    dispatch(clearSession())
    navigate('/login')
  }

  const title =
    visible.find((i) => i.key === location.pathname)?.label?.props?.children ||
    (location.pathname === '/profile' ? 'Hồ sơ cá nhân' : 'Thư viện')

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
        <Menu theme="dark" mode="inline" selectedKeys={[location.pathname]} items={visible} />
      </Sider>
      <Layout>
        <Header className="app-header">
          <Space>
            <Button
              type="text"
              className="icon-button"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => dispatch(toggleSidebar())}
            />
            <span className="breadcrumb-title">{title}</span>
          </Space>
          <Space>
            <Input
              className="global-search"
              prefix={<SearchOutlined />}
              placeholder="Tìm kiếm nhanh..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onPressEnter={() => query && navigate(`/books?search=${encodeURIComponent(query)}`)}
            />
            <Tooltip title="Thông báo">
              <Badge count={0}>
                <Button type="text" icon={<BellOutlined />} />
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
                  { key: 'logout', icon: <LogoutOutlined />, label: 'Đăng xuất', onClick: signOut },
                ],
              }}
            >
              <button className="profile-trigger">
                <Avatar size={34} className="avatar">
                  {user?.initials || 'U'}
                </Avatar>
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

function StatCard({ icon, label, value, tone }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${tone}`}>{icon}</div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  )
}

function Dashboard() {
  const [data, setData] = useState({ books: [], loans: [] })

  useEffect(() => {
    Promise.all([catalogApi.books(), circulationApi.loans()])
      .then(([books, loans]) => setData({ books: listPayload(books), loans: listPayload(loans) }))
      .catch((e) => notification.error({ message: 'Không tải được tổng quan', description: e.message }))
  }, [])

  const overdue = data.loans.filter((x) => x.is_overdue).length
  const available = data.books.reduce((sum, x) => sum + (x.available_copies || 0), 0)

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">TỔNG QUAN</div>
          <h1>Vận hành thư viện</h1>
          <p className="muted">Số liệu được lấy trực tiếp từ hệ thống.</p>
        </div>
      </div>
      <div className="stat-grid">
        <StatCard icon={<BookOutlined />} label="Tổng đầu sách" value={data.books.length} tone="teal" />
        <StatCard icon={<SwapOutlined />} label="Đang được mượn" value={data.loans.length} tone="amber" />
        <StatCard icon={<ClockCircleOutlined />} label="Đang quá hạn" value={overdue} tone="rose" />
        <StatCard icon={<CheckCircleFilled />} label="Bản sao sẵn có" value={available} tone="blue" />
      </div>
      <section className="panel table-panel">
        <div className="panel-heading">
          <div>
            <h2>Phiếu mượn đang mở</h2>
            <span className="panel-subtitle">Theo dõi hạn trả từ circulation API</span>
          </div>
          <Button type="link" onClick={() => (window.location.href = '/loans')}>
            Xem tất cả <ArrowRightOutlined />
          </Button>
        </div>
        <Table
          rowKey="id"
          dataSource={data.loans.slice(0, 8)}
          pagination={false}
          columns={[
            { title: 'MÃ BẢN SAO', dataIndex: 'id' },
            { title: 'MÃ ĐẦU SÁCH', dataIndex: 'book_id' },
            { title: 'NGƯỜI MƯỢN', dataIndex: 'borrower_id' },
            { title: 'HẠN TRẢ', dataIndex: 'due_back' },
            {
              title: 'TRẠNG THÁI',
              render: (_, r) => (
                <Tag color={r.is_overdue ? 'error' : 'processing'}>{r.is_overdue ? 'Quá hạn' : 'Đang mượn'}</Tag>
              ),
            },
          ]}
        />
      </section>
    </div>
  )
}

export function BooksPage() {
  const user = useSelector((s) => s.auth.user)
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(new URLSearchParams(window.location.search).get('search') || '')
  const [open, setOpen] = useState(false)
  const [form] = Form.useForm()
  const [authors, setAuthors] = useState([])
  const [languages, setLanguages] = useState([])

  const load = async (s = search) => {
    setLoading(true)
    try {
      setBooks(listPayload(await catalogApi.books(s)))
    } catch (e) {
      notification.error({ message: 'Không tải được danh sách sách', description: e.message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const create = async (v) => {
    try {
      await catalogApi.createBook({ ...v, genre: [] })
      notification.success({ message: 'Đã thêm đầu sách' })
      setOpen(false)
      form.resetFields()
      load()
    } catch (e) {
      notification.error({ message: 'Không thể thêm sách', description: e.message })
    }
  }

  const canCreate = user?.role === 'Admin'

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">DOMAIN 1 · CATALOG</div>
          <h1>Kho sách</h1>
          <p className="muted">Tra cứu đầu sách và tình trạng bản sao.</p>
        </div>
        {canCreate && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              Promise.all([catalogApi.authors(), catalogApi.languages()])
                .then(([a, l]) => {
                  setAuthors(listPayload(a))
                  setLanguages(listPayload(l))
                  setOpen(true)
                })
                .catch((e) =>
                  notification.error({ message: 'Không tải được dữ liệu biểu mẫu', description: e.message })
                )
            }}
          >
            Thêm đầu sách
          </Button>
        )}
      </div>

      <section className="panel catalog-panel">
        <div className="catalog-toolbar">
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Tên sách, ISBN hoặc tác giả"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onPressEnter={() => load()}
          />
          <Button type="primary" onClick={() => load()}>
            Tìm kiếm
          </Button>
        </div>

        <Table
          rowKey="id"
          loading={loading}
          dataSource={books}
          pagination={{ pageSize: 8 }}
          columns={[
            {
              title: 'ĐẦU SÁCH',
              dataIndex: 'title',
              render: (t, r) => (
                <div className="book-cell">
                  <BookOutlined />
                  <span>
                    <strong>{t}</strong>
                    <small>{r.isbn}</small>
                  </span>
                </div>
              ),
            },
            { title: 'TÁC GIẢ', render: (_, r) => r.author_detail?.full_name || r.author },
            { title: 'NGÔN NGỮ', render: (_, r) => r.language_detail?.name || r.language },
            { title: 'BẢN SAO', render: (_, r) => `${r.available_copies} / ${r.total_copies}` },
            {
              title: 'TRẠNG THÁI',
              render: (_, r) => (
                <Tag color={r.available_copies ? 'success' : 'error'}>
                  {r.available_copies ? 'Có sẵn' : 'Hết bản'}
                </Tag>
              ),
            },
          ]}
        />
      </section>

      <Modal title="Thêm đầu sách" open={open} onCancel={() => setOpen(false)} onOk={() => form.submit()}>
        <Form form={form} layout="vertical" onFinish={create}>
          <Form.Item name="title" label="Tên sách" rules={[{ required: true, message: 'Nhập tên sách' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="isbn" label="ISBN" rules={[{ required: true, message: 'Nhập ISBN' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="author" label="Tác giả" rules={[{ required: true, message: 'Chọn tác giả' }]}>
            <Select options={authors.map((x) => ({ value: x.id, label: x.full_name }))} />
          </Form.Item>
          <Form.Item name="language" label="Ngôn ngữ" rules={[{ required: true, message: 'Chọn ngôn ngữ' }]}>
            <Select options={languages.map((x) => ({ value: x.id, label: x.name }))} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export function LoansPage() {
  const user = useSelector((s) => s.auth.user)
  const [loans, setLoans] = useState([])
  const [loading, setLoading] = useState(true)
  const [borrowOpen, setBorrowOpen] = useState(false)
  const [renewTarget, setRenewTarget] = useState(null)
  const [borrowForm] = Form.useForm()
  const [renewForm] = Form.useForm()

  const canOperate = user?.role === 'Admin' || user?.role === 'Librarian'

  const load = async () => {
    setLoading(true)
    try {
      const payload = await circulationApi.loans()
      setLoans(Array.isArray(payload) ? payload : payload?.results || [])
    } catch (error) {
      notification.error({
        message: 'Không tải được phiếu mượn',
        description: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const borrow = async (values) => {
    try {
      await circulationApi.borrow(values)
      notification.success({ message: 'Đã lập phiếu mượn' })
      setBorrowOpen(false)
      borrowForm.resetFields()
      load()
    } catch (error) {
      notification.error({
        message: 'Không thể lập phiếu mượn',
        description: error.message,
      })
    }
  }

  const renew = async (values) => {
    try {
      await circulationApi.renew(renewTarget.id, values.due_back)
      notification.success({ message: 'Đã gia hạn sách' })
      setRenewTarget(null)
      renewForm.resetFields()
      load()
    } catch (error) {
      notification.error({
        message: 'Không thể gia hạn',
        description: error.message,
      })
    }
  }

  const returnBook = async (id) => {
    try {
      await circulationApi.returnBook(id)
      notification.success({ message: 'Đã ghi nhận trả sách' })
      load()
    } catch (error) {
      notification.error({
        message: 'Không thể ghi nhận trả sách',
        description: error.message,
      })
    }
  }

  const columns = [
    {
      title: 'MÃ BẢN SAO',
      dataIndex: 'id',
      render: (id) => <span className="mono-id">{id}</span>,
    },
    {
      title: 'MÃ ĐẦU SÁCH',
      dataIndex: 'book_id',
    },
    {
      title: 'NGƯỜI MƯỢN',
      dataIndex: 'borrower_id',
    },
    {
      title: 'HẠN TRẢ',
      dataIndex: 'due_back',
      render: (date) => date || '—',
    },
    {
      title: 'TRẠNG THÁI',
      dataIndex: 'status',
      render: (status, row) => (
        <Tag color={row.is_overdue ? 'error' : status === 'o' ? 'processing' : 'success'}>
          {row.is_overdue ? 'Quá hạn' : status === 'o' ? 'Đang mượn' : status}
        </Tag>
      ),
    },
    {
      title: '',
      key: 'actions',
      render: (_, row) =>
        canOperate && row.status === 'o' ? (
          <Space>
            <Button
              size="small"
              onClick={() => {
                setRenewTarget(row)
                renewForm.setFieldsValue({ due_back: row.due_back })
              }}
            >
              Gia hạn
            </Button>
            <Button size="small" danger onClick={() => returnBook(row.id)}>
              Trả sách
            </Button>
          </Space>
        ) : null,
    },
  ]

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">DOMAIN 3 · CIRCULATION</div>
          <h1>Mượn & trả</h1>
          <p className="muted">Theo dõi phiếu mượn đang mở và hạn trả của từng bản sao.</p>
        </div>
        {canOperate && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setBorrowOpen(true)}>
            Lập phiếu mượn
          </Button>
        )}
      </div>

      <section className="panel catalog-panel">
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={loans}
          pagination={{ pageSize: 8, showSizeChanger: false }}
        />
      </section>

      <Modal
        title="Lập phiếu mượn"
        open={borrowOpen}
        onCancel={() => setBorrowOpen(false)}
        onOk={() => borrowForm.submit()}
        okText="Chốt mượn"
        cancelText="Hủy"
      >
        <Form form={borrowForm} layout="vertical" onFinish={borrow}>
          <Form.Item label="ID độc giả" name="member_id" rules={[{ required: true, message: 'Nhập ID user' }]}>
            <Input placeholder="Ví dụ: 12" />
          </Form.Item>
          <Form.Item
            label="UUID bản sao sách"
            name="book_instance_id"
            rules={[{ required: true, message: 'Nhập UUID bản sao' }]}
          >
            <Input placeholder="UUID barcode" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Gia hạn sách"
        open={Boolean(renewTarget)}
        onCancel={() => setRenewTarget(null)}
        onOk={() => renewForm.submit()}
        okText="Lưu ngày mới"
        cancelText="Hủy"
      >
        <Form form={renewForm} layout="vertical" onFinish={renew}>
          <Form.Item
            label="Ngày hẹn trả mới"
            name="due_back"
            rules={[{ required: true, message: 'Chọn ngày trả mới' }]}
          >
            <Input type="date" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export function UsersPage() {
  const user = useSelector((s) => s.auth.user)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.role !== 'Admin') {
      setLoading(false)
      return
    }
    authApi
      .users()
      .then((payload) => setUsers(Array.isArray(payload) ? payload : payload?.results || []))
      .catch((error) =>
        notification.error({
          message: 'Không tải được người dùng',
          description: error.message,
          key: 'user-load-error',
        })
      )
      .finally(() => setLoading(false))
  }, [user?.role])

  if (user?.role !== 'Admin') {
    return (
      <div className="page">
        <div className="empty-module">
          <div className="empty-module-icon">
            <TeamOutlined />
          </div>
          <h2>Bạn không có quyền truy cập</h2>
          <p>Chức năng quản lý người dùng chỉ dành cho Admin.</p>
        </div>
      </div>
    )
  }

  const columns = [
    {
      title: 'TÀI KHOẢN',
      dataIndex: 'username',
      render: (name, row) => (
        <div className="reader">
          <Avatar size={30} className="reader-avatar">
            {name?.slice(0, 2).toUpperCase()}
          </Avatar>
          <span>
            <strong>{name}</strong>
            <small style={{ display: 'block', color: '#8c8c8c' }}>{row.email || 'Chưa cập nhật email'}</small>
          </span>
        </div>
      ),
    },
    {
      title: 'VAI TRÒ',
      dataIndex: 'groups',
      render: (groups) => (groups?.length ? groups.join(', ') : 'Member'),
    },
    {
      title: 'TRẠNG THÁI',
      dataIndex: 'is_active',
      render: (active) => <Tag color={active ? 'success' : 'error'}>{active ? 'Đang hoạt động' : 'Đã khóa'}</Tag>,
    },
  ]

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">DOMAIN 2 · USER MANAGEMENT</div>
          <h1>Người dùng</h1>
          <p className="muted">Quản lý tài khoản, trạng thái và nhóm quyền trong hệ thống.</p>
        </div>
        <Button type="primary" icon={<PlusOutlined />}>
          Thêm người dùng
        </Button>
      </div>

      <section className="panel catalog-panel">
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={users}
          pagination={{ pageSize: 8, showSizeChanger: false }}
        />
      </section>
    </div>
  )
}

export function PlaceholderPage({ title, subtitle, icon }) {
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">MODULE</div>
          <h1>{title}</h1>
          <p className="muted">{subtitle}</p>
        </div>
        <Button type="primary" icon={<PlusOutlined />}>
          Tạo mới
        </Button>
      </div>

      <div className="empty-module">
        <div className="empty-module-icon">{icon}</div>
        <h2>Không gian {title.toLowerCase()}</h2>
        <p>Giao diện đã sẵn sàng và sẽ dùng REST API tương ứng của backend.</p>
        <Button type="primary">Bắt đầu cấu hình</Button>
      </div>
    </div>
  )
}



export default function App() {
  const user = useSelector((s) => s.auth.user)
  const dispatch = useDispatch()
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    
    if (token && !user) {
      authApi
        .me()
        .then((profile) =>
          dispatch(
            setSession({
              user: toSessionUser(profile),
              access: token,
              refresh: localStorage.getItem('refresh_token'),
            })
          )
        )
        .catch(() => {
          clearStoredTokens()
          dispatch(clearSession())
        })
        .finally(() => setInitializing(false))
    } else {
      setInitializing(false)
    }
  }, [dispatch, user])

  if (initializing) {
    return <div style={{ padding: 50, textAlign: 'center' }}>Đang tải dữ liệu...</div>
  }

  return user ? (
    <AppShell>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/books" element={<BooksPage />} />
        <Route path="/loans" element={<LoansPage />} />
        
        <Route
          path="/users"
          element={user.role === 'Admin' ? <UsersPage /> : <Navigate to="/" replace />}
        />
        
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  ) : (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}