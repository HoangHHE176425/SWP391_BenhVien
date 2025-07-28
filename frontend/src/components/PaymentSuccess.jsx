import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

const PaymentSuccess = () => {
    const [searchParams] = useSearchParams();
    const paymentId = searchParams.get('paymentId');
    const [loading, setLoading] = useState(true);
    const [payment, setPayment] = useState(null);

    useEffect(() => {
        const fetchPayment = async () => {
            try {
                const res = await fetch(`http://localhost:9999/api/staff/success/${paymentId}`);
                const data = await res.json();
                if (data.success) {
                    setPayment(data.data);
                }
            } catch (error) {
                console.error('Lỗi khi tải dữ liệu thanh toán:', error);
            } finally {
                setLoading(false);
            }
        };

        if (paymentId) {
            fetchPayment();
        } else {
            setLoading(false);
        }
    }, [paymentId]);

    if (loading) return <p>Đang tải thông tin thanh toán...</p>;
    if (!payment) return <p>Không tìm thấy thông tin thanh toán.</p>;

    return (
        <div className="container">
            <h2>Thanh toán thành công</h2>
            <p><strong>Số hóa đơn:</strong> {payment.invoiceId?.invoiceNumber}</p>
            <p><strong>Số tiền:</strong> {payment.amount} VNĐ</p>
            <p><strong>Phương thức:</strong> {payment.method}</p>
            <p><strong>Thời gian:</strong> {new Date(payment.paymentDate).toLocaleString()}</p>
        </div>
    );
};

export default PaymentSuccess;
