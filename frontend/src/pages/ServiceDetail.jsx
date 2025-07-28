import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";
import "../assets/css/ServiceDetail.css";
import HeroBanner from "../components/HeroBanner";
import TopBarComponent from "../components/TopBarComponent";

const DEPT_BANNER = "https://xdcs.cdnchinhphu.vn/446259493575335936/2024/1/13/bv-1705119640880430272769.jpg";

const ServiceDetail = () => {
    const { serviceId } = useParams();
    const [service, setService] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchService = async () => {
            try {
                const res = await axios.get(`/api/user/service/${serviceId}`);
                console.log("API Response:", res.data);
                if (Array.isArray(res.data.service)) {
                    setService(res.data.service[0]);
                } else if (res.data.data) {
                    setService(res.data.data);
                } else if (res.data.service) {
                    setService(res.data.service);
                } else {
                    throw new Error("Invalid response format");
                }
                setLoading(false);
            } catch (error) {
                console.error("Error fetching service details:", error);
                setError("Failed to load service details. Please check the console for more details.");
                setLoading(false);
            }
        };

        fetchService();
    }, [serviceId]);

    if (loading) {
        return (
            <div className="text-center py-5">
                <h3>Loading...</h3>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-5">
                <h3>{error}</h3>
                <Link to="/service-home" className="btn btn-primary mt-3">Back to Service Home</Link>
            </div>
        );
    }

    return (
        <>
            {/* Topbar */}
            <TopBarComponent />

            {/* Hero Carousel */}
            <HeroBanner
                image={DEPT_BANNER}
                title="Dịch Vụ Y Tế KiwiCare"
                subtitle="Chăm sóc sức khỏe toàn diện với các chuyên khoa hàng đầu"
            />

            <div className="service-detail-container">
                <h1 className="service-detail-title">{service.name}</h1>
                <div className="service-detail-desc">
                    <b>Mô tả dịch vụ:</b>
                    <div>{service.description || "Chưa cập nhật mô tả."}</div>
                </div>
                <div className="service-detail-price">
                    <b>Giá dịch vụ:</b>
                    <span>{service.price?.toLocaleString()} VNĐ</span>
                </div>
                <Link className="btn btn-secondary mt-4" to="/service-home">Quay lại danh sách dịch vụ</Link>
            </div>
        </>

    );
};

export default ServiceDetail;