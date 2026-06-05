// middleware/loggingMiddleware.js

function loggingMiddleware(req, res, next) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${req.method} request received at ${req.originalUrl}\n`;
    
    // Writes directly to the terminal process stream to comply with custom logging rules
    process.stdout.write(logMessage);
    
    next();
}

module.exports = loggingMiddleware;