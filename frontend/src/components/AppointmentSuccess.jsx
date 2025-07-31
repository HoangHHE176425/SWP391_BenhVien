import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";

const AppointmentSuccess = () => {
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const orderCode = searchParams.get("orderCode");
        const serviceId = searchParams.get("serviceId");
        const amount = searchParams.get("amount");
        const userId = searchParams.get("userId");
        const profileId = searchParams.get("profileId");

        // Thêm các trường cần thiết để tạo appointment
        const doctorId = searchParams.get("doctorId");
        const department = searchParams.get("department");
        const date = searchParams.get("date"); // ISO string hoặc yyyy-MM-dd
        const time = searchParams.get("time"); // hh:mm

        if (orderCode && serviceId && amount && userId && profileId) {
            // 1. Gửi tạo hóa đơn
            fetch("http://localhost:9999/api/receptionist/appointmentinvoices", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderCode, serviceId, amount, userId, profileId }),
            })
                .then(res => res.json())
                .then(data => {
                    console.log("Invoice created:", data);

                    // 2. Tạo appointment sau khi hóa đơn xong
                    const appointmentDate = `${date}T${time}:00`; // ISO format
                    return axios.post("http://localhost:9999/api/user/create", {
                        profileId,
                        doctorId,
                        department,
                        appointmentDate,
                        type: "Offline",
                    }, {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("token")}`,
                        },
                    });
                })
                .then((res) => {
                    console.log("Appointment created:", res.data);
                })
                .catch((err) => {
                    console.error("Lỗi khi xử lý sau thanh toán:", err);
                });
        }
    }, [searchParams]);

    return (
        <div className="container text-center mt-5">
            <h2 className="text-success">🎉 Thanh toán thành công!</h2>
            <p>Cuộc hẹn đang được xác nhận và lưu vào hệ thống.</p>
            <a className="btn btn-primary mt-3" href="/appointmentmanage">Xem lịch hẹn</a>
        </div>
    );
};

export default AppointmentSuccess;
