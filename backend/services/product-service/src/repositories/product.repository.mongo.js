import { Product } from '../models/product.model.js';

export class ProductRepositoryMongo {
  async findAll({ query = {}, pagination = { page: 1, limit: 20 }, sort = { createdAt: 'desc' } }) {
    try {
      const { page, limit } = pagination;
      const skip = (page - 1) * limit;
      
      // Build MongoDB query
      const mongoQuery = { ...query };
      
      // Handle special filters
      if (query.minPrice || query.maxPrice) {
        mongoQuery.price = {};
        if (query.minPrice) mongoQuery.price.$gte = query.minPrice;
        if (query.maxPrice) mongoQuery.price.$lte = query.maxPrice;
        delete mongoQuery.minPrice;
        delete mongoQuery.maxPrice;
      }
      
      // Execute query with pagination
      const products = await Product
        .find(mongoQuery)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean();  // Returns plain JS objects for better performance
      
      // Get total count for pagination
      const total = await Product.countDocuments(mongoQuery);
      
      return {
        data: products,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Database query failed: ${error.message}`);
    }
  }
  
  async findById(id) {
    
    return await Product.findById(id).lean();
  }
  
  async create(productData) {
    
   const product = new Product(productData);
   return await product.save();
  }
  
  
  async update(id, updateData) {
    return await Product.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    ).lean();
  }
  
  async delete(id) {
    return await Product.findByIdAndDelete(id);
  }
}