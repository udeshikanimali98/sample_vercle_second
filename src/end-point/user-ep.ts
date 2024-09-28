import { NextFunction, Request, Response } from "express";
import { check, validationResult } from "express-validator";
import { Util } from "../common/util";
import { UserDao } from "../dao/user-dao";
import {
  isEmailValid,
  Validation,
  passwordValidation,
} from "../common/validation";
import { DUser, Gender, Role} from "../models/user-model";

import { EmailService } from "../services/mail";
import { OTPDao } from "../dao/otp-dao";
import { OtpTypes } from "../enums/otpTypes";

export namespace UserEp {
  export function authValidationRules() {
    return [Validation.email(), Validation.password()];
  }

  export function changePasswordValidationRules() {
    return [
      check("oldPassword")
        .isString()
        .not()
        .isEmpty()
        .withMessage("Password is required.")
        .isLength({ min: 6, max: 40 })
        .withMessage("Password must be at least 6 chars long & not more than 40 chars long.")
        .not()
        .isIn(["123", "password", "god", "abc"])
        .withMessage("Do not use a common word as the password"),
      check("newPassword")
        .isString()
        .not()
        .isEmpty()
        .withMessage("Password is required.")
        .isLength({ min: 6, max: 40 })
        .withMessage("Password must be at least 6 chars long & not more than 40 chars long.")
        .not()
        .isIn(["123", "password", "god", "abc"])
        .withMessage("Do not use a common word as the password"),  
    ];
  }

  export async function authenticatewithEmail(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return Util.sendError(res, errors.array()[0]["msg"]);
    }

    UserDao.authenticateUser(req.body.email, req.body.password)
      .then((token: string) => {
        Util.sendSuccess(res, token, "User logged succefully");
      })
      .catch(next);
  }

  export async function register(req: Request, res: Response) {
    const { role, firstName, lastName, email, phoneNumber, password, address, gender } = req.body;
  
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.sendError(errors.array()[0]["msg"]);
    }
  
    try {
      // Check if email or phone number already exists
      const existingEmail = await UserDao.getUserByEmail(email);
      const existingPhone = await UserDao.getUserByPhone(phoneNumber); 
  
      if (existingEmail) {
        return Util.sendError(res, "Email already exists!");
      }
      if (existingPhone) {
        return Util.sendError(res, "Phone number already exists!");
      }
  
      // Validate password strength
      const isPasswordValid = passwordValidation(password);
      if (!isPasswordValid) {
        return Util.sendError(
          res,
          "Password must be at least 8 characters long, contain one special character, and one uppercase letter"
        );
      }
  
      // Determine user role
      let roleEnum: Role;
      if (role === "CHILD") {
        roleEnum = Role.CHILD;
      } else {
        roleEnum = Role.TEACHER;
      }

      if (!firstName || firstName.trim() === '') {
        return Util.sendError(res, "First name cannot be null or empty!");
      }

      if (!gender || gender.trim() === '') {
        return Util.sendError(res, "Gender cannot be null or empty!");
      }

      let genderEnum: Gender;
      if (gender === "MALE") {
        genderEnum = Gender.MALE;
      } else if(gender === "FEMALE") {
        genderEnum = Gender.FEMALE;
      } else {
        genderEnum = Gender.OTHER;
      }
  
      // Create new user data
      const data: DUser = { 
        role: roleEnum,
        firstName: firstName,
        lastName: lastName,
        email: email,
        phoneNumber: phoneNumber,
        password: password,
        address: address,
        gender: genderEnum
      };
  
      // Create user in database
      const newUser = await UserDao.createCustomer(data);
  
      // Send welcome email
      await EmailService.sendWelcomeEmail(
        email,
        "Welcome to ClassQ",
        "Welcome to ClassQ",
        `Thank you for registering with us.`
      );
  
      // Send success response
      Util.sendSuccess(res, newUser, "User registered");
    } catch (error) {
      console.error("Error during user registration:", error);
      Util.sendError(res, "An internal server error occurred", 500);
    }
  }

  export async function login(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { email, password } = req.body;
     
      const isEmail = isEmailValid(email);

      if (!isEmail ) {
        return Util.sendError(res, "Invalid email or phone number format");
      }

      let user;
      if (isEmail) {
        user = await UserDao.getUserByEmail(email);
      } 

      if (!user) {
        return Util.sendError(res, "User not found");
      }

      // Check if the password is correct
      const isPasswordValid = await UserDao.authenticateUser(
        user.email,
        password
      );
      if (!isPasswordValid) {
        return Util.sendError(res, "Incorrect password");
      }

      // Generate and send token
      if (isPasswordValid) {
        Util.sendSuccess(res, isPasswordValid, "User logged succefully");
      }
    } catch (error) {
      Util.sendError(res, "An internal server error occurred", 500);
    }
  }

  export async function updateUserRole(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const {
        role,
      } = req.body;

      const user = req.user?._id.toString();
      if (!user) {
        return Util.sendError(res, "User not found");
      }
      const updatedUser = await UserDao.updateUser(user, {
        role,
      });
      Util.sendSuccess(res, updatedUser, "Preference updated successfully");
    } catch (error: any) {
      Util.sendError(res, error.message);
    }
  }

  export async function forgetPassword(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const email = req.body.email;

    try {
     // const isPhoneNumber = isPhoneNumberValid(emailOrPhoneNumber);
      const isEmail = isEmailValid(email);

      if (!isEmail ) {
        return Util.sendError(res, "Invalid email or phone number format");
      }

      let user;
      if (isEmail) {
        user = await UserDao.getUserByEmail(email);
      } 
      // else if (isPhoneNumber) {
      //   user = await UserDao.getUserByPhoneNumber(emailOrPhoneNumber);
      // }

      if (!user) {
        return Util.sendError(res, "User not found");
      }
      // Generate and save OTP
      const expirationMinutes = 3;
      const otpDetails = await OTPDao.createOTP(
        user.email,
        expirationMinutes,
        OtpTypes.FORGET_PASSWORD
      );

      // Send the OTP to the user (e.g., via email or SMS)
      console.log(`Generated OTP for user ${email}: ${otpDetails.otp}`);

      if(isEmail){
        // await EmailService.sendTestEmail(
        //   user.email,
        //   "hEy"
        // );
        await EmailService.sendVerifyEmail(
          user.email,
          "One Time Password(O T P) Confirmation - ClassQ",
          otpDetails.otp,
          "Let's recover your ClassQ account.",
          `Hi there, thank you for signing up with ClassQ. Use the following code to recover your account.`
        );
      
        Util.sendSuccess(res, null, "OTP generated successfully");
      }

      // if(isPhoneNumber){
      // // await sendMsg();
      // console.log("OTP for " + req.body.emailOrPhoneNumber + " is " + otpDetails.otp);
      // const text = `Your OTP code is ${otpDetails.otp}. Do not share this code.`;
      // const smsStatus = await SMSService.sendSMS(emailOrPhoneNumber, text);
      // if (smsStatus) {
      //   Util.sendSuccess(res, user, "Send OTP to verify mobile number");
        
      // } else {
        
      //   Util.sendError(
      //     res,
      //     "Couldn't send SMS code to the given phoneNumber",
      //     500
      //   );
      // }
      // }
     
    } catch (error: any) {    
      Util.sendError(res, error.message);
    }
  }

  export async function checkOtp(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return Util.sendError(res, errors.array()[0]["msg"]);
      }

      const { email, otp } = req.body;

     // const isPhoneNumber = isPhoneNumberValid(emailOrPhoneNumber);
      const isEmail = isEmailValid(email);

      if (!isEmail ) {
        return Util.sendError(res, "Invalid email or phone number format");
      }

      let user;
      if (isEmail) {
        user = await UserDao.getUserByEmail(email);
      } 
      // else if (isPhoneNumber) {
      //   user = await UserDao.getUserByPhoneNumber(emailOrPhoneNumber);
      // }

      if (!user) {
        return Util.sendError(res, "User not found");
      }

      // Check OTP validity.
      const otpDetails = await OTPDao.getLatestOTP(user.email);
      if (!otpDetails || otpDetails.otp !== otp) {
        return Util.sendError(res, "Invalid OTP");
      }
      const currentTime = new Date();
      if (otpDetails.expiresAt < currentTime) {
        return Util.sendError(res, "Expired OTP");
      }

      const resetToken = Util.generateResetToken(user.email);
      return Util.sendSuccess(res, { resetToken }, "OTP is valid");
    } catch (error) {
      next(error);
    }
  }

  export async function resetPassword(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return Util.sendError(res, errors.array()[0]["msg"]);
      }

      const { email, newPassword, resetToken } = req.body;

      //const isPhoneNumber = isPhoneNumberValid(emailOrPhoneNumber);
      const isEmail = isEmailValid(email);

      if (!isEmail ) {
        return Util.sendError(res, "Invalid email or phone number format");
      }

      let user;
      if (isEmail) {
        user = await UserDao.getUserByEmail(email);
      }
      //  else if (isPhoneNumber) {
      //   user = await UserDao.getUserByPhoneNumber(emailOrPhoneNumber);
      // }

      if (!user) {
        return Util.sendError(res, "User not found");
      }

      if (!Util.verifyResetToken(user.email, resetToken)) {
        return Util.sendError(res, "Invalid or expired reset token");
      }

      const isPasswordValid = passwordValidation(newPassword);
      if (!isPasswordValid) {
        return Util.sendError(
          res,
          "Password must be at least 8 characters long and contain at least one special character and one uppercase letter"
        );
      }
      // Update user's password
      //const user = await UserDao.getUserByEmail(user.email);
      
      if (user) {
        // const hashed = await Util.passwordHashing(newPassword);
        const newHashedPassword = await Util.passwordHashing(newPassword);
        await UserDao.updateUser((user._id as ObjectId).toString(), { password: newHashedPassword });

        // Delete OTP after successful password reset
        await OTPDao.deleteOTP(user.email);

        return Util.sendSuccess(
          res,
          null,
          "Your password is changed successfully & You can login now"
        );
      } else {
        return Util.sendError(res, "User not found");
      }
    } catch (error) {
      next(error);
    }
  }

  export async function changePassword(req: Request, res: Response, next: NextFunction) {
    const { oldPassword, newPassword } = req.body;
  
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return Util.sendError(res, errors.array()[0]["msg"]);
    }
  
    if (oldPassword === newPassword) {
      return Util.sendError(res, "New and old passwords cannot be the same.");
    }

    const userId = req.user?._id.toString();
    if (!userId) {
      return Util.sendError(res, "User not found");
    }
  
    if (!userId) {
      return Util.sendError(res,"User ID is missing.");
    }
  
    try {
      const user = await UserDao.getUserById(userId);
  
      if (!user) {
        return Util.sendError(res,"User not found.");
      }
   
      const isMatch = await user.comparePassword(oldPassword);
     
      if (!isMatch) {
        return Util.sendError(res, "Incorrect old password.");
      }
     
      const hashedPassword = await Util.passwordHashing(newPassword);
  
      const updatedPassword = { password: hashedPassword };
   
      const updatedUser = await UserDao.updateUser(userId, updatedPassword);
     
      if (!updatedUser) {
        return Util.sendError(res,"Failed to change the password.");
      }
  
      return Util.sendSuccess(res, updatedUser, "Password successfully changed.");
    } catch (error) {
      return Util.sendError(res, "An error occurred while changing the password.");
    }
  } 

}

  

