import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const appError = (err, req, res, next) => {
  // // Error Handler for development
  // console.log(err);
  // return res.status(500).json({
  //   error: err,
  //   message: err.message,
  // });

  // Custom and expected errors handler
  //   if (err instanceof ErrorResponses) {
  //     return res.status(err.StatusCode).json({
  //       status: "fail",
  //       operational: true,
  //       message: err.message,
  //     });
  //   }

  // Mongo Validation Error Handler
  if (
    err.name === "ValidationError" ||
    err instanceof mongoose.Error.ValidationError
  ) {
    const mongoError = err;
    const validationError = Object.values(mongoError.errors);
    return res.status(403).json({
      status: "fail",
      operational: true,
      message: validationError[0].message,
    });
  }

  // JSON Web Token Error Handler
  const { JsonWebTokenError } = jwt;
  if (err instanceof JsonWebTokenError) {
    return res.status(401).json({
      status: "fail",
      operational: true,
      message: "Unauthorized access restricted",
    });
  }

  // Unexpected error handler
  console.log("Unexpected Error: ", err);
  return res.status(500).json({
    status: "error",
    operational: false,
    message: "Something went wrong!",
  });
};

export default appError;
