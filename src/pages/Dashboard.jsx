import { useEffect, useState } from 'react'
import { Button, notification, Table, Tag } from 'antd'
import { useNavigate } from 'react-router-dom'
import { BookOutlined, CheckCircleFilled, ClockCircleOutlined, SwapOutlined } from '@ant-design/icons'
import { catalogApi, circulationApi } from '../api/client'

const listPayload = (payload) => Array.isArray(payload) ? payload : payload?.results || []

function StatCard({ icon, label, value, tone }) {
  return <div className="stat-card"><div className={`stat-icon ${tone}`}>{icon}</div><div className="stat-label">{label}</div><div className="stat-value">{value}</div></div>
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const [data, setData] = useState({ books: [], loans: [] })

  useEffect(() => {
    Promise.all([catalogApi.books(), circulationApi.loans()])
      .then(([books, loans]) => setData({ books: listPayload(books), loans: listPayload(loans) }))
      .catch((error) => notification.error({ message: 'Không tải được tổng quan', description: error.message }))
  }, [])

  const overdue = data.loans.filter((loan) => loan.is_overdue).length
  const available = data.books.reduce((sum, book) => sum + (book.available_copies || 0), 0)

  return (
    <div className="page">
      <div className="page-heading"><div><div className="eyebrow">TỔNG QUAN</div><h1>Vận hành thư viện</h1><p className="muted">Số liệu từ danh mục và các lượt mượn đang mở.</p></div></div>
      <div className="stat-grid">
        <StatCard icon={<BookOutlined />} label="Đầu sách" value={data.books.length} tone="teal" />
        <StatCard icon={<SwapOutlined />} label="Đang được mượn" value={data.loans.length} tone="amber" />
        <StatCard icon={<ClockCircleOutlined />} label="Quá hạn" value={overdue} tone="rose" />
        <StatCard icon={<CheckCircleFilled />} label="Bản sao sẵn có" value={available} tone="blue" />
      </div>
      <section className="panel table-panel">
        <div className="panel-heading"><div><h2>Lượt mượn đang mở</h2><span className="panel-subtitle">Thứ tự theo dữ liệu trả về từ circulation API</span></div><Button type="link" onClick={() => navigate('/loans')}>Xem tất cả</Button></div>
        <Table rowKey="id" dataSource={data.loans.slice(0, 8)} pagination={false} columns={[
          { title: 'MÃ BẢN SAO', dataIndex: 'id' },
          { title: 'ĐẦU SÁCH', dataIndex: 'book_title', render: (title, row) => <strong>{title || `Sách #${row.book_id}`}</strong> },
          { title: 'NGƯỜI MƯỢN', dataIndex: 'borrower_name', render: (name, row) => name || (row.borrower_id ? `Độc giả #${row.borrower_id}` : '—') },
          { title: 'HẠN TRẢ', dataIndex: 'due_back' },
          { title: 'TRẠNG THÁI', render: (_, row) => <Tag color={row.is_overdue ? 'error' : 'processing'}>{row.is_overdue ? 'Quá hạn' : 'Đang mượn'}</Tag> },
        ]} />
      </section>
    </div>
  )
}
