import multer from "multer";
import fs from "fs";

const uploadDir = "./public/temp";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    console.log("File upload initiated:", file.originalname);
    // console.log("Unique suffix generated:", uniqueSuffix);

    // cb(null, file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix); // Or
  },
});

export const upload = multer({
  storage: storage,
});
