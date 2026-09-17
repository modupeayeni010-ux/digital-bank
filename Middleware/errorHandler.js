const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
    res.status(err.statuscode || 500).json({ message: err.message || "something went wrong",});
};

module.exports = errorHandler;