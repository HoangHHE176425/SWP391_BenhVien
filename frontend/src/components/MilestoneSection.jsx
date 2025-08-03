import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const MilestoneSection = () => {
  const [expandedIndex, setExpandedIndex] = useState(null);

  const toggleItem = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const items = [
    {
      title: "5 Giá trị cốt lõi",
      content: [
        "1. Chuyên nghiệp và chất lượng: Đội ngũ bác sĩ tại Vietcare được đào tạo bài bản, đảm bảo mọi dịch vụ y tế đạt tiêu chuẩn quốc tế, mang lại sự an tâm tuyệt đối cho bệnh nhân.",
        "2. Ưu tiên sức khỏe bệnh nhân: Mọi quyết định và quy trình điều trị đều đặt lợi ích và sức khỏe của bệnh nhân lên hàng đầu, đảm bảo an toàn và hiệu quả.",
        "3. Tận tâm và minh bạch: Chúng tôi phục vụ với sự chân thành, minh bạch, luôn coi bệnh nhân như người thân trong gia đình.",
        "4. Đổi mới công nghệ: Không ngừng cập nhật trang thiết bị hiện đại và áp dụng các tiến bộ y khoa để nâng cao chất lượng dịch vụ.",
        "5. Trách nhiệm cộng đồng: Vietcare cam kết đóng góp cho xã hội thông qua các chương trình khám chữa bệnh miễn phí và hỗ trợ cộng đồng khó khăn.",
      ],
      icon: "+",
    },
    {
      title: "Đội ngũ nhân sự",
      content: "Tại Vietcare, đội ngũ bác sĩ và nhân viên y tế được đào tạo tại các trường đại học y khoa hàng đầu như Đại học Y Dược TP. Hồ Chí Minh, Đại học Y Hà Nội, và các tổ chức quốc tế. Với kinh nghiệm đa dạng trong các lĩnh vực nội khoa, nhi khoa, phụ sản, và ngoại khoa, đội ngũ của chúng tôi luôn tận tâm, đề cao y đức, và cam kết mang lại trải nghiệm y tế tốt nhất cho bệnh nhân tại TP. Hồ Chí Minh và khu vực lân cận.",
      icon: "+",
    },
    {
      title: "Nỗ lực vì cộng đồng",
      content: "Thường xuyên tổ chức các chương trình khám sức khỏe tổng quát và tư vấn y tế miễn phí cho cộng đồng, đặc biệt là các khu vực khó khăn.",
      icon: "+",
    },
  ];

  return (
    <section className="container-fluid py-5 bg-light">
      <div className="row align-items-center justify-content-between">
        {/* Left: Content */}
        <div className="col-md-6 mb-4 mb-md-0 px-4">
          <h2 className="text-primary font-weight-bold text-uppercase mb-2" style={{ fontSize: '1.25rem', letterSpacing: '0.1em' }}>
            Vietcare
          </h2>
          <h1 className="text-primary font-weight-bold mb-4" style={{ fontSize: '2.5rem', lineHeight: '1.2' }}>
            7 Năm - Một chặng đường
          </h1>
          <div className="accordion">
            {items.map((item, index) => (
              <div key={index} className="card mb-3 shadow-sm">
                <button
                  className="card-header btn d-flex justify-content-between align-items-center text-left bg-white border-0"
                  onClick={() => toggleItem(index)}
                  style={{ transition: 'background-color 0.3s ease' }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#e9ecef')}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#fff')}
                >
                  <span className="text-primary font-weight-bold" style={{ fontSize: '1.1rem' }}>{item.title}</span>
                  <span
                    className="text-white rounded-circle d-flex align-items-center justify-content-center"
                    style={{
                      width: '2.5rem',
                      height: '2.5rem',
                      background: 'linear-gradient(135deg, #007bff, #0056b3)',
                      fontSize: '1.5rem',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                    }}
                  >
                    {expandedIndex === index ? "-" : "+"}
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {expandedIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="card-body">
                        {Array.isArray(item.content) ? (
                          item.content.map((value, idx) => (
                            <p key={idx} className="text-muted mb-2" style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
                              {value}
                            </p>
                          ))
                        ) : (
                          <p className="text-muted" style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>{item.content}</p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Image */}
        <div className="col-md-6 px-4">
          <img
            src="https://kientrucbenhvien.com/wp-content/uploads/2019/12/thiet-ke-noi-that-phong-kham-da-khoa-son-duong-04.jpg"
            alt="Bác sĩ đang làm việc"
            className="img-fluid rounded shadow-lg"
            style={{ transition: 'transform 0.3s ease' }}
            onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
            onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          />
        </div>
      </div>
    </section>
  );
};

export default MilestoneSection;