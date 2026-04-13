import { AbstractFileProviderService } from "@medusajs/framework/utils";
import type { FileTypes, Logger } from "@medusajs/framework/types";
import { v2 as cloudinary } from "cloudinary";

type InjectedDependencies = {
  logger: Logger;
};

type Options = {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  folder?: string;
};

export default class CloudinaryFileProviderService extends AbstractFileProviderService {
  static identifier = "cloudinary";

  protected logger_: Logger;
  protected options_: Options;

  constructor({ logger }: InjectedDependencies, options: Options) {
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

  async upload(
    file: FileTypes.ProviderUploadFileDTO,
  ): Promise<FileTypes.ProviderFileResultDTO> {
    const content = file.content ?? "";
    const base64 = content.startsWith("data:")
      ? content
      : `data:${file.mimeType};base64,${content}`;

    const isHeic =
      file.mimeType === "image/heic" ||
      file.mimeType === "image/heif" ||
      /\.hei[cf]$/i.test(file.filename || "");

    const result = await cloudinary.uploader.upload(base64, {
      folder: this.options_.folder ?? "lumine-products",
      use_filename: true,
      unique_filename: true,
      resource_type: "auto",
      ...(isHeic ? { format: "jpg" } : {}),
    });

    this.logger_.info(
      `Cloudinary: uploaded ${result.public_id} (${result.bytes} bytes)`,
    );

    return {
      url: result.secure_url,
      key: result.public_id,
    };
  }

  async delete(
    files: FileTypes.ProviderDeleteFileDTO | FileTypes.ProviderDeleteFileDTO[],
  ): Promise<void> {
    const fileArray = Array.isArray(files) ? files : [files];
    for (const file of fileArray) {
      await cloudinary.uploader.destroy(file.fileKey);
      this.logger_.info(`Cloudinary: deleted ${file.fileKey}`);
    }
  }

  async getPresignedDownloadUrl(
    fileData: FileTypes.ProviderGetFileDTO,
  ): Promise<string> {
    return cloudinary.url(fileData.fileKey, {
      secure: true,
    });
  }
}
