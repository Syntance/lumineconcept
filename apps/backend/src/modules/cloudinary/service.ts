import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";

interface CloudinaryOptions {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

export default class CloudinaryFileService {
  static identifier = "cloudinary";

  constructor(_container: Record<string, unknown>, options: CloudinaryOptions) {
    cloudinary.config({
      cloud_name: options.cloudName,
      api_key: options.apiKey,
      api_secret: options.apiSecret,
      secure: true,
    });
  }

  async upload(file: {
    path: string;
    originalname: string;
  }): Promise<{ url: string; key: string }> {
    const result: UploadApiResponse = await cloudinary.uploader.upload(file.path, {
      folder: "lumine-products",
      use_filename: true,
      unique_filename: true,
      resource_type: "image",
      transformation: [{ quality: "auto", fetch_format: "auto" }],
    });

    return {
      url: result.secure_url,
      key: result.public_id,
    };
  }

  async delete(fileKey: string): Promise<void> {
    await cloudinary.uploader.destroy(fileKey);
  }

  getUrl(publicId: string, options?: { width?: number; height?: number }): string {
    return cloudinary.url(publicId, {
      fetch_format: "auto",
      quality: "auto",
      width: options?.width,
      height: options?.height,
      crop: options?.width || options?.height ? "fill" : undefined,
      secure: true,
    });
  }
}
