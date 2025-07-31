const Notification = require("../../models/Notification");
const User = require("../../models/User");

exports.createNotification = async (req, res) => {
  try {
    const { title, content, isUrgent, receiverEmail } = req.body;

    let receiverUser = null;
    if (receiverEmail) {
      receiverUser = await User.findOne({ email: receiverEmail });
      if (!receiverUser) {
        return res.status(400).json({ message: "Người dùng không tồn tại" });
      }
    }

    const notify = new Notification({
      title,
      content,
      isUrgent,
      receiver: receiverUser ? receiverUser._id : null,
    });

    await notify.save();
    res.status(201).json(notify);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const { title, receiver, fromDate, toDate } = req.query;
    let query = {};

    if (title) query.title = { $regex: title, $options: "i" };
    if (receiver) query.receiver = receiver;
    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) query.createdAt.$gte = new Date(fromDate);
      if (toDate) query.createdAt.$lte = new Date(toDate);
    }

    const notifications = await Notification.find(query).populate(
      "receiver",
      "fullname email"
    );
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ message: "Notification deleted." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.markUrgent = async (req, res) => {
  try {
    const notify = await Notification.findById(req.params.id);
    if (!notify) {
      return res.status(404).json({ message: "Notification not found" });
    }

    notify.isUrgent = !notify.isUrgent;
    await notify.save();

    res.json({ message: `Urgent status updated`, notification: notify });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const notifications = await Notification.find({
      $or: [{ receiver: null }, { receiver: userId }],
    }).sort({ createdAt: -1 });

    const unreadCount = notifications.filter(
      (n) => !n.isReadBy.includes(userId)
    ).length;

    res.json({ notifications, unreadCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const notify = await Notification.findById(id);

    if (!notify) {
      return res.status(404).json({ message: "Notification not found" });
    }

    if (!notify.isReadBy.includes(userId)) {
      notify.isReadBy.push(userId);
      await notify.save();
    }

    res.json({ message: "Marked as read." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllUserEmails = async (req, res) => {
  try {
    const users = await User.find({}, "email").lean();
    const emails = users.map((u) => u.email);
    res.json(emails);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch emails" });
  }
};
