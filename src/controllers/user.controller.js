import { Users } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendEmail } from "../utils/sendEmail.js";

const generateTokens = async (userId) => {
  try {
    const user = await Users.findById(userId);

    if (!user) {
      console.log("User not found for token generation");
      throw new ApiError(404, "User not found");
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    console.error("Error generating access and refresh tokens:", error);
    throw new ApiError(500, "Failed to generate tokens");
  }
};

const singIn = asyncHandler(async (req, res) => {
  const { userName, password, email } = req.body;

  //verifying the field are requried
  if (!email && !password && !userName) {
    throw new ApiError(400, "All fields are required");
  }

  //Check if user was already exist or not
  const existedUser = await Users.findOne({
    $or: [{ userName }, { email }],
  });
  if (existedUser) {
    throw new ApiError(409, "User already exists with this username or email");
  }

  try {
    // Generate a random 6-digit verification code
    const verificationCode = Math.floor(1000 + Math.random() * 9000).toString();
    // Send verification email
    await sendEmail(
      email,
      "Verify your email",
      `<div style="max-width:400px; margin:0 auto;padding:28px 20px; background:#fff; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.08); font-family:'Segoe UI',Arial,sans-serif;">
  <div style="text-align:center;">
    <img src="https://content.jdmagicbox.com/v2/comp/delhi/p1/011pxx11.xx11.180419233547.s2p1/catalogue/myntra-warehouse-mohammadpur-delhi-warehouses-services-1o8sinohci-250.jpg;" alt="Excel-Analysis" style="height:300px; width:300px; margin-bottom:8px;">
    <h2 style="color:#ff3f6c; margin-bottom:8px;">Verify Your Email</h2>
    <p style="color:#333; font-size:16px; margin-bottom:24px;">
      Thank you for signing up with Excel-Analysis!<br>
      Please use the code below to verify your email address.
    </p>
    <div style="display:inline-block; background:#fff; color:#ff3f6c; font-size:28px; letter-spacing:6px; border:1px solid #ff3f6c; padding:12px 32px; border-radius:6px; font-weight:bold; margin-bottom:24px;">
      ${verificationCode}
    </div>
    <p style="color:#555; font-size:14px; margin-top:24px;">
      Didn’t request this? Please ignore this email.<br>
      <b style="color:blue;">Need help?</b> Contact <a href="mailto:ashiksdevadiga8@gmail.com" style="color:#ff3f6c; text-decoration:none;">ashiksdevadiga8@gmail.com</a>
    </p>
  </div>
</div>`
    );

    //Create new user

    const user = await Users.create({
      userName,
      email,
      password,
      verificationCode,
      isVerified: false,
    });

    const createdUser = await Users.findById(user._id).select(
      "-password -refreshToken "
    );
    console.log(createdUser);

    //verify the create user was present or not
    if (!createdUser) {
      throw new ApiError(500, "User registration failed");
    }

    //generating access and refresh token
    const { accessToken, refreshToken } = await generateTokens(user._id);

    const options = {
      httpOnly: true, // Cookie is not accessible via JavaScript
      secure: process.env.NODE_ENV === "production", // Cookie is only sent over HTTPS in production
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          { user: createdUser, accessToken, refreshToken },
          "User Sing in successfully"
        )
      );
  } catch (error) {
    console.log("User Creation failed:", error);
    throw new ApiError(500, "User SingIn failed");
  }
});

const userLogin = asyncHandler(async (req, res) => {
  //getting data from request body
  const { email, password } = req.body;

  //validate the inputs
  if (!email && !password) {
    throw new ApiError(400, "Email and password are required");
  }

  //find user by username and email
  const user = await Users.findOne({
    $or: [{ email }],
  });

  if (!user) {
    throw new ApiError(404, "User not found with this username or email");
  }

  //check if password is correct or not
  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid password or credentials");
  }

  //generating access and refresh token
  const { accessToken, refreshToken } = await generateTokens(user._id);

  const loggedInUser = await Users.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!loggedInUser) {
    throw new ApiError(500, "Login failed, user not found");
  }

  const options = {
    httpOnly: true, // Cookie is not accessible via JavaScript
    secure: process.env.NODE_ENV === "production", // Cookie is only sent over HTTPS in production
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User logged in successfully"
      )
    );
});

const userLogout = asyncHandler(async (req, res) => {
  await Users.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        isVerified: false,
      },
    },
    {
      $set: {
        refreshToken: null, // Clear the refresh token
      },
    },
    {
      new: true, //Return the updated user document
    }
  );

  const options = {
    httpOnly: true, // Cookie is not accessible via JavaScript
    secure: process.env.NODE_ENV === "production", // Cookie is only sent over HTTPS in production
  };

  return res
    .status(200)
    .cookie("accessToken", "", options) // Clear the access token cookie
    .cookie("refreshToken", "", options) // Clear the refresh token cookie
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const verifyEmail = asyncHandler(async (req, res) => {
  const { email, code } = req.body;
  console.log("Verifiying email:", email);
  const user = await Users.findOne({ email });

  console.log("user", user);

  if (!user) throw new ApiError(404, "User not found");
  if (user.verificationCode !== code) throw new ApiError(400, "Invalid code");

  user.isVerified = true;
  user.verificationCode = undefined;
  await user.save();

  res.json(new ApiResponse(200, {}, "Email Verification Successfully"));
});

export { singIn, userLogin, userLogout, verifyEmail };
