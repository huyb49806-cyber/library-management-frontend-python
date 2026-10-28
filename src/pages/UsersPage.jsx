import { useEffect, useState } from 'react'
import { Avatar, Button, Form, Input, Modal, notification, Select, Space, Switch, Table, Tag } from 'antd'
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import { useSelector } from 'react-redux'
import { authApi } from '../api/client'

const listPayload = (payload) => Array.isArray(payload) ? payload : payload?.results || []
const groupOptions = ['Member', 'Librarian', 'Admin'].map((value) => ({ value, label: value }))

export default function UsersPage() {
  const currentUser = useSelector((state) => state.auth.user)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form] = Form.useForm()
  const [modal, modalContextHolder] = Modal.useModal()

  const load = async () => {
    setLoading(true)
    try {
      setUsers(listPayload(await authApi.users()))
    } catch (error) {
      notification.error({ message: 'Không tải được người dùng', description: error.message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (currentUser?.role === 'Admin') load()
  }, [currentUser?.role])

  const openCreate = () => {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({ groups: ['Member'], is_active: true })
    setOpen(true)
  }

  const openEdit = (record) => {
    setEditing(record)
    form.resetFields()
    form.setFieldsValue({ ...record, password: '' })
    setOpen(true)
  }

  const save = async (values) => {
    const payload = { ...values, groups: values.groups || [] }
    if (!payload.password) delete payload.password

    setSaving(true)
    try {
      if (editing) await authApi.updateUser(editing.id, payload)
      else await authApi.createUser(payload)
      notification.success({ message: editing ? 'Đã cập nhật tài khoản' : 'Đã tạo tài khoản' })
      setOpen(false)
      await load()
    } catch (error) {
      notification.error({ message: 'Không lưu được tài khoản', description: error.message })
    } finally {
      setSaving(false)
    }
  }

  const remove = (record) => {
    modal.confirm({
      title: `Xóa tài khoản ${record.username}?`,
      content: 'Thao tác này không thể hoàn tác.',
      okText: 'Xóa tài khoản',
      okButtonProps: { danger: true },
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await authApi.deleteUser(record.id)
          notification.success({ message: 'Đã xóa tài khoản' })
          await load()
        } catch (error) {
          notification.error({ message: 'Không xóa được tài khoản', description: error.message })
        }
      },
    })
  }

  const columns = [
    {
      title: 'TÀI KHOẢN',
      dataIndex: 'username',
      render: (name, row) => <div className="reader"><Avatar size={30} className="reader-avatar">{name?.slice(0, 2).toUpperCase()}</Avatar><span><strong>{name}</strong><small>{row.email || 'Chưa cập nhật email'}</small></span></div>,
    },
    { title: 'VAI TRÒ', dataIndex: 'groups', render: (groups) => groups?.length ? groups.join(', ') : 'Chưa gán nhóm' },
    { title: 'TRẠNG THÁI', dataIndex: 'is_active', render: (active) => <Tag color={active ? 'success' : 'error'}>{active ? 'Đang hoạt động' : 'Đã khóa'}</Tag> },
    {
      title: 'THAO TÁC',
      key: 'actions',
      render: (_, row) => <Space><Button icon={<EditOutlined />} aria-label="Sửa tài khoản" onClick={() => openEdit(row)} /><Button danger icon={<DeleteOutlined />} aria-label="Xóa tài khoản" disabled={row.id === currentUser?.id} onClick={() => remove(row)} /></Space>,
    },
  ]

  return (
    <div className="page">
      {modalContextHolder}
      <div className="page-heading"><div><div className="eyebrow">DOMAIN 2 · USER MANAGEMENT</div><h1>Người dùng</h1><p className="muted">Quản lý tài khoản, trạng thái và nhóm quyền.</p></div><Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Thêm người dùng</Button></div>
      <section className="panel catalog-panel"><Table rowKey="id" loading={loading} columns={columns} dataSource={users} pagination={{ pageSize: 8, showSizeChanger: false }} /></section>
      <Modal title={editing ? 'Cập nhật tài khoản' : 'Thêm người dùng'} open={open} onCancel={() => setOpen(false)} onOk={() => form.submit()} confirmLoading={saving} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={save}>
          <Form.Item name="username" label="Tên đăng nhập" rules={[{ required: true, message: 'Nhập tên đăng nhập' }]}><Input /></Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email', message: 'Nhập email hợp lệ' }]}><Input /></Form.Item>
          <Form.Item name="first_name" label="Họ"><Input /></Form.Item>
          <Form.Item name="last_name" label="Tên"><Input /></Form.Item>
          <Form.Item name="groups" label="Nhóm quyền"><Select mode="multiple" options={groupOptions} /></Form.Item>
          <Form.Item name="is_active" label="Tài khoản đang hoạt động" valuePropName="checked"><Switch /></Form.Item>
          <Form.Item name="password" label={editing ? 'Mật khẩu mới (để trống để giữ nguyên)' : 'Mật khẩu'} rules={editing ? [] : [{ required: true, message: 'Nhập mật khẩu' }]}><Input.Password autoComplete="new-password" /></Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
