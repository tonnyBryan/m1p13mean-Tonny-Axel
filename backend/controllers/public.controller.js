const { successResponse, errorResponse } = require('../utils/apiResponse');
const Boutique = require('../models/Boutique');
const Product = require('../models/Product');

const BOUTIQUES_PER_PAGE = 6;

/**
 * GET /api/public/preview?page=1
 * Boutiques actives + validées avec leurs 2 meilleurs produits — sans auth
 */
exports.getStoresPreview = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const skip = (page - 1) * BOUTIQUES_PER_PAGE;

        // 1. Compter le total
        const total = await Boutique.countDocuments({
            isActive: true,
            isValidated: true
        });

        // 2. Récupérer les boutiques paginées
        const boutiques = await Boutique
            .find({ isActive: true, isValidated: true })
            .select('name logo description isLocal')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(BOUTIQUES_PER_PAGE)
            .lean();

        if (!boutiques.length) {
            return successResponse(res, 200, null, {
                data: [],
                hasMore: false,
                total
            });
        }

        // 3. Aggregation : 2 meilleurs produits par boutique, avec catégorie peuplée
        const boutiqueIds = boutiques.map(b => b._id);

        const productsByBoutique = await Product.aggregate([
            {
                $match: {
                    boutique: { $in: boutiqueIds },
                    isActive: true,
                    images: { $exists: true, $not: { $size: 0 } }
                }
            },
            { $sort: { avgRating: -1, createdAt: -1 } },
            // Joindre la catégorie
            {
                $lookup: {
                    from: 'categories',
                    localField: 'category',
                    foreignField: '_id',
                    as: 'categoryData'
                }
            },
            {
                $addFields: {
                    category: { $arrayElemAt: ['$categoryData', 0] }
                }
            },
            {
                $group: {
                    _id: '$boutique',
                    products: {
                        $push: {
                            _id: '$_id',
                            name: '$name',
                            regularPrice: '$regularPrice',
                            salePrice: '$salePrice',
                            isSale: '$isSale',
                            avgRating: '$avgRating',
                            totalRatings: '$totalRatings',
                            category: { name: '$category.name' },
                            images: { $slice: ['$images', 1] }
                        }
                    }
                }
            },
            {
                $project: {
                    products: { $slice: ['$products', 2] }
                }
            }
        ]);

        // 4. Map pour lookup O(1)
        const productsMap = new Map(
            productsByBoutique.map(p => [p._id.toString(), p.products])
        );

        // 5. Assembler — même ordre que les boutiques paginées
        const result = boutiques.map(boutique => ({
            boutique,
            products: productsMap.get(boutique._id.toString()) || []
        }));

        return successResponse(res, 200, null, {
            data: result,
            hasMore: skip + BOUTIQUES_PER_PAGE < total,
            total,
            page
        });

    } catch (error) {
        console.error('getStoresPreview error:', error);
        return errorResponse(res, 500, 'Failed to load stores preview.');
    }
};

/**
 * GET /api/public/hero-products
 * 2 produits random de boutiques actives et validées — sans auth
 */
exports.getHeroProducts = async (req, res) => {
    try {
        const validBoutiqueIds = await Boutique
            .find({ isActive: true, isValidated: true })
            .select('_id')
            .lean();

        if (!validBoutiqueIds.length) {
            return successResponse(res, 200, null, []);
        }

        const ids = validBoutiqueIds.map(b => b._id);

        const products = await Product.aggregate([
            {
                $match: {
                    boutique: { $in: ids },
                    isActive: true,
                    images: { $exists: true, $not: { $size: 0 } }
                }
            },
            { $sample: { size: 2 } },
            {
                $project: {
                    name: 1,
                    regularPrice: 1,
                    salePrice: 1,
                    isSale: 1,
                    images: { $slice: ['$images', 1] }
                }
            }
        ]);

        return successResponse(res, 200, null, products);
    } catch (error) {
        console.error('getHeroProducts error:', error);
        return errorResponse(res, 500, 'Failed to load hero products.');
    }
};