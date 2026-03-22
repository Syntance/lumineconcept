import { Module } from "@medusajs/framework/utils";
import CloudinaryFileService from "./service";

export default Module("cloudinary", {
  service: CloudinaryFileService,
});
