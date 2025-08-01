const Blog = require("../../models/Blog");
const CategoryBlog = require("../../models/CategoryBlog");
const cloudinary = require("cloudinary").v2;
const fs = require("fs").promises;
const path = require("path");
const slugify = require("slugify");

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

// Blog Functions
exports.getAllBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find()
      .populate("author_id", "fullname email")
      .populate("categoryId", "name");
    res.json(blogs);
  } catch (error) {
    console.error("Error fetching blogs:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.getBlogBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const blog = await Blog.findOne({ slug })
      .populate("author_id", "fullname email")
      .populate("categoryId", "name");
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }
    res.json(blog);
  } catch (error) {
    console.error("Error fetching blog by slug:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.createBlog = async (req, res) => {
  try {
    const { title, content, categoryId } = req.body;
    const author_id = req.user.userId;

    if (!title || !categoryId) {
      return res.status(400).json({ message: "Title and categoryId are required" });
    }
    if (!Array.isArray(content) || content.length === 0) {
      return res.status(400).json({ message: "Content array is required" });
    }

    const slug = slugify(title, { lower: true, strict: true, locale: "vi" });
    let mainImageUrl = req.body.image || "";

    // Handle main image upload
    if (req.files && req.files.mainImage) {
      const mainImage = Array.isArray(req.files.mainImage) ? req.files.mainImage[0] : req.files.mainImage;
      const result = await cloudinary.uploader.upload(mainImage.path, {
        folder: "blog_images",
      });
      mainImageUrl = result.secure_url;
      await fs.unlink(mainImage.path).catch(console.error);
    }

    // Process content images
    const processedContent = await Promise.all(
      content.map(async (item, index) => {
        if (item.type === "image" && req.files && req.files.contentImages) {
          const contentImage = Array.isArray(req.files.contentImages)
            ? req.files.contentImages.find((file) => file.fieldname === `contentImages[${index}]`)
            : req.files.contentImages;
          if (contentImage) {
            const result = await cloudinary.uploader.upload(contentImage.path, {
              folder: "blog_images",
            });
            await fs.unlink(contentImage.path).catch(console.error);
            return { ...item, url: result.secure_url };
          }
        }
        return {
          ...item,
          bold: item.bold || false,
          italic: item.italic || false,
          fontSize: item.fontSize || "medium",
        };
      })
    );

    const newBlog = new Blog({
      title,
      content: processedContent,
      author_id,
      image: mainImageUrl,
      slug,
      categoryId,
    });
    await newBlog.save();
    res.status(201).json(newBlog);
  } catch (error) {
    console.error("Error creating blog:", error);
    if (req.files) {
      await Promise.all(
        Object.values(req.files)
          .flat()
          .map((file) => fs.unlink(file.path).catch(console.error))
      );
    }
    res.status(400).json({ message: error.message });
  }
};

exports.updateBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, categoryId } = req.body;

    if (!title || !categoryId) {
      return res.status(400).json({ message: "Title and categoryId are required" });
    }
    if (!Array.isArray(content) || content.length === 0) {
      return res.status(400).json({ message: "Content array is required" });
    }

    const slug = title ? slugify(title, { lower: true, strict: true, locale: "vi" }) : undefined;
    let mainImageUrl = req.body.image || "";

    // Handle main image upload
    if (req.files && req.files.mainImage) {
      const mainImage = Array.isArray(req.files.mainImage) ? req.files.mainImage[0] : req.files.mainImage;
      const result = await cloudinary.uploader.upload(mainImage.path, {
        folder: "blog_images",
      });
      mainImageUrl = result.secure_url;
      await fs.unlink(mainImage.path).catch(console.error);
    }

    // Process content images
    const processedContent = await Promise.all(
      content.map(async (item, index) => {
        if (item.type === "image" && req.files && req.files.contentImages) {
          const contentImage = Array.isArray(req.files.contentImages)
            ? req.files.contentImages.find((file) => file.fieldname === `contentImages[${index}]`)
            : req.files.contentImages;
          if (contentImage) {
            const result = await cloudinary.uploader.upload(contentImage.path, {
              folder: "blog_images",
            });
            await fs.unlink(contentImage.path).catch(console.error);
            return { ...item, url: result.secure_url };
          }
        }
        return {
          ...item,
          bold: item.bold || false,
          italic: item.italic || false,
          fontSize: item.fontSize || "medium",
        };
      })
    );

    const updatedBlog = await Blog.findByIdAndUpdate(
      id,
      {
        title,
        content: processedContent,
        image: mainImageUrl,
        slug,
        categoryId,
        updatedAt: Date.now(),
      },
      { new: true }
    );
    if (!updatedBlog) {
      return res.status(404).json({ message: "Blog not found" });
    }
    res.json(updatedBlog);
  } catch (error) {
    console.error("Error updating blog:", error);
    if (req.files) {
      await Promise.all(
        Object.values(req.files)
          .flat()
          .map((file) => fs.unlink(file.path).catch(console.error))
      );
    }
    res.status(400).json({ message: error.message });
  }
};

exports.deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedBlog = await Blog.findByIdAndDelete(id);
    if (!deletedBlog) {
      return res.status(404).json({ message: "Blog not found" });
    }
    res.json({ message: "Blog deleted successfully" });
  } catch (error) {
    console.error("Error deleting blog:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.uploadImage = async (req, res) => {
  try {
    const files = req.files;
    if (!files || Object.keys(files).length === 0) {
      return res.status(400).json({ message: "No image files provided" });
    }
    const uploadResults = await Promise.all(
      Object.entries(files).flatMap(([fieldName, fileArray]) =>
        fileArray.map(async (file) => {
          const result = await cloudinary.uploader.upload(file.path, {
            folder: "blog_images",
          });
          await fs.unlink(file.path).catch(console.error);
          return result.secure_url;
        })
      )
    );
    res.status(200).json({ urls: uploadResults });
  } catch (error) {
    console.error("Cloudinary upload error:", error.message, error.stack);
    if (req.files) {
      await Promise.all(
        Object.values(req.files)
          .flat()
          .map((file) => fs.unlink(file.path).catch(console.error))
      );
    }
    res.status(500).json({
      message: "Failed to upload images to Cloudinary",
      error: error.message,
    });
  }
};

exports.getAllCategories = async (req, res) => {
  try {
    const categories = await CategoryBlog.find();
    res.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Category name is required" });
    }
    const newCategory = new CategoryBlog({ name });
    await newCategory.save();
    res.status(201).json(newCategory);
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(400).json({ message: error.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Category name is required" });
    }
    const updatedCategory = await CategoryBlog.findByIdAndUpdate(
      id,
      { name },
      { new: true }
    );
    if (!updatedCategory) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.json(updatedCategory);
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(400).json({ message: error.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const blogs = await Blog.find({ categoryId: id });
    if (blogs.length > 0) {
      return res.status(400).json({ message: "Cannot delete category with associated blogs" });
    }
    const deletedCategory = await CategoryBlog.findByIdAndDelete(id);
    if (!deletedCategory) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.getTopViewedBlogs = async (req, res) => {
  try {
    const topBlogs = await Blog.find()
      .populate("categoryId", "name")
      .sort({ views: -1 })
      .limit(5)
      .select("title content slug image views");
    res.json(topBlogs);
  } catch (error) {
    console.error("Error fetching top viewed blogs:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.incrementBlogViews = async (req, res) => {
  try {
    const { slug } = req.params;
    const blog = await Blog.findOne({ slug });
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }
    blog.views = (blog.views || 0) + 1;
    await blog.save();
    res.json({ message: "View count incremented", views: blog.views });
  } catch (error) {
    console.error("Error incrementing blog views:", error);
    res.status(500).json({ message: error.message });
  }
};