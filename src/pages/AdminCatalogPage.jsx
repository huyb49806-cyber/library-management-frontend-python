import { useEffect, useMemo, useState } from 'react'
import {
  AutoComplete,
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  notification,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
} from 'antd'
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import { catalogApi } from '../api/client'

const listPayload = (payload) =>
  Array.isArray(payload) ? payload : payload?.results || []

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
      {
        title: 'TÁC GIẢ',
        render: (_, row) => row.author_detail?.full_name || row.author,
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
        title: 'BẢN SAO CÓ SẴN',
        render: (_, row) =>
          `${row.available_copies || 0} / ${row.total_copies || 0}`,
      },
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
      { name: 'id', label: 'Mã vạch (UUID - để trống nếu tự sinh)' },
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
      {
        title: 'UUID',
        dataIndex: 'id',
        render: (id) => <span className="mono-id">{id}</span>,
      },
      { title: 'ĐẦU SÁCH', dataIndex: 'book_title' },
      { title: 'ẤN BẢN', dataIndex: 'imprint' },
      { title: 'TRẠNG THÁI', dataIndex: 'status_label' },
    ],
  },
}

export default function AdminCatalogPage() {
  const [activeKey, setActiveKey] = useState('books')
  const [rows, setRows] = useState([])
  const [references, setReferences] = useState({
    authors: [],
    genres: [],
    languages: [],
    books: [],
  })
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
      notification.error({
        message: `Không tải được ${definition.label.toLowerCase()}`,
        description: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load(activeKey)
  }, [activeKey])

  const options = useMemo(
    () => ({
      authors: references.authors.map((item) => ({
        value: item.id,
        label: item.full_name,
      })),
      genres: references.genres.map((item) => ({
        value: item.id,
        label: item.name,
      })),
      languages: references.languages.map((item) => ({
        value: item.id,
        label: item.name,
      })),
      books: references.books.map((item) => ({
        value: item.id,
        label: `${item.title} (${item.isbn})`,
      })),
    }),
    [references]
  )

  const openCreate = () => {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({ status: 'a', genre: [], copies: 1 })
    setOpen(true)
  }

  const openEdit = async (row) => {
    try {
      const record = await catalogApi.detail(activeKey, row.id)
      setEditing(record)
      form.resetFields()
      if (activeKey === 'books') {
        form.setFieldsValue({
          ...record,
          author: record.author_detail?.full_name || record.author,
          language: record.language_detail?.name || record.language,
          genre: record.genre_details
            ? record.genre_details.map((g) => g.name)
            : record.genre,
          copies: record.total_copies ?? 1,
        })
      } else {
        form.setFieldsValue(record)
      }
      setOpen(true)
    } catch (error) {
      notification.error({
        message: 'Không tải được chi tiết',
        description: error.message,
      })
    }
  }

  const save = async (values) => {
    const payload = { ...values }
    if (payload.id !== undefined && (!payload.id || !payload.id.trim())) {
      delete payload.id
    }
    for (const field of definition.fields) {
      if (field.kind === 'date' && !payload[field.name]) payload[field.name] = null
    }

    if (activeKey === 'books') {
      if (typeof payload.author === 'string') payload.author = payload.author.trim()
      if (typeof payload.language === 'string') payload.language = payload.language.trim()
      if (payload.isbn) payload.isbn = payload.isbn.trim()
      if (payload.copies !== undefined && payload.copies !== null) {
        payload.copies = Number(payload.copies)
      }
    }

    setSaving(true)
    try {
      if (editing) await catalogApi.update(activeKey, editing.id, payload)
      else await catalogApi.create(activeKey, payload)
      notification.success({ message: editing ? 'Đã cập nhật' : 'Đã tạo mới' })
      setOpen(false)
      await load()
    } catch (error) {
      notification.error({
        message: 'Không lưu được dữ liệu',
        description: error.message,
      })
    } finally {
      setSaving(false)
    }
  }

  const remove = (row) =>
    modal.confirm({
      title: 'Xóa mục này?',
      content:
        'Nếu dữ liệu đang được tham chiếu, máy chủ có thể từ chối thao tác.',
      okText: 'Xóa',
      okButtonProps: { danger: true },
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await catalogApi.remove(activeKey, row.id)
          notification.success({ message: 'Đã xóa' })
          await load()
        } catch (error) {
          notification.error({
            message: 'Không xóa được mục này',
            description: error.message,
          })
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
            icon={<EditOutlined />}
            aria-label="Sửa"
            title="Sửa"
            onClick={() => openEdit(row)}
          />
          <Button
            danger
            icon={<DeleteOutlined />}
            aria-label="Xóa"
            disabled={activeKey === 'book-instances' && row.status === 'o'}
            title={
              activeKey === 'book-instances' && row.status === 'o'
                ? 'Ghi nhận trả sách trước'
                : 'Xóa'
            }
            onClick={() => remove(row)}
          />
        </Space>
      ),
    },
  ]

  const tabs = Object.entries(resourceDefinitions).map(([key, item]) => ({
    key,
    label: item.label,
  }))

  return (
    <div className="page">
      {modalContextHolder}
      <div className="page-heading">
        <div>
          <div className="eyebrow">DOMAIN 1 · CATALOG</div>
          <h1>Quản lý danh mục</h1>
          <p className="muted">CRUD sách, tác giả, thể loại, ngôn ngữ và bản sao.</p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Thêm {definition.label.toLowerCase()}
        </Button>
      </div>

      <section className="panel catalog-panel">
        <Tabs activeKey={activeKey} items={tabs} onChange={setActiveKey} />
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={rows}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          scroll={{ x: true }}
        />
      </section>

      <Modal
        title={
          editing
            ? `Sửa ${definition.label.toLowerCase()}`
            : `Thêm ${definition.label.toLowerCase()}`
        }
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={saving}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={save}>
          {activeKey === 'books' ? (
            <>
              <Form.Item
                name="title"
                label="Tên sách"
                rules={[{ required: true, message: 'Vui lòng nhập tên sách' }]}
              >
                <Input placeholder="Nhập tên đầu sách..." autoFocus />
              </Form.Item>

              <Form.Item
                name="author"
                label="Tác giả"
                rules={[
                  { required: true, message: 'Vui lòng nhập hoặc chọn tên tác giả' },
                ]}
                extra="Bạn có thể tự gõ tên tác giả mới hoặc chọn từ danh sách gợi ý."
              >
                <AutoComplete
                  options={references.authors.map((item) => ({
                    value: item.full_name,
                    label: item.full_name,
                  }))}
                  filterOption={(inputValue, option) =>
                    option?.value
                      ?.toUpperCase()
                      .indexOf(inputValue.toUpperCase()) !== -1
                  }
                  placeholder="Nhập tên tác giả (VD: Nguyễn Nhật Ánh, Nam Cao...)"
                  allowClear
                />
              </Form.Item>

              <Form.Item
                name="language"
                label="Ngôn ngữ"
                rules={[
                  { required: true, message: 'Vui lòng nhập hoặc chọn ngôn ngữ' },
                ]}
                extra="Bạn có thể tự gõ tên ngôn ngữ hoặc chọn từ gợi ý."
              >
                <AutoComplete
                  options={references.languages.map((item) => ({
                    value: item.name,
                    label: item.name,
                  }))}
                  filterOption={(inputValue, option) =>
                    option?.value
                      ?.toUpperCase()
                      .indexOf(inputValue.toUpperCase()) !== -1
                  }
                  placeholder="Nhập ngôn ngữ (VD: Tiếng Việt, Tiếng Anh...)"
                  allowClear
                />
              </Form.Item>

              <Form.Item
                name="genre"
                label="Thể loại"
                extra="Chọn một hoặc nhiều thể loại, hoặc tự gõ thể loại mới."
              >
                <Select
                  mode="tags"
                  options={references.genres.map((item) => ({
                    value: item.name,
                    label: item.name,
                  }))}
                  placeholder="Chọn hoặc nhập thể loại (VD: Văn học, Khoa học...)"
                  allowClear
                />
              </Form.Item>

              <Form.Item
                name="isbn"
                label="Mã ISBN"
                rules={[{ required: true, message: 'Vui lòng nhập mã ISBN' }]}
              >
                <Input placeholder="Nhập mã ISBN (13 số)..." maxLength={13} />
              </Form.Item>

              <Form.Item
                name="copies"
                label="Số lượng bản sao trong kho"
                initialValue={1}
                rules={[
                  {
                    required: true,
                    message: 'Vui lòng nhập số lượng bản sao',
                  },
                ]}
                extra={
                  editing
                    ? `Hiện có ${editing.total_copies ?? 0} bản sao (${editing.available_copies ?? 0} có sẵn). Tăng số lượng sẽ tự động tạo thêm bản sao mới vào kho.`
                    : 'Số lượng bản sao thực tế nhập kho (mặc định: 1).'
                }
              >
                <InputNumber
                  min={1}
                  max={100}
                  style={{ width: '100%' }}
                  placeholder="Nhập số lượng bản sao (VD: 1, 3, 5...)"
                />
              </Form.Item>

              <Form.Item name="summary" label="Mô tả">
                <Input.TextArea
                  rows={3}
                  placeholder="Tóm tắt nội dung sách (không bắt buộc)..."
                />
              </Form.Item>
            </>
          ) : (
            definition.fields.map((field) => {
              const selectOptions =
                field.kind === 'status'
                  ? [
                      { value: 'a', label: 'Có sẵn' },
                      { value: 'd', label: 'Bảo trì' },
                      { value: 'r', label: 'Đặt trước' },
                      ...(editing?.status === 'o'
                        ? [{ value: 'o', label: 'Đang mượn' }]
                        : []),
                    ]
                  : options[field.kind]

              return (
                <Form.Item
                  key={field.name}
                  name={field.name}
                  label={field.label}
                  rules={
                    field.required
                      ? [
                          {
                            required: true,
                            message: `Nhập ${field.label.toLowerCase()}`,
                          },
                        ]
                      : []
                  }
                >
                  {field.kind === 'textarea' ? (
                    <Input.TextArea rows={3} />
                  ) : field.kind === 'date' ? (
                    <Input type="date" />
                  ) : selectOptions ? (
                    <Select
                      mode={field.kind === 'genres' ? 'multiple' : undefined}
                      options={selectOptions}
                      disabled={
                        field.name === 'status' && editing?.status === 'o'
                      }
                    />
                  ) : (
                    <Input disabled={Boolean(editing && field.name === 'id')} />
                  )}
                </Form.Item>
              )
            })
          )}
        </Form>
      </Modal>
    </div>
  )
}
