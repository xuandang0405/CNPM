import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_change_me';

// Create token for driver1
const driverToken = jwt.sign(
    { sub: 'u-driver-1', role: 'driver', email: 'driver1@ssb.com' },
    JWT_SECRET,
    { expiresIn: '7d' }
);

console.log('=== Test Tokens ===\n');
console.log('Driver 1 Token:');
console.log(driverToken);
console.log('\nUse this in Authorization header as:');
console.log(`Bearer ${driverToken}`);
