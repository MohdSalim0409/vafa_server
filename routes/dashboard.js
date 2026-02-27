const express = require("express");
const router = express.Router();
const Order = require("../models/order");
const User = require("../models/User");
const PerfumeInventory = require("../models/perfumeInventory");
const PerfumeMaster = require("../models/perfumeMaster");
const Payment = require("../models/payment");
const Cart = require("../models/cart");

router.get("/stats", async (req, res) => {

    try {
        const now = new Date();
        const lastMonth = new Date(now.setMonth(now.getMonth() - 1));
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // Fetch metrics with error handling for each promise
        const [
            totalOrders,
            totalCustomers,
            totalProducts,
            lowStockItems,
            revenueData,
            orderStatusData,
            topProducts,
            recentOrders,
            categoryData,
            monthlyData,
            paymentStats,
            recentPayments
        ] = await Promise.all([
            // Total orders
            Order.countDocuments().catch(err => 0),
            
            // Total customers
            User.countDocuments({ role: 'user' }).catch(err => 0),
            
            // Total products (inventory items)
            PerfumeInventory.countDocuments().catch(err => 0),
            
            // Low stock items
            PerfumeInventory.countDocuments({
                $expr: { $lte: ["$quantity", "$reorderLevel"] }
            }).catch(err => 0),
            
            // Revenue data for chart (last 7 days)
            Order.aggregate([
                {
                    $match: {
                        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
                    }
                },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                        revenue: { $sum: "$totalAmount" },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]).catch(err => []),
            
            // Order status distribution
            Order.aggregate([
                {
                    $group: {
                        _id: "$orderStatus",
                        value: { $sum: 1 }
                    }
                }
            ]).catch(err => []),
            
            // Top selling products
            Order.aggregate([
                { $unwind: "$items" },
                {
                    $group: {
                        _id: "$items.inventory",
                        name: { $first: "$items.perfumeName" },
                        brand: { $first: "$items.brand" },
                        quantity: { $sum: "$items.quantity" },
                        revenue: { $sum: "$items.subtotal" }
                    }
                },
                { $sort: { quantity: -1 } },
                { $limit: 5 }
            ]).catch(err => []),
            
            // Recent orders
            Order.find()
                .sort({ createdAt: -1 })
                .limit(10)
                .populate('user', 'name email phone')
                .populate('payment')
                .lean()
                .catch(err => []),
            
            // Category distribution
            PerfumeMaster.aggregate([
                {
                    $group: {
                        _id: "$category",
                        count: { $sum: 1 }
                    }
                }
            ]).catch(err => []),
            
            // Monthly comparison (last 6 months)
            Order.aggregate([
                {
                    $match: {
                        createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)) }
                    }
                },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                        revenue: { $sum: "$totalAmount" },
                        orders: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]).catch(err => []),

            // Payment statistics
            Payment.aggregate([
                {
                    $group: {
                        _id: "$status",
                        count: { $sum: 1 },
                        total: { $sum: "$amount" }
                    }
                }
            ]).catch(err => []),

            // Recent payments
            Payment.find()
                .sort({ createdAt: -1 })
                .limit(5)
                .populate('order')
                .lean()
                .catch(err => [])
        ]);

        // Calculate total revenue
        const totalRevenue = await Order.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: "$totalAmount" }
                }
            }
        ]).catch(err => [{ total: 0 }]);

        // Calculate today's revenue
        const todayRevenue = await Order.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
                        $lt: new Date(new Date().setHours(23, 59, 59, 999))
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$totalAmount" }
                }
            }
        ]).catch(err => [{ total: 0 }]);

        // Calculate average order value
        const avgOrderValue = totalRevenue[0]?.total / (totalOrders || 1);

        // Calculate pending orders
        const pendingOrders = await Order.countDocuments({
            orderStatus: { $in: ["Placed", "Packed"] }
        }).catch(err => 0);

        // Calculate completed orders
        const completedOrders = await Order.countDocuments({
            orderStatus: "Delivered"
        }).catch(err => 0);

        // Calculate cancelled orders
        const cancelledOrders = await Order.countDocuments({
            orderStatus: "Cancelled"
        }).catch(err => 0);

        // Calculate total revenue from last month for comparison
        const lastMonthRevenue = await Order.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: new Date(new Date().setMonth(new Date().getMonth() - 1)),
                        $lt: new Date()
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$totalAmount" }
                }
            }
        ]).catch(err => [{ total: 0 }]);

        // Calculate revenue growth percentage
        const revenueGrowth = lastMonthRevenue[0]?.total > 0 
            ? ((totalRevenue[0]?.total - lastMonthRevenue[0]?.total) / lastMonthRevenue[0]?.total * 100).toFixed(1)
            : 0;

        // Format revenue data for chart
        const formattedRevenueData = revenueData.map(item => ({
            date: item._id,
            revenue: item.revenue,
            orders: item.count,
            profit: item.revenue * 0.4 // Assuming 40% profit margin
        }));

        // Fill missing dates in revenue data
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const existingData = formattedRevenueData.find(d => d.date === dateStr);
            last7Days.push({
                date: dateStr,
                revenue: existingData?.revenue || 0,
                orders: existingData?.orders || 0,
                profit: existingData?.profit || 0
            });
        }

        // Format order status data
        const formattedOrderStatus = orderStatusData.map(item => ({
            name: item._id,
            value: item.value
        }));

        // Add default statuses if missing
        const defaultStatuses = ["Placed", "Packed", "Shipped", "Delivered", "Cancelled", "Returned"];
        defaultStatuses.forEach(status => {
            if (!formattedOrderStatus.find(s => s.name === status)) {
                formattedOrderStatus.push({ name: status, value: 0 });
            }
        });

        // Format top products
        const formattedTopProducts = await Promise.all(topProducts.map(async item => {
            // Fetch product details if needed
            const inventory = await PerfumeInventory.findById(item._id)
                .populate('perfume')
                .lean()
                .catch(err => null);
            
            return {
                id: item._id,
                name: item.name || inventory?.perfume?.name || 'Unknown',
                brand: item.brand || inventory?.perfume?.brand || 'Unknown',
                quantity: item.quantity,
                revenue: item.revenue,
                image: inventory?.perfume?.images || null
            };
        }));

        // Format recent orders with more details
        const formattedRecentOrders = recentOrders.map(order => ({
            id: order._id,
            orderNumber: order.orderNumber || `ORD-${order._id.toString().slice(-6)}`,
            customerName: order.user?.name || 'Guest Customer',
            customerEmail: order.user?.email || 'N/A',
            customerPhone: order.user?.phone || 'N/A',
            amount: order.totalAmount,
            status: order.orderStatus,
            paymentStatus: order.paymentStatus,
            paymentMethod: order.paymentMethod,
            items: order.items?.length || 0,
            date: order.createdAt,
            shippingAddress: order.shippingAddress
        }));

        // Format category distribution
        const formattedCategoryData = categoryData.map(item => ({
            name: item._id,
            value: item.count
        }));

        // Add missing categories
        const categories = ["Men", "Women", "Unisex"];
        categories.forEach(cat => {
            if (!formattedCategoryData.find(c => c.name === cat)) {
                formattedCategoryData.push({ name: cat, value: 0 });
            }
        });

        // Format monthly comparison
        const formattedMonthlyData = monthlyData.map(item => ({
            month: item._id,
            revenue: item.revenue,
            orders: item.orders
        }));

        // Format payment statistics
        const formattedPaymentStats = {
            total: paymentStats.reduce((acc, curr) => acc + curr.total, 0),
            byStatus: paymentStats.reduce((acc, curr) => {
                acc[curr._id] = {
                    count: curr.count,
                    total: curr.total
                };
                return acc;
            }, {})
        };

        // Get low stock items details
        const lowStockDetails = await PerfumeInventory.find({
            $expr: { $lte: ["$quantity", "$reorderLevel"] }
        })
        .populate('perfume')
        .limit(10)
        .lean()
        .catch(err => []);

        const formattedLowStockDetails = lowStockDetails.map(item => ({
            id: item._id,
            name: item.perfume?.name || 'Unknown',
            brand: item.perfume?.brand || 'Unknown',
            size: item.size,
            quantity: item.quantity,
            reorderLevel: item.reorderLevel,
            sku: item.sku
        }));

        // Send comprehensive response
        res.status(200).json({
            success: true,
            metrics: {
                totalRevenue: totalRevenue[0]?.total || 0,
                todayRevenue: todayRevenue[0]?.total || 0,
                totalOrders,
                totalCustomers,
                totalProducts,
                averageOrderValue: Math.round(avgOrderValue),
                conversionRate: ((totalOrders / (totalCustomers || 1)) * 100).toFixed(1),
                pendingOrders,
                completedOrders,
                cancelledOrders,
                lowStockItems,
                revenueGrowth
            },
            charts: {
                revenueData: last7Days,
                orderStatusData: formattedOrderStatus,
                topProducts: formattedTopProducts,
                categoryDistribution: formattedCategoryData,
                monthlyComparison: formattedMonthlyData
            },
            recentOrders: formattedRecentOrders,
            recentPayments: recentPayments.map(payment => ({
                id: payment._id,
                transactionId: payment.transactionId,
                amount: payment.amount,
                method: payment.method,
                status: payment.status,
                orderNumber: payment.order?.orderNumber,
                date: payment.createdAt
            })),
            alerts: {
                lowStock: {
                    count: lowStockItems,
                    items: formattedLowStockDetails
                },
                pendingOrders: {
                    count: pendingOrders
                }
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch dashboard data',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Additional dashboard endpoints

// Get sales by period
router.get("/sales/:period", async (req, res) => {
    try {
        const { period } = req.params;
        let groupFormat;
        let matchCondition = {};

        switch(period) {
            case 'daily':
                groupFormat = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
                matchCondition = {
                    createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
                };
                break;
            case 'weekly':
                groupFormat = { $dateToString: { format: "%Y-W%U", date: "$createdAt" } };
                matchCondition = {
                    createdAt: { $gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) }
                };
                break;
            case 'monthly':
                groupFormat = { $dateToString: { format: "%Y-%m", date: "$createdAt" } };
                matchCondition = {
                    createdAt: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) }
                };
                break;
            default:
                return res.status(400).json({ error: 'Invalid period' });
        }

        const salesData = await Order.aggregate([
            { $match: matchCondition },
            {
                $group: {
                    _id: groupFormat,
                    revenue: { $sum: "$totalAmount" },
                    orders: { $sum: 1 },
                    averageOrderValue: { $avg: "$totalAmount" }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.status(200).json({
            success: true,
            period,
            data: salesData
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get inventory summary
router.get("/inventory-summary", async (req, res) => {
    try {
        const summary = await PerfumeInventory.aggregate([
            {
                $lookup: {
                    from: 'perfumemasters',
                    localField: 'perfume',
                    foreignField: '_id',
                    as: 'perfumeDetails'
                }
            },
            {
                $group: {
                    _id: null,
                    totalItems: { $sum: "$quantity" },
                    totalValue: { $sum: { $multiply: ["$quantity", "$costPrice"] } },
                    totalRetailValue: { $sum: { $multiply: ["$quantity", "$sellingPrice"] } },
                    uniqueProducts: { $addToSet: "$perfume" },
                    lowStockCount: {
                        $sum: {
                            $cond: [
                                { $lte: ["$quantity", "$reorderLevel"] },
                                1,
                                0
                            ]
                        }
                    },
                    outOfStockCount: {
                        $sum: {
                            $cond: [
                                { $eq: ["$quantity", 0] },
                                1,
                                0
                            ]
                        }
                    }
                }
            },
            {
                $project: {
                    totalItems: 1,
                    totalValue: 1,
                    totalRetailValue: 1,
                    uniqueProducts: { $size: "$uniqueProducts" },
                    lowStockCount: 1,
                    outOfStockCount: 1,
                    potentialProfit: { $subtract: ["$totalRetailValue", "$totalValue"] }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: summary[0] || {
                totalItems: 0,
                totalValue: 0,
                totalRetailValue: 0,
                uniqueProducts: 0,
                lowStockCount: 0,
                outOfStockCount: 0,
                potentialProfit: 0
            }
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get customer insights
router.get("/customer-insights", async (req, res) => {
    try {
        const insights = await Order.aggregate([
            {
                $group: {
                    _id: "$user",
                    totalSpent: { $sum: "$totalAmount" },
                    orderCount: { $sum: 1 },
                    averageOrderValue: { $avg: "$totalAmount" },
                    lastOrderDate: { $max: "$createdAt" }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'userDetails'
                }
            },
            {
                $match: {
                    'userDetails.role': 'user'
                }
            },
            {
                $group: {
                    _id: null,
                    totalCustomers: { $sum: 1 },
                    averageLifetimeValue: { $avg: "$totalSpent" },
                    totalRevenue: { $sum: "$totalSpent" },
                    averageOrdersPerCustomer: { $avg: "$orderCount" },
                    repeatCustomers: {
                        $sum: {
                            $cond: [
                                { $gte: ["$orderCount", 2] },
                                1,
                                0
                            ]
                        }
                    }
                }
            }
        ]);

        const topCustomers = await Order.aggregate([
            {
                $group: {
                    _id: "$user",
                    totalSpent: { $sum: "$totalAmount" },
                    orderCount: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            { $unwind: "$user" },
            { $match: { "user.role": "user" } },
            { $sort: { totalSpent: -1 } },
            { $limit: 5 },
            {
                $project: {
                    name: "$user.name",
                    email: "$user.email",
                    totalSpent: 1,
                    orderCount: 1
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: {
                summary: insights[0] || {
                    totalCustomers: 0,
                    averageLifetimeValue: 0,
                    totalRevenue: 0,
                    averageOrdersPerCustomer: 0,
                    repeatCustomers: 0
                },
                topCustomers
            }
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;