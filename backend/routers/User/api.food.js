// backend/routes/nutrition.js
const express = require('express');
const foodrouter = express.Router();

const nutritionData = {
    Diabetes: {
        shouldEat: [
            { food: "Rau xanh", explanation: "Giàu chất xơ giúp kiểm soát lượng đường trong máu." },
            { food: "Ngũ cốc nguyên hạt", explanation: "Cung cấp carbohydrate hấp thụ chậm giúp ổn định đường huyết." },
            { food: "Cá giàu omega-3", explanation: "Giúp giảm viêm và bảo vệ tim mạch." },
            { food: "Quả hạch (hạt óc chó, hạnh nhân)", explanation: "Chứa chất béo tốt và chất chống oxy hóa." }
        ],
        shouldAvoid: [
            { food: "Đường tinh luyện", explanation: "Làm tăng đường huyết đột ngột." },
            { food: "Thức ăn nhanh nhiều dầu mỡ", explanation: "Gây tăng cân và làm nặng bệnh." },
            { food: "Đồ uống có ga", explanation: "Gây tăng lượng đường trong máu nhanh." }
        ]
    },

    Hypertension: {
        shouldEat: [
            { food: "Rau quả tươi", explanation: "Giàu kali và chất xơ giúp giảm huyết áp." },
            { food: "Thức ăn ít muối", explanation: "Giúp kiểm soát huyết áp ổn định." },
            { food: "Các loại hạt", explanation: "Chứa magiê và các khoáng chất hỗ trợ tim mạch." }
        ],
        shouldAvoid: [
            { food: "Muối", explanation: "Gây tăng huyết áp và làm tim phải làm việc nhiều hơn." },
            { food: "Rượu bia", explanation: "Làm tăng huyết áp và ảnh hưởng xấu đến tim." },
            { food: "Thức ăn chế biến sẵn", explanation: "Chứa nhiều muối và chất bảo quản." }
        ]
    },

    Asthma: {
        shouldEat: [
            { food: "Trái cây giàu vitamin C", explanation: "Tăng cường miễn dịch, giảm viêm." },
            { food: "Cá béo", explanation: "Chứa omega-3 giảm viêm đường hô hấp." },
            { food: "Rau xanh", explanation: "Giàu chất chống oxy hóa bảo vệ phổi." }
        ],
        shouldAvoid: [
            { food: "Thức ăn nhanh", explanation: "Kích thích phản ứng viêm, làm nặng hen suyễn." },
            { food: "Sữa và sản phẩm từ sữa (nếu dị ứng)", explanation: "Có thể gây tăng tiết đờm." },
            { food: "Đồ uống có cồn", explanation: "Gây kích thích và làm nặng triệu chứng." }
        ]
    },

    "Cholesterol Cao": {
        shouldEat: [
            { food: "Yến mạch", explanation: "Giúp giảm hấp thu cholesterol xấu." },
            { food: "Các loại hạt", explanation: "Chứa chất béo tốt giúp giảm cholesterol." },
            { food: "Cá béo (cá hồi, cá thu)", explanation: "Giàu omega-3 giảm cholesterol xấu." }
        ],
        shouldAvoid: [
            { food: "Thịt đỏ nhiều mỡ", explanation: "Tăng cholesterol xấu trong máu." },
            { food: "Thức ăn chiên rán", explanation: "Chứa nhiều chất béo không lành mạnh." },
            { food: "Đồ ngọt nhiều đường", explanation: "Gây tăng cân và ảnh hưởng xấu đến tim." }
        ]
    },

    "Béo phì": {
        shouldEat: [
            { food: "Rau xanh và hoa quả", explanation: "Giàu chất xơ giúp no lâu và giảm năng lượng nạp vào." },
            { food: "Protein nạc (gà, cá, đậu)", explanation: "Giúp tăng cảm giác no và duy trì cơ bắp." },
            { food: "Ngũ cốc nguyên hạt", explanation: "Hấp thụ chậm, giúp kiểm soát cân nặng." }
        ],
        shouldAvoid: [
            { food: "Thức ăn nhanh nhiều dầu mỡ", explanation: "Gây tăng cân nhanh và không lành mạnh." },
            { food: "Đồ uống có đường và có cồn", explanation: "Gây tích tụ năng lượng thừa." },
            { food: "Đồ ngọt nhiều đường", explanation: "Tăng đường huyết và tích trữ mỡ." }
        ]
    },

    "Viêm gan": {
        shouldEat: [
            { food: "Rau xanh, trái cây tươi", explanation: "Giúp giải độc gan và tăng cường hệ miễn dịch." },
            { food: "Thực phẩm giàu protein dễ tiêu (cá, đậu phụ)", explanation: "Giúp gan hồi phục tổn thương." },
            { food: "Nước lọc", explanation: "Hỗ trợ thải độc và thanh lọc gan." }
        ],
        shouldAvoid: [
            { food: "Rượu bia", explanation: "Gây tổn thương gan nghiêm trọng." },
            { food: "Thức ăn nhiều dầu mỡ, đồ chiên rán", explanation: "Gây áp lực lên gan." },
            { food: "Đồ ngọt nhiều đường", explanation: "Ảnh hưởng xấu tới chức năng gan." }
        ]
    },

    "Viêm khớp": {
        shouldEat: [
            { food: "Cá béo giàu omega-3", explanation: "Giúp giảm viêm và đau khớp." },
            { food: "Trái cây và rau củ giàu chất chống oxy hóa", explanation: "Giúp giảm tổn thương khớp." },
            { food: "Các loại hạt", explanation: "Cung cấp chất béo lành mạnh và khoáng chất." }
        ],
        shouldAvoid: [
            { food: "Thịt đỏ", explanation: "Có thể làm tăng viêm và đau." },
            { food: "Thức ăn chế biến sẵn và đường", explanation: "Kích thích phản ứng viêm." },
            { food: "Đồ uống có cồn", explanation: "Gây kích ứng và làm nặng triệu chứng." }
        ]
    },

    "Suy thận": {
        shouldEat: [
            { food: "Rau xanh ít kali", explanation: "Giúp bổ sung vitamin mà không làm tăng kali máu." },
            { food: "Protein chất lượng cao (trứng, cá)", explanation: "Giúp giảm tải cho thận." },
            { food: "Nước lọc vừa phải", explanation: "Tránh quá tải thận." }
        ],
        shouldAvoid: [
            { food: "Thực phẩm giàu kali (chuối, khoai tây)", explanation: "Gây tăng kali máu nguy hiểm." },
            { food: "Thực phẩm giàu phốt pho (đậu, sữa)", explanation: "Ảnh hưởng xấu đến chức năng thận." },
            { food: "Muối và đồ ăn chế biến sẵn", explanation: "Gây tăng huyết áp và làm tổn thương thận." }
        ]
    },

    "Loãng xương": {
        shouldEat: [
            { food: "Sữa và các sản phẩm từ sữa", explanation: "Giàu canxi giúp tăng cường xương." },
            { food: "Rau lá xanh đậm", explanation: "Cung cấp vitamin K và canxi." },
            { food: "Cá béo", explanation: "Giúp hấp thu canxi và vitamin D." }
        ],
        shouldAvoid: [
            { food: "Đồ uống có cồn và caffein", explanation: "Gây mất canxi qua nước tiểu." },
            { food: "Đồ ăn nhanh chứa nhiều muối", explanation: "Gây mất canxi qua nước tiểu." }
        ]
    },

    "Ung thư": {
        shouldEat: [
            { food: "Rau quả tươi đa dạng màu sắc", explanation: "Giàu chất chống oxy hóa bảo vệ tế bào." },
            { food: "Ngũ cốc nguyên hạt", explanation: "Chứa nhiều chất xơ hỗ trợ tiêu hóa." },
            { food: "Thực phẩm giàu omega-3", explanation: "Giúp giảm viêm và tăng miễn dịch." }
        ],
        shouldAvoid: [
            { food: "Thức ăn chế biến sẵn nhiều muối, đường", explanation: "Gây nguy cơ phát triển tế bào ung thư." },
            { food: "Rượu bia", explanation: "Tăng nguy cơ ung thư." },
            { food: "Thịt đỏ nhiều mỡ", explanation: "Gây nguy cơ ung thư đại tràng." }
        ]
    },

    "Rối loạn tiêu hóa": {
        shouldEat: [
            { food: "Sữa chua probiotic", explanation: "Giúp cân bằng hệ vi sinh đường ruột." },
            { food: "Rau củ luộc, hấp", explanation: "Dễ tiêu hóa, giảm kích ứng dạ dày." },
            { food: "Trà thảo mộc", explanation: "Giúp giảm viêm và cải thiện tiêu hóa." }
        ],
        shouldAvoid: [
            { food: "Thức ăn cay nóng", explanation: "Kích thích dạ dày gây khó chịu." },
            { food: "Đồ uống có cồn", explanation: "Làm tăng acid dạ dày." },
            { food: "Đồ ăn nhiều dầu mỡ", explanation: "Khó tiêu hóa và gây đầy bụng." }
        ]
    },

    "Viêm dạ dày": {
        shouldEat: [
            { food: "Cháo, súp nhạt", explanation: "Dễ tiêu hóa và làm dịu niêm mạc dạ dày." },
            { food: "Rau xanh mềm", explanation: "Cung cấp vitamin và khoáng chất." },
            { food: "Trà thảo dược", explanation: "Giúp giảm viêm và đau dạ dày." }
        ],
        shouldAvoid: [
            { food: "Thức ăn cay, chua", explanation: "Kích thích niêm mạc dạ dày." },
            { food: "Rượu bia", explanation: "Gây tổn thương thêm cho dạ dày." },
            { food: "Đồ uống có ga", explanation: "Làm tăng acid dạ dày." }
        ]
    },

    "Suy tim": {
        shouldEat: [
            { food: "Rau củ quả tươi", explanation: "Giúp giảm áp lực lên tim và tăng sức khỏe." },
            { food: "Thức ăn ít muối", explanation: "Giúp kiểm soát huyết áp và giảm phù nề." },
            { food: "Protein nạc (gà, cá)", explanation: "Giúp duy trì sức khỏe cơ tim." }
        ],
        shouldAvoid: [
            { food: "Thức ăn nhiều muối", explanation: "Gây giữ nước và tăng huyết áp." },
            { food: "Đồ ăn nhiều dầu mỡ", explanation: "Gây béo phì và tăng gánh nặng cho tim." },
            { food: "Rượu bia", explanation: "Làm tổn thương cơ tim." }
        ]
    },

    "Viêm tụy": {
        shouldEat: [
            { food: "Thức ăn dễ tiêu", explanation: "Giúp giảm áp lực cho tuyến tụy." },
            { food: "Rau xanh luộc", explanation: "Giàu vitamin và dễ tiêu hóa." },
            { food: "Nước lọc", explanation: "Giúp thải độc và hỗ trợ tuyến tụy." }
        ],
        shouldAvoid: [
            { food: "Rượu bia", explanation: "Gây tổn thương tuyến tụy nặng hơn." },
            { food: "Thức ăn nhiều dầu mỡ", explanation: "Kích thích tuyến tụy tiết dịch nhiều." },
            { food: "Đồ ngọt nhiều đường", explanation: "Gây rối loạn chuyển hóa." }
        ]
    },

    "Viêm gan B": {
        shouldEat: [
            { food: "Thực phẩm giàu protein nạc", explanation: "Hỗ trợ phục hồi tế bào gan." },
            { food: "Rau xanh và hoa quả tươi", explanation: "Tăng cường hệ miễn dịch và giải độc gan." },
            { food: "Nước lọc", explanation: "Hỗ trợ chức năng gan." }
        ],
        shouldAvoid: [
            { food: "Rượu bia", explanation: "Gây tổn thương gan nghiêm trọng." },
            { food: "Thức ăn nhiều dầu mỡ", explanation: "Tăng gánh nặng cho gan." },
            { food: "Đồ ngọt nhiều đường", explanation: "Ảnh hưởng xấu đến gan." }
        ]
    },

    "Viêm phổi": {
        shouldEat: [
            { food: "Trái cây giàu vitamin C", explanation: "Tăng sức đề kháng và giảm viêm phổi." },
            { food: "Rau xanh", explanation: "Giàu chất chống oxy hóa bảo vệ phổi." },
            { food: "Thực phẩm giàu protein", explanation: "Giúp phục hồi tổn thương mô phổi." }
        ],
        shouldAvoid: [
            { food: "Thuốc lá và khói thuốc", explanation: "Gây kích ứng và làm nặng viêm phổi." },
            { food: "Đồ uống có cồn", explanation: "Làm suy yếu hệ miễn dịch." },
            { food: "Thức ăn nhiều dầu mỡ", explanation: "Gây viêm và khó tiêu." }
        ]
    },

    "Loét dạ dày tá tràng": {
        shouldEat: [
            { food: "Thực phẩm mềm, nhạt", explanation: "Giúp làm dịu và không kích thích vết loét." },
            { food: "Rau củ quả tươi", explanation: "Cung cấp vitamin và khoáng chất giúp tái tạo niêm mạc." },
            { food: "Sữa và sản phẩm ít béo", explanation: "Giúp bảo vệ niêm mạc dạ dày." }
        ],
        shouldAvoid: [
            { food: "Thức ăn cay, chua", explanation: "Kích thích niêm mạc dạ dày làm vết loét nặng hơn." },
            { food: "Rượu bia", explanation: "Gây tổn thương thêm cho dạ dày." },
            { food: "Cà phê", explanation: "Kích thích acid dạ dày tăng lên." }
        ]
    },

    "Thiếu máu": {
        shouldEat: [
            { food: "Thịt đỏ", explanation: "Giàu sắt giúp tăng hồng cầu." },
            { food: "Rau xanh đậm", explanation: "Cung cấp sắt và vitamin C giúp hấp thu sắt." },
            { food: "Các loại đậu", explanation: "Nguồn sắt thực vật và protein." }
        ],
        shouldAvoid: [
            { food: "Trà, cà phê", explanation: "Làm giảm hấp thu sắt." },
            { food: "Đồ ăn nhanh", explanation: "Ít dinh dưỡng, không giúp bổ máu." }
        ]
    },

    "Tăng acid dạ dày": {
        shouldEat: [
            { food: "Thực phẩm ít acid (chuối, táo)", explanation: "Giúp trung hòa acid trong dạ dày." },
            { food: "Sữa tươi không đường", explanation: "Làm dịu niêm mạc dạ dày." },
            { food: "Thực phẩm giàu chất xơ", explanation: "Giúp tiêu hóa tốt hơn." }
        ],
        shouldAvoid: [
            { food: "Đồ ăn cay, nóng", explanation: "Kích thích tăng tiết acid." },
            { food: "Cà phê và rượu bia", explanation: "Gây kích thích niêm mạc dạ dày." },
            { food: "Đồ uống có ga", explanation: "Tăng áp lực trong dạ dày." }
        ]
    },

    "Bệnh thận mạn": {
        shouldEat: [
            { food: "Thực phẩm ít protein", explanation: "Giúp giảm gánh nặng lọc thận." },
            { food: "Rau củ ít kali", explanation: "Tránh tăng kali máu nguy hiểm." },
            { food: "Nước lọc vừa phải", explanation: "Không làm tăng áp lực lên thận." }
        ],
        shouldAvoid: [
            { food: "Thực phẩm giàu kali (chuối, khoai tây)", explanation: "Có thể gây ngộ độc kali." },
            { food: "Thực phẩm giàu phốt pho", explanation: "Gây mất cân bằng khoáng chất trong máu." },
            { food: "Muối và thức ăn chế biến sẵn", explanation: "Gây tăng huyết áp và tổn thương thận." }
        ]
    }    // ... bạn tự thêm 17 bệnh nữa theo cấu trúc này
};

// Route lấy danh sách bệnh
foodrouter.get('/diseases', (req, res) => {
    res.json(Object.keys(nutritionData));
});

// Route lấy thông tin dinh dưỡng theo bệnh
foodrouter.get('/nutrition-advice/:disease', (req, res) => {
    const disease = req.params.disease;
    if (!nutritionData[disease]) {
        return res.status(404).json({ error: "Không tìm thấy thông tin dinh dưỡng cho bệnh này" });
    }
    res.json(nutritionData[disease]);
});

module.exports = foodrouter;
