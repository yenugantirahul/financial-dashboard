export const authenticate = (req, res, next) => {
    // later this will come from better auth session/token
    const mockUser = {
        id: "user_123",
        role: "ADMIN",
    };
    req.user = mockUser;
    next();
};
