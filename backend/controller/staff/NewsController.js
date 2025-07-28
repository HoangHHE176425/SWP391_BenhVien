const News = require("../../models/News");
const cloudinary = require("cloudinary").v2;
const fs = require("fs").promises;
const path = require("path");
const slugify = require("slugify");
const mongoose = require("mongoose");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Ensure upload directory exists
const uploadDir = path.join(__dirname, "../Uploads");
fs.mkdir(uploadDir, { recursive: true })
  .then(() => console.log("Uploads directory created or exists"))
  .catch((err) => console.error("Error creating uploads directory:", err));

// Hàm kiểm tra validUntil hợp lệ
const isValidUntilDate = (validUntil) => {
  const currentDate = new Date();
  const inputDate = new Date(validUntil);
  return inputDate >= currentDate;
};

// News Functions
exports.getAllNews = async (req, res) => {
  try {
    const { category, isFeatured, priority, title, page = 1, limit = 10 } = req.query;
    const query = {};
    if (category) query.category = category;
    if (isFeatured === "true") query.isFeatured = true;
    if (priority) query.priority = priority;
    if (title) query.title = { $regex: title, $options: "i" };
    const skip = (page - 1) * limit;
    const news = await News.find(query)
      .populate("author_id", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    const total = await News.countDocuments(query);
    res.status(200).json({
      success: true,
      data: news,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching news:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getNewsBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const news = await News.findOne({ slug })
      .populate("author_id", "name email")
      .lean();
    if (!news) {
      return res.status(404).json({ success: false, message: "News not found" });
    }
    res.status(200).json({ success: true, data: news });
  } catch (error) {
    console.error("Error fetching news by slug:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createNews = async (req, res) => {
  try {
    const { title, content, category, isFeatured, priority, validUntil } = req.body;
    const author_id = req.user.userId;

    if (!title || !content || !category) {
      return res.status(400).json({ success: false, message: "Title, content, and category are required" });
    }

    const validCategories = ["Thông Báo Nghỉ Lễ", "Khuyến Mãi", "Sự Kiện", "Cập Nhật Dịch Vụ", "Khác"];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ success: false, message: "Invalid category provided" });
    }

    const validPriorities = ["low", "medium", "high"];
    if (priority && !validPriorities.includes(priority)) {
      return res.status(400).json({ success: false, message: "Invalid priority provided" });
    }

    if (validUntil && !isValidUntilDate(validUntil)) {
      return res.status(400).json({
        success: false,
        message: "validUntil date cannot be in the past",
      });
    }

    if (!req.files?.thumbnail && !req.body.thumbnail) {
      return res.status(400).json({ success: false, message: "Thumbnail is required" });
    }

    let thumbnailUrl = req.body.thumbnail || "";
    if (req.files && req.files.thumbnail) {
      const thumbnail = Array.isArray(req.files.thumbnail) ? req.files.thumbnail[0] : req.files.thumbnail;
      const result = await cloudinary.uploader.upload(thumbnail.path, {
        folder: "news_images",
      });
      thumbnailUrl = result.secure_url;
      await fs.unlink(thumbnail.path).catch(console.error);
    }

    let imageUrl = req.body.image || "";
    if (req.files && req.files.image) {
      const image = Array.isArray(req.files.image) ? req.files.image[0] : req.files.image;
      const result = await cloudinary.uploader.upload(image.path, {
        folder: "news_images",
      });
      imageUrl = result.secure_url;
      await fs.unlink(image.path).catch(console.error);
    }

    const slug = slugify(title, { lower: true, strict: true, locale: "vi" });
    const existingNews = await News.findOne({ slug });
    if (existingNews) {
      return res.status(400).json({
        success: false,
        message: "A news item with this title already exists. Please use a different title.",
      });
    }

    const newNews = new News({
      title,
      content,
      image: imageUrl,
      category,
      thumbnail: thumbnailUrl,
      slug,
      author_id,
      isFeatured: !!isFeatured,
      priority: priority || "medium",
      validUntil: validUntil ? new Date(validUntil) : undefined,
    });

    await newNews.save();
    const populatedNews = await News.findById(newNews._id)
      .populate("author_id", "name email")
      .lean();

    res.status(201).json({
      success: true,
      message: "News created successfully",
      data: populatedNews,
    });
  } catch (error) {
    console.error("Error creating news:", error);
    if (req.files) {
      await Promise.all(
        Object.values(req.files)
          .flat()
          .map((file) => fs.unlink(file.path).catch(console.error))
      );
    }
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "A news item with this title already exists. Please use a different title.",
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateNews = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, category, isFeatured, priority, validUntil, thumbnail, image } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid news ID" });
    }

    const news = await News.findById(id);
    if (!news) {
      return res.status(404).json({ success: false, message: "News not found" });
    }

    if (title && !title.trim()) {
      return res.status(400).json({ success: false, message: "Title is required" });
    }
    if (content && !content.trim()) {
      return res.status(400).json({ success: false, message: "Content is required" });
    }
    if (category && !["Thông Báo Nghỉ Lễ", "Khuyến Mãi", "Sự Kiện", "Cập Nhật Dịch Vụ", "Khác"].includes(category)) {
      return res.status(400).json({ success: false, message: "Invalid category" });
    }
    if (priority && !["low", "medium", "high"].includes(priority)) {
      return res.status(400).json({ success: false, message: "Invalid priority" });
    }
    if (thumbnail && !thumbnail.trim()) {
      return res.status(400).json({ success: false, message: "Thumbnail is required" });
    }
    if (validUntil && !isValidUntilDate(validUntil)) {
      return res.status(400).json({
        success: false,
        message: "validUntil date cannot be in the past",
      });
    }

    let thumbnailUrl = thumbnail || news.thumbnail;
    if (req.files && req.files.thumbnail) {
      const thumbnailFile = Array.isArray(req.files.thumbnail) ? req.files.thumbnail[0] : req.files.thumbnail;
      const result = await cloudinary.uploader.upload(thumbnailFile.path, {
        folder: "news_images",
      });
      thumbnailUrl = result.secure_url;
      await fs.unlink(thumbnailFile.path).catch(console.error);
    }

    let imageUrl = image || news.image;
    if (req.files && req.files.image) {
      const imageFile = Array.isArray(req.files.image) ? req.files.image[0] : req.files.image;
      const result = await cloudinary.uploader.upload(imageFile.path, {
        folder: "news_images",
      });
      imageUrl = result.secure_url;
      await fs.unlink(imageFile.path).catch(console.error);
    }

    const slug = title ? slugify(title, { lower: true, strict: true, locale: "vi" }) : news.slug;

    const updatedNews = await News.findByIdAndUpdate(
      id,
      {
        title: title || news.title,
        content: content || news.content,
        image: imageUrl,
        category: category || news.category,
        thumbnail: thumbnailUrl,
        slug,
        isFeatured: isFeatured !== undefined ? isFeatured : news.isFeatured,
        priority: priority || news.priority,
        validUntil: validUntil ? new Date(validUntil) : news.validUntil,
        updatedAt: Date.now(),
      },
      { new: true }
    ).populate("author_id", "name email");

    res.status(200).json({
      success: true,
      message: "News updated successfully",
      data: updatedNews,
    });
  } catch (error) {
    console.error("Error updating news:", error);
    if (req.files) {
      await Promise.all(
        Object.values(req.files)
          .flat()
          .map((file) => fs.unlink(file.path).catch(console.error))
      );
    }
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Slug already exists. Please use a different title.",
      });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteNews = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid news ID" });
    }
    const deletedNews = await News.findByIdAndDelete(id);
    if (!deletedNews) {
      return res.status(404).json({ success: false, message: "News not found" });
    }
    res.status(200).json({
      success: true,
      message: "News deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting news:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.incrementNewsViews = async (req, res) => {
  try {
    const { slug } = req.params;
    const news = await News.findOne({ slug });
    if (!news) {
      return res.status(404).json({ success: false, message: "News not found" });
    }
    news.views = (news.views || 0) + 1;
    await news.save();
    res.status(200).json({
      success: true,
      message: "View count incremented",
      views: news.views,
    });
  } catch (error) {
    console.error("Error incrementing news views:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTopViewedNews = async (req, res) => {
  try {
    const topNews = await News.find()
      .sort({ views: -1 })
      .limit(5)
      .select("title content slug thumbnail views")
      .lean();
    res.status(200).json({ success: true, data: topNews });
  } catch (error) {
    console.error("Error fetching top viewed news:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getNewsByPriority = async (req, res) => {
  try {
    const priorityOrder = { high: 1, medium: 2, low: 3 };
    const news = await News.find()
      .sort({ priority: 1 })
      .limit(5)
      .select("title content slug thumbnail priority")
      .lean();
    news.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    res.status(200).json({ success: true, data: news });
  } catch (error) {
    console.error("Error fetching news by priority:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.uploadImage = async (req, res) => {
  try {
    const files = req.files;
    if (!files || Object.keys(files).length === 0) {
      return res.status(400).json({ success: false, message: "No image files provided" });
    }
    const uploadResults = await Promise.all(
      Object.entries(files).flatMap(([fieldName, fileArray]) =>
        fileArray.map(async (file) => {
          const result = await cloudinary.uploader.upload(file.path, {
            folder: "news_images",
          });
          await fs.unlink(file.path).catch(console.error);
          return result.secure_url;
        })
      )
    );
    res.status(200).json({ success: true, urls: uploadResults });
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    if (req.files) {
      await Promise.all(
        Object.values(req.files)
          .flat()
          .map((file) => fs.unlink(file.path).catch(console.error))
      );
    }
    res.status(500).json({
      success: false,
      message: "Failed to upload images to Cloudinary",
      error: error.message,
    });
  }
};