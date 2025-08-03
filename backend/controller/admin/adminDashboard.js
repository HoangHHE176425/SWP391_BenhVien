const User = require("../../models/User");
const Employee = require("../../models/Employee");
const Appointment = require("../../models/Appointment");
const Payment = require("../../models/Payment");

exports.getUserRegistrationTrend = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await User.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get daily appointment count (last 30 days)
exports.getAppointmentTrend = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await Appointment.aggregate([
      { $match: { appointmentDate: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$appointmentDate" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get daily revenue (last 30 days)
exports.getRevenueTrend = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await Payment.aggregate([
      {
        $match: {
          paymentDate: { $gte: thirtyDaysAgo },
          status: "Completed",
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$paymentDate" } },
          totalRevenue: { $sum: "$amount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// Appointment type distribution (last 30 days)
exports.getAppointmentTypeStats = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await Appointment.aggregate([
      { $match: { appointmentDate: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
        },
      },
    ]);

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Revenue breakdown by payment method (last 30 days)
exports.getRevenueByMethod = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await Payment.aggregate([
      {
        $match: {
          paymentDate: { $gte: thirtyDaysAgo },
          status: "Completed",
        },
      },
      {
        $group: {
          _id: "$method",
          total: { $sum: "$amount" },
        },
      },
    ]);

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Summary counts for KPIs
exports.getDashboardSummaries = async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const appointmentCount = await Appointment.countDocuments();
    const revenue = await Payment.aggregate([
      { $match: { status: "Completed" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    res.json({
      totalUsers: userCount,
      totalAppointments: appointmentCount,
      totalRevenue: revenue[0]?.total || 0,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getUserGrowthStats = async (req, res) => {
  try {
    const days = 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await User.aggregate([
      {
        $match: { createdAt: { $gte: startDate } }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Build full 30-day timeline with gaps filled
    const result = [];
    for (let i = 0; i <= days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (days - i));
      const formattedDate = date.toISOString().split("T")[0];
      const found = stats.find(s => s._id === formattedDate);
      result.push({
        date: formattedDate,
        count: found ? found.count : 0
      });
    }

    // Calculate growth percentages
    let cumulative = 0;
    result.forEach((day, idx) => {
      cumulative += day.count;
      const previousCumulative = idx > 0 ? result[idx - 1].count + (result[idx - 1].cumulative || 0) : 0;
      const growth = previousCumulative > 0 ? ((cumulative - previousCumulative) / previousCumulative) * 100 : 0;
      day.growthPercentage = +growth.toFixed(2);
      day.cumulative = cumulative;
    });

    res.json(result);
  } catch (err) {
    console.error("getUserGrowthStats error:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.getEmployeeStats = async (req, res) => {
  try {
    const totalEmployees = await Employee.countDocuments();
    const roles = await Employee.aggregate([
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({ totalEmployees, roles });
  } catch (err) {
    res.status(500).json({ message: "Failed to get employee stats", error: err });
  }
};
