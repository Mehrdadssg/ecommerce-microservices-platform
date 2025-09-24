

export class ProductController {

    constructor({ productService = new ProductService() } = {}) {
        this.productService = productService;

        this.getAllProducts = this.getAllProducts.bind(this);
        this.getProductById = this.getProductById.bind(this);
        this.createProduct = this.createProduct.bind(this);
    }


getAllProducts = async (req, res, next) => {
  try {
    // Use validated query if available, otherwise use original
    const query = req.validatedQuery || req.query;
    
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const sortBy = query.sortBy || 'createdAt';
    const order = query.order || 'desc';
    
    // Extract filters (remove pagination and sort params)
    const { page: _, limit: __, sortBy: ___, order: ____, ...filters } = query;
    
    const result = await this.productService.getAllProducts({
      page,
      limit,
      sortBy,
      order,
      filters
    });
    
    res.status(200).json({
      success: true,
      data: result.data || result,
      pagination: result.pagination || {
        page,
        limit,
        total: Array.isArray(result) ? result.length : result.data?.length || 0
      }
    });
  } catch (error) {
    console.error('Error in getAllProducts:', error);
    next(error);
  }
};



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
