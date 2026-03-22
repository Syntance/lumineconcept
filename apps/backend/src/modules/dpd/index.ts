import { Module } from "@medusajs/framework/utils";
import DpdFulfillmentService from "./service";

export default Module("dpd", {
  service: DpdFulfillmentService,
});
