import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Registration } from "../models/register.models.js";

export const verifyJWT = asyncHandler(async (req, _, next) => {
  //storing the token which is comming into request of header
  const token =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  console.log("Token received:", token);
  //verify wheather the token was come or not
  if (!token) {
    throw new ApiError(401, "Unauthorized access, token is missing");
  }

  console.log("JWT_SECRET:", process.env.ACCESS_TOKEN_SECRET);
  console.log("Cookies:", req.cookies);
  console.log("Authorization header:", req.header("Authorization"));
  try {
    //Decoded the token to verify by jwt
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    console.log("Decoded token:", decodedToken);
    //assigned the token to user variable
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );

    console.log("User found:", user);

    // Verify the user
    if (!user) {
      throw new ApiError(401, "Unauthorized access, user not found");
    }

    req.user = user; // Attach user to request object

    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    console.log("JWT verification failed:", error);
    throw new ApiError(
      401,
      error?.message || "Unauthorized access, invalid token"
    );
  }
});
export const verifyRegisterJWT = asyncHandler(async (req, _, next) => {
  //storing the token which is comming into request of header
  const token =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  console.log("Token received:", token);
  //verify wheather the token was come or not
  if (!token) {
    throw new ApiError(401, "Unauthorized access, token is missing");
  }

  console.log("JWT_SECRET:", process.env.ACCESS_TOKEN_SECRET);
  console.log("Cookies:", req.cookies);
  console.log("Authorization header:", req.header("Authorization"));
  try {
    //Decoded the token to verify by jwt
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    console.log("Decoded token:", decodedToken);
    //assigned the token to user variable
    const user = await Registration.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );

    console.log("User found:", user);

    // Verify the user
    if (!user) {
      throw new ApiError(401, "Unauthorized access, user not found");
    }

    req.user = user; // Attach user to request object

    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    console.log("JWT verification failed:", error);
    throw new ApiError(
      401,
      error?.message || "Unauthorized access, invalid token"
    );
  }
});
