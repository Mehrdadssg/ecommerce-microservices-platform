import jwt from 'jsonwebtoken';

export const authenticate  = (req, res, next) => {
    try{
        const authHeader = req.headers.authorization;

        if(!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Authorization header missing or malformed' });
        }

        const token = authHeader.split(' ')[1];
        const decoded= jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch(error) {
        console.error('Authentication error:', error);
        if(error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Invalid or expired token' });
        }   
    }

}

export const adminOnly = (req, res, next) => {
    if(!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden: Admins only' });
    }
    next();
}