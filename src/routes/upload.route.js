import { Router } from "express";
import {
  uploadFile,
  analyzeAndDownload,
} from "../controllers/upload.controller.js";
import { upload } from "../middlewares/multer.middlewares.js";

const router = Router();

router
  .route("/uploadFile")
  .post(upload.fields([{ name: "file", maxCount: 1 }]), uploadFile);

router.get("/analyze/:id", analyzeAndDownload);

export default router;
