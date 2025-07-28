"use client"

import {useEffect, useState} from "react"
import { Link } from 'react-router-dom';

const MedicalTestForm = () => {
    const [activeTab, setActiveTab] = useState("send")
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Form state với các trường bạn yêu cầu
    const [formData, setFormData] = useState({
        fullName: "",
        gender: "",
        sampleType: "",
        collectionDate: "",
        containerType: "",
    });

    // Sample data for list view
    const [sentSamples, setSentSamples] = useState([]);

    const handleInputChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
    }

    useEffect( () => {
        const fetchData = async () => {
            const resp = await fetch("http://localhost:9999/api/lab/all");
            if (!resp.ok) {
                setSentSamples([]);
                return;
            }

            const respJson = await resp.json();
            console.log("response", respJson);
            setSentSamples(respJson.data)
        }
        fetchData();
    }, [activeTab])

    const handleSubmit = async (e) => {
        e.preventDefault("")
        setIsSubmitting(true)
        await fetch("http://localhost:9999/api/lab/create", {
            method: "POST",
            body: JSON.stringify(formData),
            headers: {
                'Content-Type': 'application/json'
            }
        });

        setIsSubmitting(false);
    }

    return (
        <div
            style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                backgroundColor: "#f1f5f9",
                minHeight: "100vh",
                padding: "20px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
            }}
        >
            <div
                style={{
                    backgroundColor: "white",
                    borderRadius: "12px",
                    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                    overflow: "hidden",
                    width: "100%",
                    maxWidth: "800px",
                }}
            >
                {/* Tab Buttons */}
                <div
                    style={{
                        display: "flex",
                        backgroundColor: "#f8fafc",
                        borderBottom: "1px solid #e2e8f0",
                    }}
                >
                    <button
                        onClick={() => setActiveTab("send")}
                        style={{
                            flex: 1,
                            padding: "16px 24px",
                            backgroundColor: activeTab === "send" ? "white" : "transparent",
                            color: activeTab === "send" ? "#3b82f6" : "#64748b",
                            border: "none",
                            fontSize: "1rem",
                            fontWeight: "500",
                            cursor: "pointer",
                            borderBottom: activeTab === "send" ? "2px solid #3b82f6" : "none",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                        }}
                    >
                        📤 Gửi Kết Quả
                    </button>
                    <button
                        onClick={() => setActiveTab("list")}
                        style={{
                            flex: 1,
                            padding: "16px 24px",
                            backgroundColor: activeTab === "list" ? "white" : "transparent",
                            color: activeTab === "list" ? "#3b82f6" : "#64748b",
                            border: "none",
                            fontSize: "1rem",
                            fontWeight: "500",
                            cursor: "pointer",
                            borderBottom: activeTab === "list" ? "2px solid #3b82f6" : "none",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                        }}
                    >
                        📋 Danh Sách Mẫu
                    </button>
                </div>

                {/* Tab Content */}
                <div style={{ padding: "32px" }}>
                    {activeTab === "send" && (
                        <div>
                            <h2
                                style={{
                                    fontSize: "1.5rem",
                                    fontWeight: "600",
                                    color: "#1e293b",
                                    marginBottom: "8px",
                                }}
                            >
                                Gửi Kết Quả Xét Nghiệm
                            </h2>
                            <p
                                style={{
                                    color: "#64748b",
                                    marginBottom: "32px",
                                    fontSize: "0.95rem",
                                }}
                            >
                                Điền thông tin để gửi kết quả xét nghiệm
                            </p>

                            <form onSubmit={handleSubmit}>
                                {/* Row 1: Tên Bệnh Nhân và Giới Tính */}
                                <div
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: "1fr 1fr",
                                        gap: "20px",
                                        marginBottom: "24px",
                                    }}
                                >
                                    <div>
                                        <label
                                            style={{
                                                display: "block",
                                                fontSize: "0.9rem",
                                                fontWeight: "500",
                                                color: "#374151",
                                                marginBottom: "8px",
                                            }}
                                        >
                                            Tên Bệnh Nhân <span style={{ color: "#ef4444" }}>*</span>
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Nhập tên bệnh nhân"
                                            value={formData.patientName}
                                            onChange={(e) => handleInputChange("fullName", e.target.value)}
                                            required
                                            style={{
                                                width: "100%",
                                                padding: "12px 16px",
                                                border: "1px solid #d1d5db",
                                                borderRadius: "8px",
                                                fontSize: "0.95rem",
                                                outline: "none",
                                                transition: "border-color 0.2s",
                                            }}
                                            onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
                                            onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
                                        />
                                    </div>
                                    <div>
                                        <label
                                            style={{
                                                display: "block",
                                                fontSize: "0.9rem",
                                                fontWeight: "500",
                                                color: "#374151",
                                                marginBottom: "8px",
                                            }}
                                        >
                                            Giới Tính <span style={{ color: "#ef4444" }}>*</span>
                                        </label>
                                        <select
                                            value={formData.gender}
                                            onChange={(e) => handleInputChange("gender", e.target.value)}
                                            required
                                            style={{
                                                width: "100%",
                                                padding: "12px 16px",
                                                border: "1px solid #d1d5db",
                                                borderRadius: "8px",
                                                fontSize: "0.95rem",
                                                outline: "none",
                                                backgroundColor: "white",
                                                cursor: "pointer",
                                            }}
                                        >
                                            <option value="">Chọn giới tính</option>
                                            <option value="Nam">Nam</option>
                                            <option value="Nữ">Nữ</option>
                                            <option value="Khác">Khác</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Loại Thử Nghiệm */}
                                <div style={{ marginBottom: "24px" }}>
                                    <label
                                        style={{
                                            display: "block",
                                            fontSize: "0.9rem",
                                            fontWeight: "500",
                                            color: "#374151",
                                            marginBottom: "8px",
                                        }}
                                    >
                                        Loại Thử Nghiệm <span style={{ color: "#ef4444" }}>*</span>
                                    </label>
                                    <select
                                        value={formData.testType}
                                        onChange={(e) => handleInputChange("sampleType", e.target.value)}
                                        required
                                        style={{
                                            width: "100%",
                                            padding: "12px 16px",
                                            border: "1px solid #d1d5db",
                                            borderRadius: "8px",
                                            fontSize: "0.95rem",
                                            outline: "none",
                                            backgroundColor: "white",
                                            cursor: "pointer",
                                        }}
                                    >
                                        <option value="">Chọn loại thử nghiệm</option>
                                        <option value="Xét nghiệm máu">Xét nghiệm máu</option>
                                        <option value="Xét nghiệm nước tiểu">Xét nghiệm nước tiểu</option>
                                        <option value="Xét nghiệm COVID-19">Xét nghiệm COVID-19</option>
                                        <option value="Xét nghiệm sinh hóa">Xét nghiệm sinh hóa</option>
                                        <option value="Xét nghiệm vi sinh">Xét nghiệm vi sinh</option>
                                        <option value="Xét nghiệm hormone">Xét nghiệm hormone</option>
                                        <option value="Xét nghiệm miễn dịch">Xét nghiệm miễn dịch</option>
                                        <option value="Xét nghiệm di truyền">Xét nghiệm di truyền</option>
                                    </select>
                                </div>

                                {/* Row 2: Ngày Xét Nghiệm và Loại Chứa */}
                                <div
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: "1fr 1fr",
                                        gap: "20px",
                                        marginBottom: "32px",
                                    }}
                                >
                                    <div>
                                        <label
                                            style={{
                                                display: "block",
                                                fontSize: "0.9rem",
                                                fontWeight: "500",
                                                color: "#374151",
                                                marginBottom: "8px",
                                            }}
                                        >
                                            Ngày Xét Nghiệm <span style={{ color: "#ef4444" }}>*</span>
                                        </label>
                                        <input
                                            type="date"
                                            value={formData.testDate}
                                            onChange={(e) => handleInputChange("collectionDate", e.target.value)}
                                            required
                                            style={{
                                                width: "100%",
                                                padding: "12px 16px",
                                                border: "1px solid #d1d5db",
                                                borderRadius: "8px",
                                                fontSize: "0.95rem",
                                                outline: "none",
                                                transition: "border-color 0.2s",
                                            }}
                                            onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
                                            onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
                                        />
                                    </div>
                                    <div>
                                        <label
                                            style={{
                                                display: "block",
                                                fontSize: "0.9rem",
                                                fontWeight: "500",
                                                color: "#374151",
                                                marginBottom: "8px",
                                            }}
                                        >
                                            Loại Chứa <span style={{ color: "#ef4444" }}>*</span>
                                        </label>
                                        <select
                                            value={formData.containerType}
                                            onChange={(e) => handleInputChange("containerType", e.target.value)}
                                            required
                                            style={{
                                                width: "100%",
                                                padding: "12px 16px",
                                                border: "1px solid #d1d5db",
                                                borderRadius: "8px",
                                                fontSize: "0.95rem",
                                                outline: "none",
                                                backgroundColor: "white",
                                                cursor: "pointer",
                                            }}
                                        >
                                            <option value="">Chọn loại chứa</option>
                                            <option value="Ống nghiệm EDTA">Ống nghiệm EDTA (nắp tím)</option>
                                            <option value="Ống nghiệm Heparin">Ống nghiệm Heparin (nắp xanh)</option>
                                            <option value="Ống nghiệm không chất chống đông">
                                                Ống nghiệm không chất chống đông (nắp đỏ)
                                            </option>
                                            <option value="Cốc nhựa vô trùng">Cốc nhựa vô trùng</option>
                                            <option value="Ống nghiệm VTM">Ống nghiệm VTM (COVID-19)</option>
                                            <option value="Lọ nhựa vô trùng">Lọ nhựa vô trùng</option>
                                            <option value="Ống nghiệm Fluoride">Ống nghiệm Fluoride (nắp xám)</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    style={{
                                        width: "100%",
                                        backgroundColor: isSubmitting ? "#9ca3af" : "#3b82f6",
                                        color: "white",
                                        border: "none",
                                        padding: "14px 24px",
                                        fontSize: "1rem",
                                        fontWeight: "500",
                                        borderRadius: "8px",
                                        cursor: isSubmitting ? "not-allowed" : "pointer",
                                        transition: "background-color 0.2s",
                                    }}
                                    onMouseOver={(e) => {
                                        if (!isSubmitting) e.target.style.backgroundColor = "#2563eb"
                                    }}
                                    onMouseOut={(e) => {
                                        if (!isSubmitting) e.target.style.backgroundColor = "#3b82f6"
                                    }}
                                >
                                    {isSubmitting ? "⏳ Đang gửi..." : "📤 Gửi Kết Quả"}
                                </button>
                            </form>
                        </div>
                    )}

                    {activeTab === "list" && (
                        <div>
                            <h2
                                style={{
                                    fontSize: "1.5rem",
                                    fontWeight: "600",
                                    color: "#1e293b",
                                    marginBottom: "8px",
                                }}
                            >
                                Danh Sách Mẫu Đã Gửi
                            </h2>
                            <p
                                style={{
                                    color: "#64748b",
                                    marginBottom: "32px",
                                    fontSize: "0.95rem",
                                }}
                            >
                                Theo dõi các mẫu xét nghiệm đã được gửi
                            </p>

                            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                {sentSamples.map((sample) => (
                                    <Link key={sample.id} to={`/lab-test/${sample._id}`}>
                                        <div
                                            style={{
                                                border: "1px solid #e2e8f0",
                                                borderRadius: "8px",
                                                padding: "20px",
                                                backgroundColor: "#fafafa",
                                                transition: "background-color 0.2s",
                                            }}
                                            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#f1f5f9")}
                                            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#fafafa")}
                                        >
                                            <div
                                                style={{
                                                    display: "flex",
                                                    justifyContent: "space-between",
                                                    alignItems: "flex-start",
                                                    marginBottom: "12px",
                                                }}
                                            >
                                                <h4 style={{ margin: 0, color: "#1e293b", fontSize: "1.1rem" }}>{sample._id}</h4>
                                                <span
                                                    style={{
                                                        padding: "4px 12px",
                                                        borderRadius: "12px",
                                                        fontSize: "0.8rem",
                                                        backgroundColor: sample.gender === "Nam" ? "#dbeafe" : "#fce7f3",
                                                        color: sample.gender === "Nam" ? "#1d4ed8" : "#be185d",
                                                    }}
                                                >
                        {sample.gender}
                      </span>
                                            </div>
                                            <div style={{ fontSize: "0.9rem", color: "#64748b" }}>
                                                <p style={{ margin: "4px 0" }}>
                                                    <strong>Bệnh nhân:</strong> {sample.fullName}
                                                </p>
                                                <p style={{ margin: "4px 0" }}>
                                                    <strong>Loại thử nghiệm:</strong> {sample.sampleType}
                                                </p>
                                                <p style={{ margin: "4px 0" }}>
                                                    <strong>Ngày xét nghiệm:</strong> {sample.collectionDate}
                                                </p>
                                                <p style={{ margin: "4px 0" }}>
                                                    <strong>Loại chứa:</strong> {sample.containerType}
                                                </p>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default MedicalTestForm
