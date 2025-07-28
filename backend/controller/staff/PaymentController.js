const PayOS = require('@payos/node');
const mongoose = require('mongoose');
const Invoice = require('../../models/Invoice');
const Payment = require('../../models/Payment');
const crypto = require('crypto');

const payos = new PayOS(
    process.env.PAYOS_CLIENT_ID,
    process.env.PAYOS_API_KEY,
    process.env.PAYOS_CHECKSUM_KEY
);

// Tạo link thanh toán PayOS
exports.createPaymentLink = async (req, res) => {
    try {
        const { invoiceId, method } = req.body;

        if (!mongoose.Types.ObjectId.isValid(invoiceId)) {
            return res.status(400).json({
                success: false,
                message: 'ID hóa đơn không hợp lệ'
            });
        }


        if (!['Credit Card', 'Mobile App'].includes(method)) {
            return res.status(400).json({
                success: false,
                message: 'Phương thức thanh toán không được hỗ trợ bởi PayOS'
            });
        }

        const invoice = await Invoice.findById(invoiceId)
            .populate('userId', 'name email')
            .populate('profileId', 'name').populate("services");

        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy hóa đơn'
            });
        }

        if (invoice.status !== 'Pending') {
            return res.status(400).json({
                success: false,
                message: 'Hóa đơn không ở trạng thái chờ thanh toán'
            });
        }

        // Kiểm tra xem đã có Payment đang chờ hay chưa
        let payment = await Payment.findOne({ invoiceId, status: 'Pending' });

        if (!payment) {
            payment = await Payment.create({
                invoiceId,
                userId: invoice.userId,
                profileId: invoice.profileId,
                amount: invoice.totalAmount,
                method,
                status: 'Pending',
                paymentDate: new Date()
            });
        }

        // Tạo orderCode tránh trùng: INV-1235_ab123

        // An toàn, không trùng, và không vượt quá MAX_SAFE_INTEGER
        const orderCode = Math.floor(Date.now() / 1000);


        const paymentData = {
            orderCode: orderCode,
            amount: invoice.totalAmount,
            description: `Pay ${invoice.invoiceNumber} for ${invoice.profileId?.name ?? "patient"}`,
            items: (invoice.services || []).map(service => ({
                name: service.name || 'Dịch vụ y tế',
                quantity: 1,
                price: invoice.totalAmount // có thể là service.price nếu cần chi tiết hơn
            })),
            returnUrl: `http://localhost:5173/payment/success?paymentId=${payment._id}`,
            cancelUrl: `http://localhost:5173/payment/fail?reason=cancelled`
        };

        const paymentLink = await payos.createPaymentLink(paymentData);

        res.status(200).json({
            success: true,
            data: {
                checkoutUrl: paymentLink.checkoutUrl,
                orderCode: paymentLink.orderCode,
                paymentId: payment._id
            }
        });
    } catch (error) {
        console.error('Error creating payment link:', error?.response?.data || error.message);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error?.response?.data?.message || error.message
        });
    }
};



// Xử lý webhook từ PayOS
exports.handleWebhook = async (req, res) => {
    try {
        const webhookData = req.body;

        // Xác minh chữ ký
        const receivedSignature = req.headers['x-payos-signature'];
        const checksumKey = process.env.PAYOS_CHECKSUM_KEY;
        const rawBody = JSON.stringify(webhookData);
        const expectedSignature = crypto
            .createHmac('sha256', checksumKey)
            .update(rawBody)
            .digest('hex');

        if (receivedSignature !== expectedSignature) {
            return res.status(400).json({
                success: false,
                message: 'Chữ ký không hợp lệ'
            });
        }

        const { code, data } = webhookData;
        const { orderCode, paymentLinkId, transactionDateTime, code: paymentCode } = data;

        // Tìm hóa đơn
        const invoice = await Invoice.findOne({ invoiceNumber: `INV-${orderCode}` });
        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy hóa đơn'
            });
        }

        // Tìm bản ghi thanh toán
        const payment = await Payment.findOne({ invoiceId: invoice._id, status: 'Pending' });
        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy giao dịch thanh toán đang chờ'
            });
        }

        // Cập nhật theo kết quả thanh toán
        if (code === '00' && paymentCode === '00') {
            console.log("call");
            payment.status = 'Completed';
            payment.transactionId = paymentLinkId;
            payment.paymentDate = new Date(transactionDateTime);
            invoice.status = 'Paid';
        } else {
            console.log("nôb");
            payment.status = 'Failed';
            payment.transactionId = paymentLinkId || null;
            invoice.status = 'Canceled';
        }

        await payment.save();
        await invoice.save();

        return res.status(200).json({
            success: true,
            message: 'Webhook xử lý thành công'
        });
    } catch (error) {
        console.error('Error handling webhook:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

exports.paymentSuccess = async (req, res) => {
    try {
        const { paymentId } = req.params;
        const payment = await Payment.findById(paymentId).populate('invoiceId');
        if (!payment) {
            return res.status(404).json({ success: false, message: 'Giao dịch không tồn tại' });
        }
        payment.status = 'Completed';
        await payment.save();
        const invoice = payment.invoiceId;
        if (invoice) {
            invoice.status = 'Paid';
            await invoice.save();
        } else {
            return res.status(400).json({ success: false, message: 'Hóa đơn không tồn tại' });
        }
        res.status(200).json({ success: true, message: 'Thanh toán thành công', data: payment });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
    }
};


// Trang hủy
exports.paymentCancel = async (req, res) => {
    try {
        const { paymentId } = req.params;
        const payment = await Payment.findById(paymentId).populate('invoiceId');
        if (!payment) {
            return res.status(404).json({ success: false, message: 'Giao dịch không tồn tại' });
        }
        payment.status = 'Failed';
        await payment.save();
        res.status(200).json({ success: true, message: 'Thanh toán đã hủy', data: payment });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
    }
};
// thanh toan tien mat
exports.paidServices = async (req, res) => {
    const invoiceId = req.params.invoiceId;
    const { method } = req.body;

    try {
        const invoice = await Invoice.findByIdAndUpdate(
            invoiceId,
            { status: "Paid" },
            { new: true }
        );
        // Kiểm tra xem đã có Payment đang chờ hay chưa
        let payment = await Payment.findOne({ invoiceId, status: 'Pending' });
        //chua co thi tao payment moi
        if (!payment) {
            payment = await Payment.create({
                invoiceId,
                userId: invoice.userId,
                profileId: invoice.profileId,
                amount: invoice.totalAmount,
                method: "Cash",
                status: 'Completed',
                paymentDate: new Date()
            });
        } else {
            payment.status = "Completed";
            payment.method = "Cash";
            await payment.save();
        }

        if (!invoice) {
            return res.status(404).json({ message: "Invoice not found" });
        }
        res.status(200).json({ invoice });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
exports.deleteInvoice = async (req, res) => {
    const invoiceId = req.params.invoiceId;

    try {
        const deletedInvoice = await Invoice.findByIdAndDelete(invoiceId);

        if (!deletedInvoice) {
            return res.status(404).json({ message: "Invoice not found" });
        }

        res.status(200).json({ message: "Invoice deleted successfully", invoice: deletedInvoice });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};



// exports.getAllPayment = async (req, res) => {
//     try {
//         const page = parseInt(req.query.page) || 1; // Trang hiện tại
//         const limit = parseInt(req.query.limit) || 10; // Số mục/trang
//         const skip = (page - 1) * limit;

//         const [payments, total] = await Promise.all([
//             Payment.find()
//                 .populate('invoiceId', 'invoiceNumber totalAmount status')
//                 .populate('userId', 'name email')
//                 .populate('profileId', 'name')
//                 .sort({ createdAt: -1 })
//                 .skip(skip)
//                 .limit(limit),
//             Payment.countDocuments()
//         ]);

//         res.status(200).json({
//             success: true,
//             data: payments,
//             pagination: {
//                 total,
//                 page,
//                 limit,
//                 totalPages: Math.ceil(total / limit)
//             }
//         });
//     } catch (error) {
//         console.error("Get All Payments Error:", error);
//         res.status(500).json({ message: "Server error", error: error.message });
//     }
// };
const moment = require("moment");
const Service = require('../../models/Service');
exports.getPaymentSummary = async (req, res) => {
    try {
        const todayStart = moment().startOf("day").toDate();
        const monthStart = moment().startOf("month").toDate();

        const [
            todayCount,
            monthTotalAgg,
            pendingCount,
            totalPayments,
            completedPayments
        ] = await Promise.all([
            Payment.countDocuments({ paymentDate: { $gte: todayStart } }),
            Payment.aggregate([
                {
                    $match: {
                        paymentDate: { $gte: monthStart },
                        status: "Completed",
                    },
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: "$amount" },
                    },
                },
            ]),
            Payment.countDocuments({ status: "Pending" }),
            Payment.countDocuments(),
            Payment.countDocuments({ status: "Completed" }),
        ]);

        const monthTotal = monthTotalAgg.length > 0 ? monthTotalAgg[0].total : 0;
        const successRate =
            totalPayments > 0
                ? parseFloat(((completedPayments / totalPayments) * 100).toFixed(1))
                : 0;

        return res.status(200).json({
            todayCount,
            monthTotal,
            pendingCount,
            successRate,
        });
    } catch (error) {
        console.error("Lỗi khi lấy thống kê:", error);
        return res.status(500).json({ message: "Lỗi server khi lấy thống kê" });
    }
};
exports.getPayments = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const { search = "", status, method, sortField = "amount", sortOrder = "desc" } = req.query;

        // Build match condition for Payment fields
        const matchConditions = {};
        if (status) matchConditions.status = status;
        if (method) matchConditions.method = method;

        // Build the aggregation pipeline
        const pipeline = [
            {
                $lookup: {
                    from: "invoices",
                    localField: "invoiceId",
                    foreignField: "_id",
                    as: "invoice",
                },
            },
            { $unwind: "$invoice" },
            // Filter stage
            {
                $match: {
                    ...matchConditions,
                    ...(search
                        ? { "invoice.invoiceNumber": { $regex: search, $options: "i" } }
                        : {}),
                },
            },
            // Sort stage
            {
                $sort: {
                    [sortField]: sortOrder === "asc" ? 1 : -1,
                },
            },
            { $skip: skip },
            { $limit: limit },
            // Populate user info
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "user",
                },
            },
            { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },

            // Populate profile info
            {
                $lookup: {
                    from: "profiles",
                    localField: "profileId",
                    foreignField: "_id",
                    as: "profile",
                },
            },
            { $unwind: { path: "$profile", preserveNullAndEmptyArrays: true } },
            // Project fields you want to return
            {
                $project: {
                    _id: 1,
                    amount: 1,
                    method: 1,
                    status: 1,
                    paymentDate: 1,
                    invoiceId: 1,
                    invoice: {
                        invoiceNumber: 1,
                        totalAmount: 1,
                    },
                    user: {
                        name: 1,
                        email: 1,
                    },
                    profile: {
                        name: 1,
                    },
                },
            },
        ];

        // Get total count for pagination
        const countPipeline = [...pipeline];
        countPipeline.push({
            $count: "total",
        });
        const countResult = await Payment.aggregate(countPipeline);
        const total = countResult[0]?.total || 0;

        // Get paginated data
        const data = await Payment.aggregate(pipeline);

        return res.json({
            data,
            pagination: {
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                page,
                limit,
            },
        });
    } catch (error) {
        console.error("Lỗi khi lấy danh sách payments:", error);
        return res.status(500).json({ message: "Lỗi server" });
    }
};

exports.createPaymentLinkEmbedded = async (req, res) => {
    try {
        const { invoiceId } = req.body;

        const invoice = await Invoice.findById(invoiceId).populate("services");
        const total = invoice.totalAmount;

        // Đảm bảo orderCode là số duy nhất
        const orderCode = Number(invoice.invoiceNumber) || Date.now();

        const result = await payos.createPaymentLink({
            orderCode,
            amount: total,
            description: `Thanh toán kiwicare`,
            cancelUrl: "http://localhost:5173/invoice", // bắt buộc
            returnUrl: "http://localhost:5173/invoice", // quay lại front-end
        });

        res.json({ checkoutUrl: result.checkoutUrl });
    } catch (error) {
        console.error("Lỗi tạo link:", error.response?.data || error.message);
        res.status(500).json({ message: "Lỗi tạo link thanh toán", error: error.message });
    }
};
exports.createPaymentLinkEmbeddedForBookAppointment = async (req, res) => {
    try {
        console.log("Request body:", req.body);
        const { profileId, userId, doctorId, department, appointmentDate } = req.body;

        if (!userId || !profileId || !doctorId || !department || !appointmentDate) {
            throw new Error("Thiếu thông tin bắt buộc");
        }

        const servicesID = "6878a90d732616504cf8bddc";
        const service = await Service.findById(servicesID);
        if (!service) throw new Error("Dịch vụ không tồn tại");

        const total = service.price;
        const orderCode = Date.now(); // Đảm bảo duy nhất, có thể dùng ID từ database

        const dateObj = new Date(appointmentDate);
        if (isNaN(dateObj.getTime())) throw new Error("Ngày giờ hẹn không hợp lệ");
        const date = dateObj.toISOString().split("T")[0];
        const time = dateObj.toTimeString().split(" ")[0].slice(0, 5);
        const returnUrl = `http://localhost:5173/appointment/success?orderCode=${orderCode}&serviceId=${servicesID}&amount=${total}&userId=${userId}&profileId=${profileId}&doctorId=${doctorId}&department=${department}&date=${date}&time=${time}`;

        const result = await payos.createPaymentLink({
            orderCode,
            amount: total,
            description: `Thanh toán kiwicare`,
            cancelUrl: "http://localhost:5173/appointment",
            returnUrl: returnUrl,
        });

        console.log("Payment Link Result:", result);
        res.json({
            checkoutUrl: result.checkoutUrl,
            returnUrl: returnUrl,
        });
    } catch (error) {
        console.error("Lỗi tạo link:", error.response?.data || error.message);
        res.status(400).json({
            message: "Thông tin truyền lên không hợp lệ",
            error: error.message,
        });
    }
};


