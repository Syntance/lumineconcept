import CloudinaryFileService from "./service";
import { ModuleProvider, Modules } from "@medusajs/framework/utils";

export default ModuleProvider(Modules.FILE, {
  services: [CloudinaryFileService],
});
