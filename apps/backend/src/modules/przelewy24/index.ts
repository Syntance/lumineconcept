import { Module } from "@medusajs/framework/utils";
import Przelewy24PaymentService from "./service";

export default Module("przelewy24", {
  service: Przelewy24PaymentService,
});
