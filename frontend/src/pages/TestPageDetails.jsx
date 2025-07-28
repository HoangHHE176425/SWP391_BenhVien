"use client"

import { useState, useEffect } from "react"
import {useNavigate, useParams} from "react-router-dom";

const TestDetailPage = () => {
    const { testId } = useParams();
    const [testDetail, setTestDetail] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const goToLabTest = () => {
        navigate('/lab-test'); // Điều hướng đến route cố định
    };
    useEffect(() => {
        const fetchTestDetail = async () => {
            try {
                setLoading(true)
                const response = await fetch(`http://localhost:9999/api/lab/all/${testId}`)

                if (!response.ok) {
                    throw new Error("Không thể tải thông tin xét nghiệm")
                }

                console.log("Detail", response)

                const data = await response.json()
                console.log("Detail Json", data)
                setTestDetail(data.data || data)
                setLoading(false)
            } catch (err) {
                setError(err.message || "Có lỗi xảy ra khi tải dữ liệu")
                setLoading(false)
            }
        }

        if (testId) {
            fetchTestDetail()
        }
    }, [testId])

    const updateTestResult = async (newResult) => {
        try {
            const response = await fetch(`http://localhost:9999/api/lab/${testId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    result: newResult,
                    status: "completed",
                }),
            })

            if (!response.ok) {
                throw new Error("Không thể cập nhật kết quả")
            }

            const updatedData = await response.json()
            setTestDetail(updatedData.data || updatedData)
            alert("Cập nhật kết quả thành công!")
        } catch (err) {
            alert("Lỗi: " + err.message)
        }
    }

    const formatDate = (dateString) => {
        const date = new Date(dateString)
        return date.toLocaleDateString("vi-VN", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    const getStatusInfo = (status) => {
        switch (status) {
            case "pending":
                return { bg: "#fef3c7", color: "#d97706", text: "Đang chờ", icon: "⏳" }
            case "processing":
                return { bg: "#dbeafe", color: "#2563eb", text: "Đang xử lý", icon: "🔄" }
            case "completed":
                return { bg: "#dcfce7", color: "#16a34a", text: "Hoàn thành", icon: "✅" }
            case "cancelled":
                return { bg: "#fee2e2", color: "#dc2626", text: "Đã hủy", icon: "❌" }
            default:
                return { bg: "#f3f4f6", color: "#6b7280", text: "Không xác định", icon: "❓" }
        }
    }

    const handlePrint = () => {
        window.print()
    }

    const handleUpdateResult = () => {
        const newResult = prompt("Nhập kết quả xét nghiệm:")
        if (newResult && newResult.trim()) {
            updateTestResult(newResult.trim())
        }
    }

    if (loading) {
        return (
            <div style={styles.container}>
                <div style={styles.loadingCard}>
                    <div style={styles.spinner}></div>
                    <p style={styles.loadingText}>Đang tải thông tin xét nghiệm...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div style={styles.container}>
                <div style={styles.errorCard}>
                    <div style={styles.errorIcon}>❌</div>
                    <h3 style={styles.errorTitle}>Lỗi</h3>
                    <p style={styles.errorText}>{error}</p>
                    <button onClick={goToLabTest} style={styles.backButton}>
                        Quay lại
                    </button>
                </div>
            </div>
        )
    }

    if (!testDetail) {
        return (
            <div style={styles.container}>
                <div style={styles.errorCard}>
                    <div style={styles.errorIcon}>❓</div>
                    <h3 style={styles.errorTitle}>Không tìm thấy</h3>
                    <p style={styles.errorText}>Không tìm thấy thông tin xét nghiệm</p>
                    <button onClick={goToLabTest} style={styles.backButton}>
                        Quay lại
                    </button>
                </div>
            </div>
        )
    }

    const statusInfo = getStatusInfo(testDetail.status)

    return (
        <div style={styles.container}>
            <div style={styles.content}>
                {/* Header */}
                <div style={styles.headerCard}>
                    <div style={styles.headerContent}>
                        <div>
                            <h1 style={styles.title}>Chi Tiết Xét Nghiệm</h1>
                            <p style={styles.subtitle}>
                                Mã: <strong>{testDetail._id}</strong>
                            </p>
                        </div>
                        <span
                            style={{
                                ...styles.statusBadge,
                                backgroundColor: statusInfo.bg,
                                color: statusInfo.color,
                            }}
                        >
              {statusInfo.icon} {statusInfo.text}
            </span>
                    </div>
                </div>

                {/* Patient & Test Information */}
                <div style={styles.infoGrid}>
                    {/* Patient Info */}
                    <div style={styles.infoCard}>
                        <h2 style={styles.cardTitle}>👤 Thông Tin Bệnh Nhân</h2>
                        <div style={styles.infoList}>
                            <div style={styles.infoItem}>
                                <div style={styles.infoLabel}>Họ và Tên</div>
                                <div style={styles.infoValue}>{testDetail.fullName}</div>
                            </div>
                            <div style={styles.infoItem}>
                                <div style={styles.infoLabel}>Giới Tính</div>
                                <span
                                    style={{
                                        ...styles.genderBadge,
                                        backgroundColor: testDetail.gender === "Nam" ? "#dbeafe" : "#fce7f3",
                                        color: testDetail.gender === "Nam" ? "#1d4ed8" : "#be185d",
                                    }}
                                >
                  {testDetail.gender}
                </span>
                            </div>
                        </div>
                    </div>

                    {/* Test Info */}
                    <div style={styles.infoCard}>
                        <h2 style={styles.cardTitle}>🧪 Thông Tin Mẫu</h2>
                        <div style={styles.infoList}>
                            <div style={styles.infoItem}>
                                <div style={styles.infoLabel}>Loại Xét Nghiệm</div>
                                <div style={styles.infoValue}>{testDetail.sampleType}</div>
                            </div>
                            <div style={styles.infoItem}>
                                <div style={styles.infoLabel}>Loại Chứa</div>
                                <div style={styles.infoValue}>{testDetail.containerType}</div>
                            </div>
                            <div style={styles.infoItem}>
                                <div style={styles.infoLabel}>Người Lấy Mẫu</div>
                                <div style={styles.infoValue}>{testDetail.collectedBy}</div>
                            </div>
                            <div style={styles.infoItem}>
                                <div style={styles.infoLabel}>Ngày Lấy Mẫu</div>
                                <div style={styles.infoValue}>{formatDate(testDetail.collectionDate)}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Test Results */}
                <div style={styles.resultCard}>
                    <h2 style={styles.cardTitle}>📊 Kết Quả Xét Nghiệm</h2>
                    {testDetail.result ? (
                        <div style={styles.resultContent}>
                            <div style={styles.resultText}>{testDetail.result}</div>
                        </div>
                    ) : (
                        <div style={styles.noResultContent}>
                            <div style={styles.noResultIcon}>⏳</div>
                            <div style={styles.noResultTitle}>Kết quả chưa có sẵn</div>
                            <div style={styles.noResultSubtitle}>Vui lòng kiểm tra lại sau</div>
                        </div>
                    )}
                </div>

                {/* Timeline */}
                <div style={styles.timelineCard}>
                    <h2 style={styles.cardTitle}>📅 Lịch Sử</h2>
                    <div style={styles.timelineList}>
                        <div style={styles.timelineItem}>
                            <div style={styles.timelineDot}></div>
                            <div style={styles.timelineContent}>
                                <div style={styles.timelineTitle}>Tạo mẫu xét nghiệm</div>
                                <div style={styles.timelineDate}>{formatDate(testDetail.createdAt)}</div>
                            </div>
                        </div>
                        {testDetail.updatedAt !== testDetail.createdAt && (
                            <div style={styles.timelineItem}>
                                <div style={{ ...styles.timelineDot, backgroundColor: "#3b82f6" }}></div>
                                <div style={styles.timelineContent}>
                                    <div style={styles.timelineTitle}>Cập nhật lần cuối</div>
                                    <div style={styles.timelineDate}>{formatDate(testDetail.updatedAt)}</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Action Buttons */}
                <div style={styles.actionButtons}>
                    <button onClick={goToLabTest} style={styles.backActionButton}>
                        ← Quay lại
                    </button>
                    {testDetail.status === "pending" && (
                        <button onClick={handleUpdateResult} style={styles.updateButton}>
                            📝 Cập nhật KQ
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}

const styles = {
    container: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        backgroundColor: "#f1f5f9",
        minHeight: "100vh",
        padding: "20px",
    },
    content: {
        maxWidth: "800px",
        margin: "0 auto",
    },
    loadingCard: {
        backgroundColor: "white",
        padding: "40px",
        borderRadius: "12px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        textAlign: "center",
        maxWidth: "400px",
        margin: "0 auto",
        marginTop: "20vh",
    },
    spinner: {
        width: "40px",
        height: "40px",
        border: "4px solid #e5e7eb",
        borderTop: "4px solid #3b82f6",
        borderRadius: "50%",
        animation: "spin 1s linear infinite",
        margin: "0 auto 16px",
    },
    loadingText: {
        color: "#64748b",
        margin: 0,
    },
    errorCard: {
        backgroundColor: "white",
        padding: "40px",
        borderRadius: "12px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        textAlign: "center",
        maxWidth: "400px",
        margin: "0 auto",
        marginTop: "20vh",
    },
    errorIcon: {
        fontSize: "3rem",
        marginBottom: "16px",
    },
    errorTitle: {
        color: "#dc2626",
        margin: "0 0 8px 0",
    },
    errorText: {
        color: "#64748b",
        margin: "0 0 20px 0",
    },
    backButton: {
        padding: "10px 20px",
        backgroundColor: "#6b7280",
        color: "white",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
    },
    headerCard: {
        backgroundColor: "white",
        borderRadius: "12px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        padding: "24px",
        marginBottom: "20px",
    },
    headerContent: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        flexWrap: "wrap",
        gap: "16px",
    },
    title: {
        fontSize: "1.8rem",
        fontWeight: "600",
        color: "#1e293b",
        margin: "0 0 8px 0",
    },
    subtitle: {
        color: "#64748b",
        margin: 0,
        fontSize: "1rem",
        wordBreak: "break-all",
    },
    statusBadge: {
        padding: "8px 16px",
        borderRadius: "20px",
        fontSize: "0.9rem",
        fontWeight: "500",
        display: "flex",
        alignItems: "center",
        gap: "6px",
    },
    infoGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: "20px",
        marginBottom: "20px",
    },
    infoCard: {
        backgroundColor: "white",
        borderRadius: "12px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        padding: "24px",
    },
    cardTitle: {
        fontSize: "1.2rem",
        fontWeight: "600",
        color: "#1e293b",
        margin: "0 0 16px 0",
        display: "flex",
        alignItems: "center",
        gap: "8px",
    },
    infoList: {
        display: "flex",
        flexDirection: "column",
        gap: "12px",
    },
    infoItem: {
        display: "flex",
        flexDirection: "column",
        gap: "4px",
    },
    infoLabel: {
        fontSize: "0.8rem",
        color: "#64748b",
    },
    infoValue: {
        fontSize: "1rem",
        fontWeight: "500",
        color: "#1e293b",
    },
    genderBadge: {
        padding: "4px 12px",
        borderRadius: "12px",
        fontSize: "0.9rem",
        fontWeight: "500",
        alignSelf: "flex-start",
    },
    resultCard: {
        backgroundColor: "white",
        borderRadius: "12px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        padding: "24px",
        marginBottom: "20px",
    },
    resultContent: {
        padding: "20px",
        backgroundColor: "#f0fdf4",
        borderRadius: "8px",
        border: "1px solid #bbf7d0",
    },
    resultText: {
        fontSize: "1rem",
        color: "#166534",
        lineHeight: "1.6",
        whiteSpace: "pre-wrap",
    },
    noResultContent: {
        padding: "20px",
        backgroundColor: "#fffbeb",
        borderRadius: "8px",
        border: "1px solid #fed7aa",
        textAlign: "center",
    },
    noResultIcon: {
        fontSize: "2rem",
        marginBottom: "8px",
    },
    noResultTitle: {
        fontSize: "1rem",
        color: "#d97706",
        fontWeight: "500",
    },
    noResultSubtitle: {
        fontSize: "0.9rem",
        color: "#92400e",
        marginTop: "4px",
    },
    timelineCard: {
        backgroundColor: "white",
        borderRadius: "12px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        padding: "24px",
        marginBottom: "20px",
    },
    timelineList: {
        display: "flex",
        flexDirection: "column",
        gap: "16px",
    },
    timelineItem: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "12px",
        backgroundColor: "#f8fafc",
        borderRadius: "8px",
    },
    timelineDot: {
        width: "8px",
        height: "8px",
        borderRadius: "50%",
        backgroundColor: "#10b981",
        flexShrink: 0,
    },
    timelineContent: {
        flex: 1,
    },
    timelineTitle: {
        fontSize: "0.9rem",
        fontWeight: "500",
        color: "#1e293b",
    },
    timelineDate: {
        fontSize: "0.8rem",
        color: "#64748b",
    },
    actionButtons: {
        display: "flex",
        gap: "12px",
        justifyContent: "center",
        flexWrap: "wrap",
    },
    backActionButton: {
        padding: "12px 24px",
        backgroundColor: "#6b7280",
        color: "white",
        border: "none",
        borderRadius: "8px",
        fontSize: "1rem",
        fontWeight: "500",
        cursor: "pointer",
        transition: "background-color 0.2s",
    },
    printButton: {
        padding: "12px 24px",
        backgroundColor: "#3b82f6",
        color: "white",
        border: "none",
        borderRadius: "8px",
        fontSize: "1rem",
        fontWeight: "500",
        cursor: "pointer",
        transition: "background-color 0.2s",
    },
    updateButton: {
        padding: "12px 24px",
        backgroundColor: "#10b981",
        color: "white",
        border: "none",
        borderRadius: "8px",
        fontSize: "1rem",
        fontWeight: "500",
        cursor: "pointer",
        transition: "background-color 0.2s",
    },
}

export default TestDetailPage
