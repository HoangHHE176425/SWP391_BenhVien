import React from 'react';
import { useSearchParams } from 'react-router-dom';

const PaymentFail = () => {
    const [searchParams] = useSearchParams();
    const reason = searchParams.get('reason');

    const getMessage = () => {
        switch (reason) {
            case 'not_found':
                return 'Không tìm thấy giao dịch.';
            case 'server_error':
                return 'Đã xảy ra lỗi máy chủ.';
            default:
                return 'Giao dịch không thành công.';
        }
    };

    return (
        <div className="container">
            <h2>Thanh toán thất bại</h2>
            <p>{getMessage()}</p>
        </div>
    );
};

export default PaymentFail;
