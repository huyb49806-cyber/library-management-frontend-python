import { useState } from 'react'
import { Button, Form, Input, notification } from 'antd'
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  LockOutlined,
} from '@ant-design/icons'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { authApi } from '../api/client'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const uid = searchParams.get('uid') || ''
  const token = searchParams.get('token') || ''
  const hasResetToken = Boolean(uid && token)

  const submit = async (values) => {
    setLoading(true)

    try {
      await authApi.confirmPasswordReset({
        uid,
        token,
        new_password: values.new_password,
      })

      notification.success({
        message: 'Đã đặt lại mật khẩu',
        description: 'Bạn có thể đăng nhập bằng mật khẩu mới.',
      })
      navigate('/login', { replace: true })
    } catch (error) {
      notification.error({
        message: 'Không thể đặt lại mật khẩu',
        description: error.message,
      })
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
          <span className="eyebrow light">ACCOUNT RECOVERY</span>
          <h1>
            Tạo lại
            <br />
            <em>mật khẩu.</em>
          </h1>
          <p>Chọn mật khẩu mới để tiếp tục sử dụng thư viện.</p>
        </div>

        <div className="visual-foot">© 2026 Lumina University Library</div>
      </div>

      <div className="login-form-wrap">
        <div className="login-form">
          <Link to="/login" className="back-link">
            <ArrowLeftOutlined /> Quay lại đăng nhập
          </Link>

          <div className="eyebrow">KHÔI PHỤC MẬT KHẨU</div>

          {hasResetToken ? (
            <>
              <h2>Đặt mật khẩu mới</h2>
              <p className="muted">
                Nhập mật khẩu mới cho tài khoản của bạn.
              </p>

              <Form
                form={form}
                layout="vertical"
                size="large"
                onFinish={submit}
              >
                <Form.Item
                  label="Mật khẩu mới"
                  name="new_password"
                  rules={[
                    { required: true, message: 'Vui lòng nhập mật khẩu mới' },
                    { min: 8, message: 'Mật khẩu tối thiểu 8 ký tự' },
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined />}
                    placeholder="Tối thiểu 8 ký tự"
                  />
                </Form.Item>

                <Form.Item
                  label="Xác nhận mật khẩu"
                  name="confirm_password"
                  dependencies={['new_password']}
                  rules={[
                    { required: true, message: 'Vui lòng xác nhận mật khẩu' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('new_password') === value) {
                          return Promise.resolve()
                        }
                        return Promise.reject(
                          new Error('Mật khẩu xác nhận không khớp')
                        )
                      },
                    }),
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined />}
                    placeholder="Nhập lại mật khẩu mới"
                  />
                </Form.Item>

                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  loading={loading}
                  icon={<ArrowRightOutlined />}
                  iconPosition="end"
                >
                  Lưu mật khẩu mới
                </Button>
              </Form>
            </>
          ) : (
            <>
              <h2>Liên kết không hợp lệ</h2>
              <p className="muted">
                Liên kết có thể đã hết hạn hoặc thiếu thông tin. Hãy yêu cầu
                gửi liên kết khôi phục mới.
              </p>

              <Button type="primary" block onClick={() => navigate('/forgot-password')}>
                Yêu cầu liên kết mới
              </Button>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
