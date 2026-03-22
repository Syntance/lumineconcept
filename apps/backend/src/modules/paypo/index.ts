import { Module } from "@medusajs/framework/utils";
import PayPoPaymentService from "./service";

export default Module("paypo", {
  service: PayPoPaymentService,
});
