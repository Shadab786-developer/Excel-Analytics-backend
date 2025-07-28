import { Router } from "express";
import {
  singIn,
  userLogin,
  userLogout,
  verifyEmail,
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/signup").post(singIn);
router.route("/login").post(verifyEmail, userLogin);
router.route("/logout").post(verifyJWT, userLogout);
router.route("/verify-email").post(verifyEmail);

export default router;
