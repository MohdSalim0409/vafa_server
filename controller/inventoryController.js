const PerfumeInventory = require("../models/perfumeInventory");
const PerfumeMaster = require("../models/perfumeMaster");

// ---------------------------------------------------------------------------------------------------------------------------------------

// Get all inventory items with pagination and filters

exports.getAllInventory = async (req, res) => {

    try {

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        let filter = {};

        if (req.query.status) filter.status = req.query.status;
        if (req.query.perfume) filter.perfume = req.query.perfume;
        if (req.query.size) filter.size = req.query.size;
        if (req.query.search) {
            filter.$or = [
                { sku: { $regex: req.query.search, $options: 'i' } },
                { batchNumber: { $regex: req.query.search, $options: 'i' } }
            ];
        }

        const inventory = await PerfumeInventory.find(filter)
            .populate('perfume', 'name brand category concentration')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await PerfumeInventory.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: inventory,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: limit
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ---------------------------------------------------------------------------------------------------------------------------------------

// Get single inventory item by ID

exports.getInventoryById = async (req, res) => {

    try {

        const inventory = await PerfumeInventory.findById(req.params.id)
            .populate('perfume', 'name brand category concentration fragranceFamily description images');

        if (!inventory) {
            return res.status(404).json({
                success: false,
                message: "Inventory item not found"
            });
        }

        res.status(200).json({
            success: true,
            data: inventory
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ---------------------------------------------------------------------------------------------------------------------------------------

// Create new inventory item

exports.createInventory = async (req, res) => {

    try {

        // Check if perfume exists
        const perfume = await PerfumeMaster.findById(req.body.perfume);
        if (!perfume) {
            return res.status(404).json({
                success: false,
                message: "Perfume not found"
            });
        }

        // Check for duplicate SKU
        const existingSKU = await PerfumeInventory.findOne({ sku: req.body.sku });
        if (existingSKU) {
            return res.status(400).json({
                success: false,
                message: "SKU already exists"
            });
        }

        // Calculate status based on quantity
        const status = calculateStatus(req.body.quantity, req.body.reorderLevel);

        const inventoryData = { ...req.body, status };

        const inventory = await PerfumeInventory.create(inventoryData);

        res.status(201).json({
            success: true,
            data: inventory,
            message: "Inventory item created successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ---------------------------------------------------------------------------------------------------------------------------------------

// Update inventory item

exports.updateInventory = async (req, res) => {

    try {
        if (req.body.sku) {
            const existingSKU = await PerfumeInventory.findOne({
                sku: req.body.sku,
                _id: { $ne: req.params.id }
            });
            if (existingSKU) {
                return res.status(400).json({
                    success: false,
                    message: "SKU already exists"
                });
            }
        }

        // Calculate new status if quantity or reorderLevel is updated
        let updateData = { ...req.body };
        if (req.body.quantity !== undefined || req.body.reorderLevel !== undefined) {
            const inventory = await PerfumeInventory.findById(req.params.id);
            const newQuantity = req.body.quantity !== undefined ? req.body.quantity : inventory.quantity;
            const newReorderLevel = req.body.reorderLevel !== undefined ? req.body.reorderLevel : inventory.reorderLevel;
            updateData.status = calculateStatus(newQuantity, newReorderLevel);
        }

        const inventory = await PerfumeInventory.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).populate('perfume', 'name brand');

        if (!inventory) {
            return res.status(404).json({
                success: false,
                message: "Inventory item not found"
            });
        }

        res.status(200).json({
            success: true,
            data: inventory,
            message: "Inventory item updated successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ---------------------------------------------------------------------------------------------------------------------------------------

// Delete inventory item

exports.deleteInventory = async (req, res) => {
    try {
        const inventory = await PerfumeInventory.findByIdAndDelete(req.params.id);

        if (!inventory) {
            return res.status(404).json({
                success: false,
                message: "Inventory item not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Inventory item deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ---------------------------------------------------------------------------------------------------------------------------------------

// Update stock quantity (for sales/stock adjustments)

exports.updateStock = async (req, res) => {

    try {

        const { id } = req.params;
        const { quantity, operation } = req.body; 

        const inventory = await PerfumeInventory.findById(id);
        if (!inventory) {
            return res.status(404).json({
                success: false,
                message: "Inventory item not found"
            });
        }

        let newQuantity;
        if (operation === 'add') {
            newQuantity = inventory.quantity + quantity;
        } else if (operation === 'subtract') {
            if (inventory.quantity < quantity) {
                return res.status(400).json({
                    success: false,
                    message: "Insufficient stock"
                });
            }
            newQuantity = inventory.quantity - quantity;
        } else {
            return res.status(400).json({
                success: false,
                message: "Invalid operation"
            });
        }

        const newStatus = calculateStatus(newQuantity, inventory.reorderLevel);

        const updatedInventory = await PerfumeInventory.findByIdAndUpdate(
            id,
            {
                quantity: newQuantity,
                status: newStatus
            },
            { new: true }
        );

        res.status(200).json({
            success: true,
            data: updatedInventory,
            message: `Stock ${operation === 'add' ? 'added' : 'subtracted'} successfully`
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ---------------------------------------------------------------------------------------------------------------------------------------

// Helper function to calculate status

const calculateStatus = (quantity, reorderLevel) => {
    if (quantity <= 0) return "Out Of Stock";
    if (quantity <= reorderLevel) return "Low Stock";
    return "In Stock";
};

// ---------------------------------------------------------------------------------------------------------------------------------------