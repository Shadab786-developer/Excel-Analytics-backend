import mongoose, { Schema } from "mongoose";

const uploadSchema = new Schema(
  {
    file: {
      type: String, //cloudinary URL
      required: true,
    },
    public_id: {
      type: String, //cloudinary public id
      required: true,
    },
    xAxis: {
      type: String,
      required: true,
    },
    yAxis: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export const Upload = mongoose.model("Upload", uploadSchema);
