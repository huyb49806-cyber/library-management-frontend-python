import { useEffect, useMemo, useState } from 'react'
import { Button, Form, Input, Modal, notification, Select, Space, Table, Tabs } from 'antd'
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import { catalogApi } from '../api/client'

const listPayload = (payload) => Array.isArray(payload) ? payload : payload?.results || []

const resourceDefinitions = {
  books: {
    label: 'Sách',
    fields: [
      { name: 'title', label: 'Tên sách', required: true },
      { name: 'isbn', label: 'ISBN', required: true },
      { name: 'summary', label: 'Mô tả', kind: 'textarea' },
      { name: 'author', label: 'Tác giả', kind: 'authors', required: true },
      { name: 'language', label: 'Ngôn ngữ', kind: 'languages', required: true },
      { name: 'genre', label: 'Thể loại', kind: 'genres' },
    ],
    columns: [
      { title: 'TÊN SÁCH', dataIndex: 'title' },
      { title: 'ISBN', dataIndex: 'isbn' },
      { title: 'TÁC GIẢ', render: (_, row) => row.author_detail?.full_name || row.author },
      { title: 'BẢN SAO CÓ SẴN', render: (_, row) => `${row.available_copies || 0} / ${row.total_copies || 0}` },
    ],
  },
  authors: {
    label: 'Tác giả',
    fields: [
      { name: 'first_name', label: 'Họ', required: true },
      { name: 'last_name', label: 'Tên', required: true },
      { name: 'date_of_birth', label: 'Ngày sinh', kind: 'date' },
      { name: 'date_of_death', label: 'Ngày mất', kind: 'date' },
    ],
    columns: [
      { title: 'TÊN TÁC GIẢ', dataIndex: 'full_name' },
      { title: 'NGÀY SINH', dataIndex: 'date_of_birth' },
      { title: 'NGÀY MẤT', dataIndex: 'date_of_death' },
    ],
  },
  genres: {
    label: 'Thể loại',
    fields: [{ name: 'name', label: 'Tên thể loại', required: true }],
    columns: [{ title: 'TÊN THỂ LOẠI', dataIndex: 'name' }],
  },
  languages: {
    label: 'Ngôn ngữ',
    fields: [{ name: 'name', label: 'Tên ngôn ngữ', required: true }],
    columns: [{ title: 'TÊN NGÔN NGỮ', dataIndex: 'name' }],
  },
  'book-instances': {
    label: 'Bản sao',
    fields: [
      { name: 'book', label: 'Đầu sách', kind: 'books', required: true },
      { name: 'imprint', label: 'Ấn bản' },
      {
        name: 'status',
        label: 'Trạng thái',
        kind: 'status',
        required: true,
      },
    ],
    columns: [
      { title: 'UUID', dataIndex: 'id', render: (id) => <span className="mono-id">{id}</span> },
      { title: 'ĐẦU SÁCH', dataIndex: 'book_title' },
      { title: 'ẤN BẢN', dataIndex: 'imprint' },
      { title: 'TRẠNG THÁI', dataIndex: 'status_label' },
    ],
  },
}

export default function AdminCatalogPage() {
  const [activeKey, setActiveKey] = useState('books')
  const [rows, setRows] = useState([])
  const [references, setReferences] = useState({ authors: [], genres: [], languages: [], books: [] })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form] = Form.useForm()
  const [modal, modalContextHolder] = Modal.useModal()
  const definition = resourceDefinitions[activeKey]

  const load = async (key = activeKey) => {
    setLoading(true)
    try {
      const [payload, authors, genres, languages, books] = await Promise.all([
        catalogApi.list(key),
        catalogApi.list('authors'),
        catalogApi.list('genres'),
        catalogApi.list('languages'),
        catalogApi.list('books'),
      ])
      setRows(listPayload(payload))
      setReferences({
        authors: listPayload(authors),
        genres: listPayload(genres),
        languages: listPayload(languages),
        books: listPayload(books),
      })
    } catch (error) {
      notification.error({ message: `Không tải được ${definition.label.toLowerCase()}`, description: error.message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(activeKey) }, [activeKey])

  const options = useMemo(() => ({
    authors: references.authors.map((item) => ({ value: item.id, label: item.full_name })),
    genres: references.genres.map((item) => ({ value: item.id, label: item.name })),
    languages: references.languages.map((item) => ({ value: item.id, label: item.name })),
    books: references.books.map((item) => ({ value: item.id, label: `${item.title} (${item.isbn})` })),
  }), [references])

  const openCreate = () => {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({ status: 'a', genre: [] })
    setOpen(true)
  }

  const openEdit = async (row) => {
    try {
      const record = await catalogApi.detail(activeKey, row.id)
      setEditing(record)
      form.resetFields()
      form.setFieldsValue(record)
      setOpen(true)
    } catch (error) {
      notification.error({ message: 'Không tải được chi tiết', description: error.message })
    }
  }

  const save = async (values) => {
    const payload = { ...values }
    for (const field of definition.fields) {
      if (field.kind === 'date' && !payload[field.name]) payload[field.name] = null
    }

    setSaving(true)
    try {
      if (editing) await catalogApi.update(activeKey, editing.id, payload)
      else await catalogApi.create(activeKey, payload)
      notification.success({ message: editing ? 'Đã cập nhật' : 'Đã tạo mới' })
      setOpen(false)
      await load()
    } catch (error) {
      notification.error({ message: 'Không lưu được dữ liệu', description: error.message })
    } finally {
      setSaving(false)
    }
  }

  const remove = (row) => modal.confirm({
    title: 'Xóa mục này?',
    content: 'Nếu dữ liệu đang được tham chiếu, máy chủ có thể từ chối thao tác.',
    okText: 'Xóa',
    okButtonProps: { danger: true },
    cancelText: 'Hủy',
    onOk: async () => {
      try {
        await catalogApi.remove(activeKey, row.id)
        notification.success({ message: 'Đã xóa' })
        await load()
      } catch (error) {
        notification.error({ message: 'Không xóa được mục này', description: error.message })
      }
    },
  })

  const columns = [
    ...definition.columns,
    {
      title: 'THAO TÁC',
      key: 'actions',
      render: (_, row) => (
        <Space>
          <Button
            danger
            icon={<DeleteOutlined />}
            aria-label="Xóa"
            disabled={
              (activeKey === 'books' && Number(row.total_copies) > 0) ||
              (activeKey === 'book-instances' && row.status === 'o')
            }
            title={
              activeKey === 'books' && Number(row.total_copies) > 0
                ? 'Xóa các bản sao trước'
                : activeKey === 'book-instances' && row.status === 'o'
                  ? 'Ghi nhận trả sách trước'
                  : 'Xóa'
            }
            onClick={() => remove(row)}
          />
        </Space>
      ),
    },
  ]

  const tabs = Object.entries(resourceDefinitions).map(([key, item]) => ({ key, label: item.label }))

  return (
    <div className="page">
      {modalContextHolder}
      <div className="page-heading"><div><div className="eyebrow">DOMAIN 1 · CATALOG</div><h1>Quản lý danh mục</h1><p className="muted">CRUD sách, tác giả, thể loại, ngôn ngữ và bản sao.</p></div><Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Thêm {definition.label.toLowerCase()}</Button></div>
      <section className="panel catalog-panel">
        <Tabs activeKey={activeKey} items={tabs} onChange={setActiveKey} />
        <Table rowKey="id" loading={loading} columns={columns} dataSource={rows} pagination={{ pageSize: 10, showSizeChanger: false }} scroll={{ x: true }} />
      </section>
      <Modal title={editing ? `Sửa ${definition.label.toLowerCase()}` : `Thêm ${definition.label.toLowerCase()}`} open={open} onCancel={() => setOpen(false)} onOk={() => form.submit()} confirmLoading={saving} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={save}>
          {definition.fields.map((field) => {
            const selectOptions = field.kind === 'status'
              ? [
                { value: 'a', label: 'Có sẵn' },
                { value: 'd', label: 'Bảo trì' },
                { value: 'r', label: 'Đặt trước' },
                ...(editing?.status === 'o' ? [{ value: 'o', label: 'Đang mượn' }] : []),
              ]
              : options[field.kind]

            return (
              <Form.Item key={field.name} name={field.name} label={field.label} rules={field.required ? [{ required: true, message: `Nhập ${field.label.toLowerCase()}` }] : []}>
                {field.kind === 'textarea'
                  ? <Input.TextArea rows={3} />
                  : field.kind === 'date'
                    ? <Input type="date" />
                    : selectOptions
                      ? <Select mode={field.kind === 'genres' ? 'multiple' : undefined} options={selectOptions} disabled={field.name === 'status' && editing?.status === 'o'} />
                      : <Input />}
              </Form.Item>
            )
          })}
        </Form>
      </Modal>
    </div>
  )
}
