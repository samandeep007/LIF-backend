const apiResponse = (res, statusCode, data, message = 'Success') => {
    res.status(statusCode).json({
      success: true,
      message,
      data
    });
  };
  
  export default apiResponse;