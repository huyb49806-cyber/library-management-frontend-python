import { useEffect, useState } from 'react'
import { Button, Form, Input, Modal, notification, Select, Table, Tag } from 'antd'
import { BookOutlined, PlusOutlined, SearchOutlined, DeleteOutlined } from '@ant-design/icons'
import { useSelector } from 'react-redux'
import { catalogApi } from '../api/client'

const listPayload = (payload) => Array.isArray(payload) ? payload : payload?.results || []

export default function BooksPage() {
  const user = useSelector((state) => state.auth.user)
  const [books, setBooks] = useState([])
  const [authors, setAuthors] = useState([])
  const [languages, setLanguages] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState(new URLSearchParams(window.location.search).get('search') || '')
  const [form] = Form.useForm()

  const load = async () => {
    setLoading(true)
    try {
      setBooks(listPayload(await catalogApi.books(search)))
    } catch (error) {
      notification.error({ message: 'Không tải được danh sách sách', description: error.message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const openCreate = async () => {
    try {
      const [authorRows, languageRows] = await Promise.all([catalogApi.authors(), catalogApi.languages()])
      setAuthors(listPayload(authorRows))
      setLanguages(listPayload(languageRows))
      setOpen(true)
    } catch (error) {
      notification.error({ message: 'Không tải được lựa chọn biểu mẫu', description: error.message })
    }
  }

  const create = async (values) => {
    try {
      await catalogApi.createBook({ ...values, genre: [] })
      notification.success({ message: 'Đã thêm đầu sách' })
      setOpen(false)
      form.resetFields()
      await load()
    } catch (error) {
      notification.error({ message: 'Không thể thêm sách', description: error.message })
    }
  }

  // --- THÊM HÀM REMOVE BOOK TẠI ĐÂY ---
  const removeBook = (book) => {
    if (book.total_copies > 0) {
      notification.warning({
        message: 'Chưa thể xóa đầu sách',
        description: 'Hãy xóa các bản sao trước.',
      })
      return
    }

    Modal.confirm({
      title: `Xóa đầu sách "${book.title}"?`,
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
        {user?.role === 'Admin' && (
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Thêm đầu sách</Button>
        )}
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
          <Button type="primary" onClick={load}>Tìm kiếm</Button>
        </div>
        
        <Table 
          rowKey="id" 
          loading={loading} 
          dataSource={books} 
          pagination={{ pageSize: 8 }} 
          columns={[
            { title: 'ĐẦU SÁCH', dataIndex: 'title', render: (title, row) => <div className="book-cell"><BookOutlined /><span><strong>{title}</strong><small>{row.isbn}</small></span></div> },
            { title: 'TÁC GIẢ', render: (_, row) => row.author_detail?.full_name || row.author },
            { title: 'NGÔN NGỮ', render: (_, row) => row.language_detail?.name || row.language },
            { title: 'BẢN SAO SẴN CÓ', render: (_, row) => `${row.available_copies} / ${row.total_copies}` },
            { title: 'TRẠNG THÁI', render: (_, row) => <Tag color={row.available_copies ? 'success' : 'error'}>{row.available_copies ? 'Có sẵn' : 'Hết bản'}</Tag> },
            // --- THÊM CỘT THAO TÁC Ở ĐÂY ---
            {
              title: 'THAO TÁC',
              key: 'actions',
              render: (_, row) => user?.role === 'Admin' && (
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  aria-label={`Xóa ${row.title}`}
                  disabled={row.total_copies > 0}
                  title={row.total_copies > 0 ? 'Xóa các bản sao trước' : 'Xóa đầu sách'}
                  onClick={() => removeBook(row)}
                />
              ),
            },
          ]} 
        />
      </section>

      <Modal title="Thêm đầu sách" open={open} onCancel={() => setOpen(false)} onOk={() => form.submit()}>
        <Form form={form} layout="vertical" onFinish={create}>
          <Form.Item name="title" label="Tên sách" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="isbn" label="ISBN" rules={[{ required: true }]}><Input maxLength={13} /></Form.Item>
          <Form.Item name="author" label="Tác giả" rules={[{ required: true }]}><Select options={authors.map((item) => ({ value: item.id, label: item.full_name }))} /></Form.Item>
          <Form.Item name="language" label="Ngôn ngữ" rules={[{ required: true }]}><Select options={languages.map((item) => ({ value: item.id, label: item.name }))} /></Form.Item>
          <Form.Item name="summary" label="Mô tả"><Input.TextArea rows={3} /></Form.Item>
        </Form>
      </Modal>
    </div>
  )
}