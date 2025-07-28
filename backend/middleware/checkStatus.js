const User = require("../models/User");


const checkUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.status === "inactive") {
      return res.status(403).json({ error: "You are banned from the system" });
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = checkUserStatus;
