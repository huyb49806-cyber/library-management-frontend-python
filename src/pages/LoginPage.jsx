import { useState } from 'react'
import { Button, Checkbox, Form, Input, notification } from 'antd'
import { LockOutlined, UserOutlined, ArrowRightOutlined, BookOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { setSession } from '../store'
import { authApi } from '../api/client'
import { clearStoredTokens, toSessionUser } from '../session'

export default function LoginPage() {
  const dispatch = useDispatch()
  const [loading, setLoading] = useState(false)

  const submit = async (values) => {
    setLoading(true)
    try {
      const tokens = await authApi.login(values)
      localStorage.setItem('access_token', tokens.access)
      localStorage.setItem('refresh_token', tokens.refresh)
      
      const profile = await authApi.me()
      dispatch(setSession({ user: toSessionUser(profile), ...tokens }))
      notification.success({ message: 'Đăng nhập thành công' })
    } catch (e) {
      clearStoredTokens()
      notification.error({ message: 'Không thể đăng nhập', description: e.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-page">
      <div className="login-visual">
        <div className="visual-brand">
          <span className="brand-mark">L</span>
          <span>LUMINA</span>
        </div>
        <div className="visual-copy">
          <span className="eyebrow light">UNIVERSITY LIBRARY</span>
          <h1>
            Một không gian
            <br />
            <em>cho tri thức.</em>
          </h1>
          <p>Quản lý bộ sưu tập, kết nối độc giả và đưa việc vận hành thư viện trở nên nhẹ nhàng hơn.</p>
        </div>
        <div className="visual-foot">© 2026 Lumina University Library</div>
      </div>

      <div className="login-form-wrap">
        <div className="login-form">
          <div className="mobile-logo">
            <BookOutlined /> LUMINA
          </div>
          <div className="eyebrow">CỔNG QUẢN TRỊ</div>
          <h2>Chào mừng trở lại</h2>
          <p className="muted">Đăng nhập để tiếp tục làm việc với thư viện.</p>

          <Form layout="vertical" size="large" onFinish={submit} initialValues={{ remember: true }}>
            <Form.Item
              label="Tên đăng nhập"
              name="username"
              rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập' }]}
            >
              <Input prefix={<UserOutlined />} placeholder="Nhập tên đăng nhập" />
            </Form.Item>

            <Form.Item
              label="Mật khẩu"
              name="password"
              rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Nhập mật khẩu" />
            </Form.Item>

            <div className="form-row">
              <Form.Item name="remember" valuePropName="checked" noStyle>
                <Checkbox>Ghi nhớ đăng nhập</Checkbox>
              </Form.Item>
              <Link to="/forgot-password" className="forgot">
                Quên mật khẩu?
              </Link>
            </div>

            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
              icon={<ArrowRightOutlined />}
              iconPosition="end"
            >
              Đăng nhập
            </Button>
          </Form>

          <div className="register-link">
            Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
          </div>
          <div className="login-note">Bạn cần hỗ trợ? Liên hệ quản trị viên hệ thống.</div>
        </div>
      </div>
    </main>
  )
}
