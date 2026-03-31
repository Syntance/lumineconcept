import { AbstractFileProviderService } from "@medusajs/framework/utils";
import type { FileTypes, Logger } from "@medusajs/framework/types";
import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";

type InjectedDependencies = {
  logger: Logger;
};

interface CloudinaryOptions {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  folder?: string;
}

export default class CloudinaryFileService extends AbstractFileProviderService {
  static identifier = "cloudinary";

  protected logger_: Logger;
  protected options_: CloudinaryOptions;

  constructor(
    { logger }: InjectedDependencies,
    options: CloudinaryOptions,
  ) {
    super();
    this.logger_ = logger;
    this.options_ = options;

    cloudinary.config({
      cloud_name: options.cloudName,
      api_key: options.apiKey,
      api_secret: options.apiSecret,
      secure: true,
    });
  }

  static validateOptions(options: Record<string, unknown>) {
    if (!options.cloudName || !options.apiKey || !options.apiSecret) {
      console.warn(
        "[Cloudinary] Missing credentials — uploads will fail until CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET are set.",
      );
    }
  }

  async upload(
    file: FileTypes.ProviderUploadFileDTO,
  ): Promise<FileTypes.ProviderFileResultDTO> {
    const folder = this.options_.folder ?? "lumine-products";

    const result: UploadApiResponse = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        `data:${file.mimeType};base64,${file.content}`,
        {
          folder,
          public_id: file.filename.replace(/\.[^.]+$/, ""),
          unique_filename: true,
          resource_type: "image",
          transformation: [{ quality: "auto", fetch_format: "auto" }],
        },
        (error, result) => {
          if (error || !result) return reject(error);
          resolve(result);
        },
      );
    });

    this.logger_.info(
      `Cloudinary upload: ${result.public_id} → ${result.secure_url}`,
    );

    return {
      url: result.secure_url,
      key: result.public_id,
    };
  }

  async delete(
    files:
      | FileTypes.ProviderDeleteFileDTO
      | FileTypes.ProviderDeleteFileDTO[],
  ): Promise<void> {
    const fileArray = Array.isArray(files) ? files : [files];
    for (const file of fileArray) {
      try {
        await cloudinary.uploader.destroy(file.fileKey);
        this.logger_.info(`Cloudinary delete: ${file.fileKey}`);
      } catch (err) {
        this.logger_.warn(`Cloudinary delete failed for ${file.fileKey}: ${err}`);
      }
    }
  }

  async getPresignedDownloadUrl(
    fileData: FileTypes.ProviderGetFileDTO,
  ): Promise<string> {
    return cloudinary.url(fileData.fileKey, {
      secure: true,
      sign_url: true,
      type: "authenticated",
    });
  }
}
