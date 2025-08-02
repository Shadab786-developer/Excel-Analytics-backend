import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Upload } from "../models/upload.models.js";
import axios from "axios";
import XLSX from "xlsx";
import fs from "fs";
import path from "path";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const __dirname = path.resolve();

const uploadFile = asyncHandler(async (req, res) => {
  const { xAxis, yAxis } = req.body;

  // Validate the input
  if ([xAxis, yAxis].some((field) => !field || field.trim() === "")) {
    throw new ApiError(400, "Both xAxis and yAxis are required");
  }

  const filePath = req.files?.file?.[0]?.path;
  const fileName = req.files?.file?.[0]?.originalname;
  const destPath = path.join(__dirname, "/public/temp", fileName);

  // Ensure the directory exists
  fs.mkdirSync(path.dirname(destPath), { recursive: true });

  // Move the file
  fs.copyFileSync(filePath, destPath);
  if (!filePath) {
    throw new ApiError(400, "File is required");
  }

  let cloudinaryResult;
  try {
    cloudinaryResult = await uploadOnCloudinary(filePath);
  } catch (error) {
    throw new ApiError(500, "Failed to upload file to Cloudinary");
  }

  let uploadDoc;
  try {
    uploadDoc = await Upload.create({
      file: cloudinaryResult.secure_url,
      public_id: cloudinaryResult.public_id,
      xAxis,
      yAxis,
    });
  } catch (error) {
    // Clean up Cloudinary if DB save fails
    await deleteFromCloudinary(cloudinaryResult.public_id);
    console.error("MongoDB save error:", error);
    throw new ApiError(500, "Failed to save upload info");
  }

  return res
    .status(201)
    .json(
      new ApiResponse(201, uploadDoc, "File uploaded and saved successfully")
    );
});

const analyzeAndDownload = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const uploadDoc = await Upload.findById(id);
  if (!uploadDoc) {
    throw new ApiError(404, "Upload not found");
  }

  //Download XLS file from Cloudinary
  const response = await axios.get(uploadDoc.file, {
    responseType: "arraybuffer",
  });
  const workbook = XLSX.read(response.data, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(sheet);

  //Arrange data for chart (example: xAxis and yAxis columns)

  const chartData = {
    labels: jsonData.map((row) => row[uploadDoc.xAxis]),
    datasets: [
      {
        label: uploadDoc.yAxis,
        data: jsonData.map((row) => row[uploadDoc.yAxis]),
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
        fill: true,
      },
    ],
  };

  //Download chart data as JSON file
  const fileName = `chart-data-${id}.json`;
  const filePath = path.join(__dirname, "/public/temp", fileName);
  fs.writeFileSync(filePath, JSON.stringify(chartData, null, 2));

  // Send chart data and download link
  return res.status(200).json({
    chartData,
    downloadUrl: `/temp/${fileName}`,
  });
});
export { uploadFile, analyzeAndDownload };
