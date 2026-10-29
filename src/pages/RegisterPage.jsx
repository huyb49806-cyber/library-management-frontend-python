import { useState } from 'react'
import { Alert, Button, Form, Input, Modal, notification } from 'antd'
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../api/client'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)
  const [modal, modalContextHolder] = Modal.useModal()

  const formatErrorMessage = (msg) => {
    if (!msg) return 'Vui lòng kiểm tra lại thông tin đăng ký.'
    if (msg.includes('Username already exists')) return 'Tên đăng nhập đã tồn tại. Vui lòng chọn tên đăng nhập khác.'
    if (msg.includes('Email already exists')) return 'Địa chỉ email này đã được sử dụng. Vui lòng sử dụng email khác.'
    if (msg.includes('Passwords do not match') || msg.includes('Mật khẩu chưa trùng khớp')) return 'Mật khẩu xác nhận không khớp với mật khẩu đã nhập.'
    if (msg.includes('student_code') || msg.includes('Mã sinh viên')) return 'Mã sinh viên này đã được sử dụng bởi một tài khoản khác.'
    return msg
  }

  const submit = async (values) => {
    setLoading(true)
    setErrorMessage(null)
    try {
      await authApi.register(values)
      modal.success({
        title: 'Đăng ký tài khoản thành công!',
        content: 'Tài khoản thành viên đã được tạo. Bạn có thể đăng nhập ngay bây giờ.',
        okText: 'Đăng nhập ngay',
        onOk: () => navigate('/login'),
      })
    } catch (error) {
      const friendlyError = formatErrorMessage(error.message)
      setErrorMessage(friendlyError)
      modal.error({
        title: 'Thông tin đăng ký không hợp lệ',
        content: friendlyError,
        okText: 'Kiểm tra lại',
      })
    } finally {
      setLoading(false)
    }
  }

  const onFinishFailed = ({ errorFields }) => {
    const errorCount = errorFields.length
    const firstMsg = errorFields[0]?.errors[0] || 'Vui lòng kiểm tra lại các trường thông tin.'
    const fullMsg = `Có ${errorCount} mục chưa hợp lệ: ${firstMsg}`
    setErrorMessage(fullMsg)
    modal.warning({
      title: 'Thông tin nhập chưa đúng hoặc còn thiếu',
      content: fullMsg,
      okText: 'Chỉnh sửa lại',
    })
  }

  return (
    <main className="login-page">
      {/* Visual Section */}
      <div className="login-visual">
        <div className="visual-brand">
          <span className="brand-mark">L</span>
          <span>LUMINA</span>
        </div>
        <div className="visual-copy">
          <span className="eyebrow light">UNIVERSITY LIBRARY</span>
          <h1>
            Mở cánh cửa
            <br />
            <em>đến tri thức.</em>
          </h1>
          <p>Tạo tài khoản thành viên để theo dõi sách đang mượn và những ngày cần trả.</p>
        </div>
        <div className="visual-foot">© 2026 Lumina University Library</div>
      </div>

      <div className="login-form-wrap">
        {modalContextHolder}
        <div className="login-form register-form">
          <Link to="/login" className="back-link">
            <ArrowLeftOutlined /> Quay lại đăng nhập
          </Link>
          <div className="eyebrow">TÀI KHOẢN THÀNH VIÊN</div>
          <h2>Tạo tài khoản</h2>
          <p className="muted">Đăng ký miễn phí để sử dụng thư viện.</p>

          {errorMessage && (
            <Alert
              message="Thông tin nhập chưa chính xác"
              description={errorMessage}
              type="error"
              showIcon
              closable
              onClose={() => setErrorMessage(null)}
              style={{ marginBottom: 20 }}
            />
          )}

          <Form layout="vertical" size="large" onFinish={submit} onFinishFailed={onFinishFailed}>
            <div className="form-columns">
              <Form.Item label="Họ" name="first_name" rules={[{ required: true, message: 'Nhập họ' }]}>
                <Input prefix={<UserOutlined />} placeholder="Nguyễn" />
              </Form.Item>
              <Form.Item label="Tên" name="last_name" rules={[{ required: true, message: 'Nhập tên' }]}>
                <Input placeholder="Văn An" />
              </Form.Item>
            </div>

            <Form.Item
              label="Tên đăng nhập"
              name="username"
              rules={[{ required: true, message: 'Nhập tên đăng nhập' }]}
            >
              <Input prefix={<UserOutlined />} placeholder="nguyen.van.an" />
            </Form.Item>

            <Form.Item
              label="Email"
              name="email"
              rules={[{ required: true, type: 'email', message: 'Nhập email hợp lệ' }]}
            >
              <Input prefix={<MailOutlined />} placeholder="email@university.edu.vn" />
            </Form.Item>

            <Form.Item label="Mã sinh viên" name="student_code">
              <Input placeholder="SV20260001" />
            </Form.Item>

            <Form.Item label="Số điện thoại" name="phone">
              <Input prefix={<PhoneOutlined />} placeholder="0900000000" />
            </Form.Item>

            <Form.Item
              label="Mật khẩu"
              name="password"
              rules={[{ required: true, min: 8, message: 'Mật khẩu tối thiểu 8 ký tự' }]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Tối thiểu 8 ký tự" />
            </Form.Item>

            <Form.Item
              label="Xác nhận mật khẩu"
              name="password_confirm"
              dependencies={['password']}
              rules={[
                { required: true, message: 'Xác nhận mật khẩu' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    return !value || getFieldValue('password') === value
                      ? Promise.resolve()
                      : Promise.reject(new Error('Mật khẩu chưa trùng khớp'))
                  },
                }),
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Nhập lại mật khẩu" />
            </Form.Item>

            {/* Nút đăng ký */}
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
              icon={<ArrowRightOutlined />}
              iconPosition="end"
            >
              Tạo tài khoản
            </Button>
          </Form>
        </div>
      </div>
    </main>
  )
}
