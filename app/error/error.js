// Base Error Class
class Error {
    constructor(code, message) {
        this.code = code;
        this.message = message;
    }
    
    // JSON Response for error message
    get response() {
        return {message: this.message};
    }
    
    // User error, input data error
    static UserError(message) {
        return new Error(400, message);
    }
    
    // Authentication error
    static AuthenticationError(message) {
        return new Error(401, message);
    }
    
    // Forbidden error, item not found
    static ForbiddenError(message) {
        return new Error(403, message);
    }
    
    // Missing item error, item not found
    static MissingItemError(message) {
        return new Error(404, message);
    }
    
    // Conflict error, DB constraints error
    static ConflictError(message) {
        return new Error(409, message);
    }
    
    // Internal system error
    static ServerError(message) {
        return new Error(500, message);
    }
}

module.exports = Error;
