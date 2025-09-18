import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minLength: [6, 'Password must be at least 6 characters'],
    select: false  // Don't return password by default
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  role: {
    type: String,
    enum: ['customer', 'admin', 'vendor'],
    default: 'customer'
  },
  phone: {
    type: String,
    match: [/^\+?[\d\s-()]+$/, 'Please enter a valid phone number']
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  lastLogin: Date,
  refreshToken: {
    type: String,
    select: false
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date
}, {
  timestamps: true,

  toJSON: { virtuals: true,
    transform: (doc, ret) => {
      delete ret.password;
      delete ret.refreshToken;
      return ret;
    }
   },
});


//indexes for performance
userSchema.index({email:1 , isActive:1});
userSchema.index({isActive:1, role:1});
// userSchema.index({ email: 1 }, { unique: true });



// Virtual for full name
userSchema.virtual('displayName').get(function() {
  return `${this.name} (${this.role})`;
});

//Virtual for account lock status
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

userSchema.pre('save', async function(next) {
  // Only hash if password is modified
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to generate JWT
userSchema.methods.generateAuthToken = function() {
  const payload = {
    id: this._id.toString(),
    email: this.email,
    role: this.role,
    isActive: this.isActive

  };
  
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
    issuer: 'user0service',
    audience: 'user'
  });
 
  //reset login attempts and lock info
  userSchema.methods.resetLoginAttempts = async function() {
    this.loginAttempts = 0;
    this.lockUntil = undefined;
    this.lastLogin = new Date();
    return this.save();
  } 

  //find email by password

  userSchema.statics.findByEmail = function(email) {
    return this.findOne({ email: email.toLowerCase().trim() });
  }

//find user by role 
  userSchema.statics.findByRole = function(role) {
    return this.find({ role: role });
  }

};
export const User = mongoose.model('User', userSchema);