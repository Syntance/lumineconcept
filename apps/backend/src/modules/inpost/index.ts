import { Module } from "@medusajs/framework/utils";
import InPostFulfillmentService from "./service";

export default Module("inpost", {
  service: InPostFulfillmentService,
});
