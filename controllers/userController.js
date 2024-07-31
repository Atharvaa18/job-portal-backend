import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";
import { User } from "../models/userSchema.js";
import { v2 as cloudinary } from "cloudinary";
import { sendToken } from "../utils/jwtToken.js";

// export const register = catchAsyncErrors(async (req, res, next) => {
//   try {
//     const {
//       name,
//       email,
//       phone,
//       address,
//       password,
//       role,
//       firstNiche,
//       secondNiche,
//       thirdNiche,
//       coverLetter,
//     } = req.body;

//     if (!name || !email || !phone || !address || !password || !role) {
//       return next(new ErrorHandler("All fileds are required.", 400));
//     }
//     if (role === "Job Seeker" && (!firstNiche || !secondNiche || !thirdNiche)) {
//       return next(
//         new ErrorHandler("Please provide your preferred job niches.", 400)
//       );
//     }
//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return next(new ErrorHandler("Email is already registered.", 400));
//     }
//     const userData = {
//       name,
//       email,
//       phone,
//       address,
//       password,
//       role,
//       niches: {
//         firstNiche,
//         secondNiche,
//         thirdNiche,
//       },
//       coverLetter,
//     };
//     if (req.files && req.files.resume) {
//       const { resume } = req.files;
//       if (resume) {
//         try {
//           const cloudinaryResponse = await cloudinary.uploader.upload(
//             resume.tempFilePath,
//             { folder: "Job_Seekers_Resume" }
//           );
//           if (!cloudinaryResponse || cloudinaryResponse.error) {
//             return next(
//               new ErrorHandler("Failed to upload resume to cloud.", 500)
//             );
//           }
//           userData.resume = {
//             public_id: cloudinaryResponse.public_id,
//             url: cloudinaryResponse.secure_url,
//           };
//         } catch (error) {
//           return next(new ErrorHandler("Failed to upload resume", 500));
//         }
//       }
//     }
//     const user = await User.create(userData);
//     sendToken(user, 201, res, "User Registered.");
//   } catch (error) {
//     next(error);
//   }
// });
export const register = catchAsyncErrors(async (req, res, next) => {
  try {
    // Extract data from request body
    const {
      name,
      email,
      phone,
      address,
      password,
      role,
      firstNiche,
      secondNiche,
      thirdNiche,
      coverLetter,
    } = req.body;

    // Log received data
    console.log("Request Body:", req.body);

    // Check if required fields are present
    if (!name || !email || !phone || !address || !password || !role) {
      console.log("Missing required fields:", { name, email, phone, address, password, role });
      return next(new ErrorHandler("All fields are required.", 400));
    }

    // Additional validation for 'Job Seeker' role
    if (role === "Job Seeker" && (!firstNiche || !secondNiche || !thirdNiche)) {
      console.log("Missing job niches:", { firstNiche, secondNiche, thirdNiche });
      return next(new ErrorHandler("Please provide your preferred job niches.", 400));
    }

    // Check if user with the given email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("Email already registered:", email);
      return next(new ErrorHandler("Email is already registered.", 400));
    }

    // Prepare user data for creation
    const userData = {
      name,
      email,
      phone,
      address,
      password,
      role,
      niches: {
        firstNiche,
        secondNiche,
        thirdNiche,
      },
      coverLetter,
    };

    // Log userData before handling file uploads
    console.log("User Data Before File Upload:", userData);

    // Handle file upload if present
    if (req.files && req.files.resume) {
      const { resume } = req.files;
      if (resume) {
        console.log("Resume file detected:", resume);

        try {
          const cloudinaryResponse = await cloudinary.uploader.upload(
            resume.tempFilePath,
            { folder: "Job_Seekers_Resume" }
          );
          console.log("Cloudinary Response:", cloudinaryResponse);

          if (!cloudinaryResponse || cloudinaryResponse.error) {
            console.log("Cloudinary upload failed:", cloudinaryResponse.error);
            return next(new ErrorHandler("Failed to upload resume to cloud.", 500));
          }

          userData.resume = {
            public_id: cloudinaryResponse.public_id,
            url: cloudinaryResponse.secure_url,
          };
        } catch (error) {
          console.log("Error during resume upload:", error);
          return next(new ErrorHandler("Failed to upload resume", 500));
        }
      }
    }

    // Create user in the database
    const user = await User.create(userData);
    console.log("User Created Successfully:", user);

    // Send response with token
    sendToken(user, 201, res, "User Registered.");
  } catch (error) {
    // Log any unexpected errors
    console.log("Unexpected Error:", error);
    next(error);
  }
});

// export const login = catchAsyncErrors(async (req, res, next) => {
//   const { role, email, password } = req.body;
//   if (!role || !email || !password) {
//     return next(
//       new ErrorHandler("Email, password and role are required.", 400)
//     );
//   }
//   const user = await User.findOne({ email }).select("+password");
//   if (!user) {
//     return next(new ErrorHandler("Invalid email or password.", 400));
//   }
//   const isPasswordMatched = await user.comparePassword(password);
//   if (!isPasswordMatched) {
//     return next(new ErrorHandler("Invalid email or password.", 400));
//   }
//   if (user.role !== role) {
//     return next(new ErrorHandler("Invalid user role.", 400));
//   }
//   sendToken(user, 200, res, "User logged in successfully.");
// });
export const login = catchAsyncErrors(async (req, res, next) => {
  const { role, email, password } = req.body;

  // Log the received request body
  console.log("Login Request Body:", req.body);

  // Check for required fields
  if (!role || !email || !password) {
    console.log("Missing fields:", { role, email, password });
    return next(
      new ErrorHandler("Email, password, and role are required.", 400)
    );
  }

  // Find user by email
  const user = await User.findOne({ email }).select("+password");

  // Log user retrieval status
  if (!user) {
    console.log("User not found for email:", email);
    return next(new ErrorHandler("Invalid email or password.", 400));
  }

  // Compare provided password with stored password
  const isPasswordMatched = await user.comparePassword(password);
  console.log("Password Match Status:", isPasswordMatched);

  if (!isPasswordMatched) {
    console.log("Password mismatch for email:", email);
    return next(new ErrorHandler("Invalid email or password.", 400));
  }

  // Check if the user's role matches the provided role
  if (user.role !== role) {
    console.log("Role mismatch for user:", { email, role: user.role });
    return next(new ErrorHandler("Invalid user role.", 400));
  }

  // Log user details (excluding sensitive information)
  console.log("User authenticated successfully:", { email, role: user.role });

  // Send token and success response
  sendToken(user, 200, res, "User logged in successfully.");
});

export const logout = catchAsyncErrors(async (req, res, next) => {
  res
    .status(200)
    .cookie("token", "", {
      expires: new Date(Date.now()),
      httpOnly: true,
    })
    .json({
      success: true,
      message: "Logged out successfully.",
    });
});

export const getUser = catchAsyncErrors(async (req, res, next) => {
  const user = req.user;
  res.status(200).json({
    success: true,
    user,
  });
});

export const updateProfile = catchAsyncErrors(async (req, res, next) => {
  const newUserData = {
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone,
    address: req.body.address,
    coverLetter: req.body.coverLetter,
    niches: {
      firstNiche: req.body.firstNiche,
      secondNiche: req.body.secondNiche,
      thirdNiche: req.body.thirdNiche,
    },
  };
  const { firstNiche, secondNiche, thirdNiche } = newUserData.niches;

  if (
    req.user.role === "Job Seeker" &&
    (!firstNiche || !secondNiche || !thirdNiche)
  ) {
    return next(
      new ErrorHandler("Please provide your all preferred job niches.", 400)
    );
  }
  if (req.files) {
    const resume = req.files.resume;
    if (resume) {
      const currentResumeId = req.user.resume.public_id;
      if (currentResumeId) {
        await cloudinary.uploader.destroy(currentResumeId);
      }
      const newResume = await cloudinary.uploader.upload(resume.tempFilePath, {
        folder: "Job_Seekers_Resume",
      });
      newUserData.resume = {
        public_id: newResume.public_id,
        url: newResume.secure_url,
      };
    }
  }

  const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });
  res.status(200).json({
    success: true,
    user,
    message: "Profile updated.",
  });
});

export const updatePassword = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id).select("+password");

  const isPasswordMatched = await user.comparePassword(req.body.oldPassword);

  if (!isPasswordMatched) {
    return next(new ErrorHandler("Old password is incorrect.", 400));
  }

  if (req.body.newPassword !== req.body.confirmPassword) {
    return next(
      new ErrorHandler("New password & confirm password do not match.", 400)
    );
  }

  user.password = req.body.newPassword;
  await user.save();
  sendToken(user, 200, res, "Password updated successfully.");
});
