import { Product } from '../models/product.model.js';

export class ProductRepositoryMongo {
 async findAll({ query = {}, pagination = { page: 1, limit: 20 }, sort = { createdAt: -1 } } = {}) {
    try {
      const { page, limit } = pagination;
      const skip = (page - 1) * limit;
      
      const products = await Product
        .find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean();  // .lean() returns plain objects, not Mongoose documents
      
      const total = await Product.countDocuments(query);
      
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
      console.error('Repository findAll error:', error);
      throw error;
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