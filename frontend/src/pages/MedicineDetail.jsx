import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";
import "../assets/css/MedicineDetail.css";
import HeroBanner from "../components/HeroBanner";
import TopBarComponent from "../components/TopBarComponent";

const MEDICINE_BANNER = "https://img.freepik.com/premium-photo/pills-medical-equiupments-green-banner-background_8087-321.jpg";

const MedicineDetail = () => {
    const { medicineId } = useParams();
    const [medicine, setMedicine] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const typeRef = useRef(null);
    const groupRef = useRef(null);
    const ingredientRef = useRef(null);
    const indicationRef = useRef(null);
    const contraindicationRef = useRef(null);
    const dosageRef = useRef(null);
    const sideEffectsRef = useRef(null);
    const precautionRef = useRef(null);
    const interactionRef = useRef(null);
    const storageRef = useRef(null);
    const scrollToTarget = (targetRef) => {
        const headerOffset = 160; // chiều cao header cố định
        const elementPosition = targetRef.current.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    }

    useEffect(() => {
        const fetchMedicine = async () => {
            try {
                const res = await axios.get(`/api/user/medicines/${medicineId}`);
                console.log("API Response:", res.data);
                if (res.data.data) {
                    setMedicine(res.data.data);
                } else if (res.data) {
                    setMedicine(res.data);
                } else {
                    throw new Error("Invalid response format");
                }
                setLoading(false);
            } catch (error) {
                console.error("Error fetching medicine details:", error);
                setError("Failed to load medicine details. Please check the console for more details.");
                setLoading(false);
            }
        };

        fetchMedicine();
    }, [medicineId]);

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
                <Link to="/medicines-home" className="btn btn-primary mt-3">Back to Medicine Home</Link>
            </div>
        );
    }

    return (
        <>
            {/* Topbar */}
            <TopBarComponent />

            {/* Hero Carousel */}
            <HeroBanner
                image={MEDICINE_BANNER}
                title="Danh Mục Thuốc"
                subtitle="Tra cứu thông tin, tác dụng, chỉ định và giá thuốc tại KiwiCare"
            />

            <div className="medicine-detail-container">
                <h1 className="medicine-detail-title">{medicine.name}</h1>

            <div className="medicine-detail-ref">
                <button onClick={() => scrollToTarget(typeRef)}>Dạng bào chế</button>
                <button onClick={() => scrollToTarget(groupRef)}>Nhóm thuốc</button>
                <button onClick={() => scrollToTarget(ingredientRef)}>Hoạt chất</button>
                <button onClick={() => scrollToTarget(indicationRef)}>Chỉ định</button>
                <button onClick={() => scrollToTarget(contraindicationRef)}>Chống chỉ định</button>
                <button onClick={() => scrollToTarget(dosageRef)}>Liều dùng</button>
                <button onClick={() => scrollToTarget(sideEffectsRef)}>Tác dụng phụ</button>
                <button onClick={() => scrollToTarget(precautionRef)}>Thận trọng</button>
                <button onClick={() => scrollToTarget(interactionRef)}>Tương tác thuốc</button>
                <button onClick={() => scrollToTarget(storageRef)}>Bảo quản</button>
            </div>

                <section ref={ typeRef } className="medicine-detail-section">
                    <h2>Dạng bào chế</h2>
                    <div>{medicine.type || "-"}</div>
                </section>

                <section ref={ groupRef } className="medicine-detail-section">
                    <h2>Nhóm thuốc</h2>
                    <div>{medicine.group || "-"}</div>
                </section>

                <section ref={ ingredientRef } className="medicine-detail-section">
                    <h2>Hoạt chất</h2>
                    <div>{medicine.ingredient || "-"}</div>
                </section>

                <section ref={ indicationRef } className="medicine-detail-section">
                    <h2>Chỉ định</h2>
                    <div>{medicine.indication || "-"}</div>
                </section>

                <section ref={ contraindicationRef } className="medicine-detail-section">
                    <h2>Chống chỉ định</h2>
                    <div>{medicine.contraindication || "-"}</div>
                </section>

                <section ref={ dosageRef } className="medicine-detail-section">
                    <h2>Liều dùng</h2>
                    <div>{medicine.dosage || "-"}</div>
                </section>

                <section ref={ sideEffectsRef } className="medicine-detail-section">
                    <h2>Tác dụng phụ</h2>
                    <div>{medicine.sideEffects || "-"}</div>
                </section>

                <section ref={ precautionRef } className="medicine-detail-section">
                    <h2>Thận trọng</h2>
                    <div>{medicine.precaution || "-"}</div>
                </section>

                <section ref={ interactionRef } className="medicine-detail-section">
                    <h2>Tương tác thuốc</h2>
                    <div>{medicine.interaction || "-"}</div>
                </section>

                <section ref={ storageRef } className="medicine-detail-section">
                    <h2>Bảo quản</h2>
                    <div>{medicine.storage || "-"}</div>
                </section>

                <Link to="/medicines-home" className="btn btn-secondary mt-3">Quay lại danh mục thuốc</Link>
            </div>
        </>

    );
};

export default MedicineDetail;