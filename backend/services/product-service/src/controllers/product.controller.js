import { ProductService } from "../services/product.service.js";

export class ProductController {

    constructor({ productService = new ProductService() } = {}) {
        this.productService = productService;

        this.getAllProducts = this.getAllProducts.bind(this);
        this.getProductById = this.getProductById.bind(this);
        this.createProduct = this.createProduct.bind(this);
    }


getAllProducts = async (req, res, next) => {

        const page = req.query.page || 1;
        const limit = req.query.limit || 20;
        const sortBy = req.query.sortBy || 'createdAt';
        const order = req.query.order || 'desc';
        // Extract filters excluding pagination and sorting params
        const { page: _, limit: __, sortBy: ___, order: ____, ...filters } = req.query;
    try{
        const product = await this.productService.getAllProducts({ page, limit, sortBy, order, filters });
        res.status(200).json(product);  
    }
    catch(err){
        next(err);
    }

}



getProductById = async (req, res, next) => {

    const { id } = req.params;
    try{
        if(!id) throw new Error('Product ID is required');
        const product = await this.productService.getProductById(id);
        if(!product) return res.status(404).json({ message: 'Product not found' });
        res.status(200).json(product);  

    } catch(err){
        next(err);
    }
}

createProduct = async (req, res, next) => {
    console.log('=== CREATE PRODUCT CALLED ===');
    console.log('Request body:', req.body);

    const productData = req.body;


    if (!productData || !productData.name) {
        return res.status(400).json({ message: 'Invalid product data' });
    }

    try{
        console.log('Calling service with:', productData);
        const newProduct = await this.productService.createProduct(productData);    
        console.log('Product created:', newProduct);
        res.status(201).json(newProduct);
    } catch(err){   
        console.error('Error in createProduct controller:', error);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        next(err);
    }

}

updateProduct = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const updatedProduct = await productService.updateProduct(id, updateData);
        res.status(200).json(updatedProduct);
    } catch (err) {
        next(err);
    }
};

deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deletedProduct = await this.productService.deleteProduct(id);
    if (!deletedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (err) {
    next(err);
  }
};

}
