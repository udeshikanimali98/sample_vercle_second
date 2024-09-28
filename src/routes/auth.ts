import { Express } from "express";
import { UserEp } from "../end-point/user-ep";
import { Authentication } from "../middleware/authentication";

export function initAuthRoutes(app: Express) {
 
  app.post("/api/public/register", UserEp.register);
  app.post("/api/public/login", UserEp.login);
  app.post("/api/public/password/recover", UserEp.forgetPassword);
  app.post("/api/public/password/verify-otp", UserEp.checkOtp);
  app.post("/api/public/password/reset", UserEp.resetPassword);

  app.post(
    "/api/auth/updateUserRole",
    Authentication.verifyToken,
    UserEp.updateUserRole
  );

  app.post("/api/auth/changePassword", Authentication.verifyToken, UserEp.changePasswordValidationRules(), UserEp.changePassword);

  app.post(
    "/api/auth/logout",
    Authentication.verifyToken,
    UserEp.logout
  );

  app.delete("/api/auth/delete-user/:userId", Authentication.verifyToken, UserEp.deleteUserByUserId);

  app.get("/api/auth/me", Authentication.verifyToken, UserEp.getMe);

  
}
