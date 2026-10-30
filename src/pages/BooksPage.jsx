import { useEffect, useState } from 'react'
import {
  Button,
  Descriptions,
  Input,
  Modal,
  notification,
  Space,
  Table,
  Tag,
} from 'antd'
import {
  BookOutlined,
  DeleteOutlined,
  EyeOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import { useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'
import { catalogApi } from '../api/client'

const listPayload = (payload) =>
  Array.isArray(payload) ? payload : payload?.results || []

export default function BooksPage() {
  const user = useSelector((state) => state.auth.user)
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(
    new URLSearchParams(window.location.search).get('search') || ''
  )
  const [detailBook, setDetailBook] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      setBooks(listPayload(await catalogApi.books(search)))
    } catch (error) {
      notification.error({
        message: 'Không tải được danh sách sách',
        description: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  // --- HÀM REMOVE BOOK DÀNH CHO ADMIN ---
  const removeBook = (book) => {
    Modal.confirm({
      title: `Xóa đầu sách "${book.title}"?`,
      content:
        book.total_copies > 0
          ? `Đầu sách này hiện có ${book.total_copies} bản sao trong kho. Các bản sao này sẽ được xóa cùng đầu sách.`
          : undefined,
      okText: 'Xóa',
      okButtonProps: { danger: true },
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await catalogApi.remove('books', book.id)
          notification.success({ message: 'Đã xóa đầu sách' })
          await load()
        } catch (error) {
          notification.error({
            message: 'Không xóa được đầu sách',
            description: error.message,
          })
        }
      },
    })
  }

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">DOMAIN 1 · CATALOG</div>
          <h1>Kho sách</h1>
          <p className="muted">Tra cứu đầu sách và tình trạng bản sao.</p>
        </div>
      </div>

      <section className="panel catalog-panel">
        <div className="catalog-toolbar">
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Tên sách, ISBN hoặc tác giả"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onPressEnter={load}
          />
          <Button type="primary" onClick={load}>
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
              render: (title, row) => (
                <div className="book-cell">
                  <BookOutlined />
                  <span>
                    <strong>{title}</strong>
                    <small>{row.isbn}</small>
                  </span>
                </div>
              ),
            },
            {
              title: 'TÁC GIẢ',
              render: (_, row) =>
                row.author_detail?.full_name || row.author,
            },
            {
              title: 'NGÔN NGỮ',
              render: (_, row) =>
                row.language_detail?.name || row.language,
            },
            {
              title: 'THỂ LOẠI',
              render: (_, row) =>
                row.genre_details?.length ? (
                  <Space wrap size={[0, 4]}>
                    {row.genre_details.map((g) => (
                      <Tag key={g.id || g}>{g.name || g}</Tag>
                    ))}
                  </Space>
                ) : (
                  '—'
                ),
            },
            {
              title: 'BẢN SAO SẴN CÓ',
              render: (_, row) =>
                `${row.available_copies} / ${row.total_copies}`,
            },
            {
              title: 'TRẠNG THÁI',
              render: (_, row) => (
                <Tag color={row.available_copies ? 'success' : 'error'}>
                  {row.available_copies ? 'Có sẵn' : 'Hết bản'}
                </Tag>
              ),
            },
            {
              title: 'THAO TÁC',
              key: 'actions',
              render: (_, row) => (
                <Space>
                  <Button
                    icon={<EyeOutlined />}
                    title="Xem chi tiết & tình trạng kho"
                    onClick={() => setDetailBook(row)}
                  >
                    Chi tiết
                  </Button>
                  {user?.role === 'Admin' && (
                    <Button
                      danger
                      icon={<DeleteOutlined />}
                      aria-label={`Xóa ${row.title}`}
                      title="Xóa đầu sách"
                      onClick={() => removeBook(row)}
                    />
                  )}
                </Space>
              ),
            },
          ]}
        />
      </section>

      <Modal
        title="Chi tiết sách & tình trạng kho"
        open={Boolean(detailBook)}
        onCancel={() => setDetailBook(null)}
        footer={[
          <Button
            key="close"
            type="primary"
            onClick={() => setDetailBook(null)}
          >
            Đóng
          </Button>,
        ]}
      >
        {detailBook && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Tên sách">
              <strong>{detailBook.title}</strong>
            </Descriptions.Item>
            <Descriptions.Item label="Mã ISBN">
              {detailBook.isbn}
            </Descriptions.Item>
            <Descriptions.Item label="Tác giả">
              {detailBook.author_detail?.full_name || detailBook.author}
              {detailBook.author_detail?.date_of_birth
                ? ` (Sinh: ${detailBook.author_detail.date_of_birth}${
                    detailBook.author_detail.date_of_death
                      ? ` - Mất: ${detailBook.author_detail.date_of_death}`
                      : ''
                  })`
                : ''}
            </Descriptions.Item>
            <Descriptions.Item label="Ngôn ngữ">
              {detailBook.language_detail?.name || detailBook.language}
            </Descriptions.Item>
            <Descriptions.Item label="Thể loại">
              {detailBook.genre_details?.length
                ? detailBook.genre_details.map((g) => (
                    <Tag key={g.id}>{g.name}</Tag>
                  ))
                : 'Chưa phân loại'}
            </Descriptions.Item>
            <Descriptions.Item label="Tình trạng kho">
              <Tag
                color={
                  detailBook.available_copies > 0 ? 'success' : 'error'
                }
              >
                {detailBook.available_copies > 0
                  ? `Có sẵn (${detailBook.available_copies} / ${detailBook.total_copies} bản sao)`
                  : 'Hết bản sao'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Tóm tắt mô tả">
              {detailBook.summary || 'Không có mô tả.'}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}
