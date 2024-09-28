//import { AppLogger } from "../common/logging";
import { ApplicationError } from "../common/application-error";
import { DUser, IUser} from "../models/user-model";
import User from "../schemas/user-schema";
import { StringOrObjectId } from "../common/util";


export namespace UserDao {
  export async function getUserByEmail(email: string): Promise<IUser | null> {
    let user = await User.findOne({ email: email });
   // AppLogger.info(`Got user for email, userID: ${user ? user._id : "None"}`);
    return user;
  }

  export async function getUserByPhone(phoneNumber: string): Promise<IUser | null> {
    let user = await User.findOne({ phoneNumber: phoneNumber });
   // AppLogger.info(`Got user for email, userID: ${user ? user._id : "None"}`);
    return user;
  }

  // export async function createCustomer(
  //   data: DUser & Partial<DUser>
  // ): Promise<IUser> {
  //   const iCustomer = new User(data);
  //   console.log(data);
  //   const customer = await iCustomer.save();
  //   return customer; 
  // }

  // export async function createCustomer(user: Partial<DUser>): Promise<IUser> {
  //   const iUser = new User(user);
  //   const newUser = await iUser.save();
  //   console.log(newUser)
  //   return newUser;
  // }

  export async function createCustomer(user: Partial<DUser>): Promise<IUser> {
    try {
      const iUser = new User(user);
      
      // Validate if all required fields are present
      if (!user.email || !user.phoneNumber || !user.password || !user.role || !user.firstName) {
        throw new Error("Missing required fields in user data");
      }
  
      // Save the new user
      const newUser = await iUser.save();
      return newUser;
    } catch (error) {
      throw error; 
    }
  }
  
  
  
  export async function authenticateUser(
    email: string,
    password: string
  ): Promise<any> {
    let user = await User.findOne({ email: email });
    
    if (user) {
      const isMatch = await user.comparePassword(password);
      if (isMatch) {
        const tokenString = await user.createAccessToken();  
        return {
          token: tokenString,
          //role: user.role,
          user: user
        };
      } else {
        return false;
      }
    } else {
      throw new ApplicationError("User not found in the system!");
    }
  }

  export async function updateUser(
    userId: string,
    data: Partial<any>
  ): Promise<any | null> {
    try {
      const result = await User.findOneAndUpdate(
        { _id: userId },
        { $set: data },
        { new: true }
      );

      if (result) {
        return result;
      } else {
        throw new Error(`Customer with ID ${userId} not found.`);
      }
    } catch (error: any) {
    
      throw error;
    }
  }

  export async function getUserById(id: string): Promise<IUser> {
    let user = await User.findById(id);
    if (!user) {
      throw new ApplicationError("User not found for Id: ");
    }
    user.lastLogin = new Date();
    await user.save();
    return user;
  }

  export async function deleteUserById(id: string): Promise<IUser | null> {
    try {
      const deletedUser = await User.findByIdAndDelete(id);
      if (!deletedUser) {
        throw new ApplicationError(`User with ID ${id} not found.`);
      }
      return deletedUser;
    } catch (error) {
      throw new ApplicationError("Error deleting user with ID ");
    }
  }
  

}
