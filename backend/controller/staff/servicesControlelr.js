const mongoose = require('mongoose');
const Service = require('../../models/Service'); // Model name: Service

// Get all services with pagination, search, sorting, and filtering
const getAllServices = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            sort = 'name',
            search = '',
            priceMin,
            priceMax,
        } = req.query;

        // Validate query parameters
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        if (isNaN(pageNum) || isNaN(limitNum) || pageNum < 1 || limitNum < 1) {
            return res.status(400).json({
                success: false,
                message: 'Invalid page or limit parameters',
            });
        }

        // Build query
        const query = {};
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
            ];
        }
        if (priceMin || priceMax) {
            query.price = {};
            if (priceMin) query.price.$gte = parseFloat(priceMin);
            if (priceMax) query.price.$lte = parseFloat(priceMax);
        }

        // Execute query with pagination and sorting
        const services = await Service
            .find(query)
            .sort(sort)
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum);

        // Get total count for pagination
        const total = await Service.countDocuments(query);

        res.status(200).json({
            success: true,
            services, // Matches your working function's response
            pagination: {
                total,
                page: pageNum,
                pages: Math.ceil(total / limitNum),
                limit: limitNum,
            },
        });
    } catch (error) {
        console.error('Error in getAllServices:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message,
        });
    }
};

// Get a single service by ID
const getServiceById = async (req, res) => {
    try {
        const service = await Service.findById(req.params.id);
        if (!service) {
            return res.status(404).json({
                success: false,
                message: 'Service not found',
            });
        }
        res.status(200).json({
            success: true,
            service,
        });
    } catch (error) {
        console.error('Error in getServiceById:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message,
        });
    }
};

// Create a new service
const createService = async (req, res) => {
    try {
        const service = await Service.create(req.body);
        res.status(201).json({
            success: true,
            service,
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Service name already exists',
            });
        }
        console.error('Error in createService:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message,
        });
    }
};

// Update a service
const updateService = async (req, res) => {
    try {
        const service = await Service.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!service) {
            return res.status(404).json({
                success: false,
                message: 'Service not found',
            });
        }
        res.status(200).json({
            success: true,
            service,
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Service name already exists',
            });
        }
        console.error('Error in updateService:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message,
        });
    }
};

// Delete a service
const deleteService = async (req, res) => {
    try {
        const service = await Service.findByIdAndDelete(req.params.id);
        if (!service) {
            return res.status(404).json({
                success: false,
                message: 'Service not found',
            });
        }
        res.status(200).json({
            success: true,
            message: 'Service deleted successfully',
        });
    } catch (error) {
        console.error('Error in deleteService:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message,
        });
    }
};
module.exports = {
    getAllServices, createService, deleteService, getServiceById, updateService
}
