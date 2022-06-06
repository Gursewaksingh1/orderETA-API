const driverLoginSchema = {
    username: {
        isString: true,
        errorMessage: "username must be a string",
        isLength: {
            options: { min: 3, max: 30 },
            errorMessage: "username must contain three characters",
        },
        notEmpty: true,    
    },
    password: {
        isLength: {
            options: { min: 6, max: 30 },
            errorMessage: "password must contain six characters",
        },
        notEmpty: true,
    }
}

module.exports = driverLoginSchema