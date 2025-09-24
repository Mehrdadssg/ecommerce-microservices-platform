import jwt from 'jsonwebtoken';

export function generateToken(payload) {
    return jwt.sign(payload, process.env.JWT_SECRET || 'test-secret', {
        expiresIn: '1h'
    });
}