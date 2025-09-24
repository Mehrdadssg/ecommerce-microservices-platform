const requestCounts = new Map();

export const rateLimiter = (req, res, next) => {
    const ip = req.ip;
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    const maxRequests = 100;
    
    if (!requestCounts.has(ip)) {
        requestCounts.set(ip, []);
    }
    
    const requests = requestCounts.get(ip);
    const recentRequests = requests.filter(time => now - time < windowMs);
    
    if (recentRequests.length >= maxRequests) {
        return res.status(429).json({
            success: false,
            message: 'Too many requests, please try again later'
        });
    }
    
    recentRequests.push(now);
    requestCounts.set(ip, recentRequests);
    
    next();
};