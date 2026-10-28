import { useEffect, useState } from 'react'
import { Button, Form, Input, Modal, notification, Space, Table, Tag } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useSelector } from 'react-redux'
import { circulationApi } from '../api/client'

const listPayload = (payload) =>
  Array.isArray(payload) ? payload : payload?.results || []

export default function LoansPage() {
  const user = useSelector((state) => state.auth.user)
  const canOperate = ['Admin', 'Librarian'].includes(user?.role)

  const [loans, setLoans] = useState([])
  const [loading, setLoading] = useState(true)
  const [borrowOpen, setBorrowOpen] = useState(false)
  const [renewTarget, setRenewTarget] = useState(null)
  const [saving, setSaving] = useState(false)

  const [borrowForm] = Form.useForm()
  const [renewForm] = Form.useForm()
  const [modal, modalContextHolder] = Modal.useModal()

  const load = async () => {
    setLoading(true)

    try {
      const payload = await circulationApi.loans()
      setLoans(listPayload(payload))
    } catch (error) {
      notification.error({
        message: 'Không tải được lượt mượn',
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
    setSaving(true)

    try {
      await circulationApi.borrow(values)
      notification.success({ message: 'Đã lập lượt mượn' })
      setBorrowOpen(false)
      borrowForm.resetFields()
      await load()
    } catch (error) {
      notification.error({
        message: 'Không thể lập lượt mượn',
        description: error.message,
      })
    } finally {
      setSaving(false)
    }
  }

  const renew = async (values) => {
    setSaving(true)

    try {
      await circulationApi.renew(renewTarget.id, values.due_back)
      notification.success({ message: 'Đã gia hạn' })
      setRenewTarget(null)
      renewForm.resetFields()
      await load()
    } catch (error) {
      notification.error({
        message: 'Không thể gia hạn',
        description: error.message,
      })
    } finally {
      setSaving(false)
    }
  }

  const returnBook = (loan) => {
    modal.confirm({
      title: 'Ghi nhận trả sách?',
      content: `Bản sao ${loan.id} sẽ được chuyển về trạng thái sẵn có.`,
      okText: 'Xác nhận trả',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await circulationApi.returnBook(loan.id)

          notification.success({
            message: 'Đã ghi nhận trả sách',
          })

          await load()
        } catch (error) {
          notification.error({
            message: 'Không thể ghi nhận trả sách',
            description: error.message,
          })

          throw error
        }
      },
    })
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
    },
    {
      title: 'TRẠNG THÁI',
      render: (_, row) => (
        <Tag color={row.is_overdue ? 'error' : 'processing'}>
          {row.is_overdue ? 'Quá hạn' : 'Đang mượn'}
        </Tag>
      ),
    },
    {
      title: 'THAO TÁC',
      render: (_, row) =>
        canOperate && (
          <Space>
            <Button
              onClick={() => {
                setRenewTarget(row)
                renewForm.setFieldsValue({
                  due_back: row.due_back,
                })
              }}
            >
              Gia hạn
            </Button>

            <Button
              danger
              onClick={() => returnBook(row)}
            >
              Trả sách
            </Button>
          </Space>
        ),
    },
  ]

  return (
    <div className="page">
      {modalContextHolder}

      <div className="page-heading">
        <div>
          <div className="eyebrow">DOMAIN 3 · CIRCULATION</div>
          <h1>Mượn & trả</h1>
          <p className="muted">
            Member chỉ xem lượt mượn của mình; Librarian/Admin quản lý toàn bộ
            lượt đang mở.
          </p>
        </div>

        {canOperate && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setBorrowOpen(true)}
          >
            Lập lượt mượn
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
        title="Lập lượt mượn"
        open={borrowOpen}
        onCancel={() => setBorrowOpen(false)}
        onOk={() => borrowForm.submit()}
        confirmLoading={saving}
        okText="Chốt mượn"
        cancelText="Hủy"
      >
        <Form
          form={borrowForm}
          layout="vertical"
          onFinish={borrow}
        >
          <Form.Item
            label="ID độc giả"
            name="member_id"
            rules={[{ required: true, message: 'Nhập ID độc giả' }]}
          >
            <Input inputMode="numeric" />
          </Form.Item>

          <Form.Item
            label="UUID bản sao"
            name="book_instance_id"
            rules={[{ required: true, message: 'Nhập UUID bản sao' }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Gia hạn sách"
        open={Boolean(renewTarget)}
        onCancel={() => setRenewTarget(null)}
        onOk={() => renewForm.submit()}
        confirmLoading={saving}
        okText="Lưu ngày mới"
        cancelText="Hủy"
      >
        <Form
          form={renewForm}
          layout="vertical"
          onFinish={renew}
        >
          <Form.Item
            label="Hạn trả mới"
            name="due_back"
            rules={[{ required: true, message: 'Chọn hạn trả mới' }]}
          >
            <Input type="date" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}