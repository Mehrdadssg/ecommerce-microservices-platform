// 1. Import mongoose
import mongoose from 'mongoose';


const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxLength: [100, 'Name cannot exceed 100 characters'],
    index: true  // For searching by name
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    index: true
  },
  description: {
    type: String,
    maxLength: [2000, 'Description cannot exceed 2000 characters']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative'],
    index: true  // For price range queries
  },
  compareAtPrice: {
    type: Number,
    min: [0, 'Compare price cannot be negative']
  },
  stock: {
    type: Number,
    required: true,
    min: [0, 'Stock cannot be negative'],
    default: 0
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    index: true
  },
  tags: [{
    type: String,
    lowercase: true
  }],
  images: [{
    url: String,
    alt: String
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'draft'],
    default: 'active'
  },
  metadata: {
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    rating: { type: Number, min: 0, max: 5 },
    reviews: { type: Number, default: 0 }
  }
}, {
  timestamps: true  // Adds createdAt and updatedAt automatically
});

//  Add text index for full-text search
productSchema.index({ category: 1, price: 1 });
productSchema.index({ status: 1, createdAt: -1 });

productSchema.virtual('isAvailable').get(function() {
  return this.stock > 0 && this.status === 'active';
});

productSchema.methods.decreaseStock = async function(quantity) {
  if (this.stock < quantity) {
    throw new Error('Insufficient stock');
  }
  this.stock -= quantity;
  return this.save();
};

productSchema.statics.findByCategory = function(category) {
  return this.find({ category, status: 'active' });
};

productSchema.pre('save', function(next) {
  // Generate slug from name if not provided
  if (!this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');
  }
  next();
});

export const Product = mongoose.model('Product', productSchema);