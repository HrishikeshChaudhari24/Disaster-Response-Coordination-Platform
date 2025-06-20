// middleware/mockAuth.js

const mockAuth = (req, res, next) => {
    // Simulate login by reading username from header
    const username = req.headers['x-user-id'] || 'netrunnerX';
  
    // Hardcoded user-role mapping
    const users = {
      netrunnerX: { id: 'netrunnerX', role: 'contributor' },
      reliefAdmin: { id: 'reliefAdmin', role: 'admin' }
    };
  
    // Attach user info to req
    req.user = users[username] || users['netrunnerX'];
    next();
  };
  
  module.exports = mockAuth;
  