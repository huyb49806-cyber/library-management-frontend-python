import { useState } from 'react'
import { Button, Form, Input, notification } from 'antd'
import { ArrowLeftOutlined, ArrowRightOutlined, MailOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import { authApi } from '../api/client'

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false)
  const submit = async ({ email }) => { setLoading(true); try { await authApi.requestPasswordReset(email); notification.success({ message: 'Đã gửi yêu cầu', description: 'Nếu email tồn tại, hướng dẫn khôi phục đã được gửi.' }) } catch (error) { notification.error({ message: 'Không thể gửi yêu cầu', description: error.message }) } finally { setLoading(false) } }
  return <main className="login-page"><div className="login-visual"><div className="visual-brand"><span className="brand-mark">L</span><span>LUMINA</span></div><div className="visual-copy"><span className="eyebrow light">ACCOUNT RECOVERY</span><h1>Trở lại với<br /><em>tri thức.</em></h1><p>Nhập email đã đăng ký để nhận liên kết khôi phục mật khẩu.</p></div><div className="visual-foot">© 2026 Lumina University Library</div></div><div className="login-form-wrap"><div className="login-form"><Link to="/login" className="back-link"><ArrowLeftOutlined /> Quay lại đăng nhập</Link><div className="eyebrow">KHÔI PHỤC MẬT KHẨU</div><h2>Quên mật khẩu?</h2><p className="muted">Chúng tôi sẽ gửi hướng dẫn đến email của bạn.</p><Form layout="vertical" size="large" onFinish={submit}><Form.Item label="Email" name="email" rules={[{ required: true, type: 'email', message: 'Nhập email hợp lệ' }]}><Input prefix={<MailOutlined />} placeholder="email@university.edu.vn" /></Form.Item><Button type="primary" htmlType="submit" block loading={loading} icon={<ArrowRightOutlined />} iconPosition="end">Gửi liên kết khôi phục</Button></Form></div></div></main>
}
