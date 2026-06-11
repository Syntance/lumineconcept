/** Publiczne API modułu maili. */
export { EmailEditor } from "./email-editor";
export { default as MailePage, dynamic as mailePageDynamic } from "./page";
export {
	getAllEmailTemplates,
	saveEmailTemplate,
	resetEmailTemplate,
	getEmailTemplateForSend,
	isEmailTemplateEnabledForSend,
	setEmailTemplateEnabled,
} from "./store";
export { sendOrderStageEmail } from "./send-order-email";
export { sendContactConfirmationEmail } from "./send-contact-confirmation";
export { sendContactNotificationEmail } from "./send-contact-notification";
export { sendShopOrderNotificationEmail } from "./send-shop-order-notification";
export { sendBankTransferPendingEmail } from "./send-bank-transfer-email";
export { createContactCaseNumber } from "./contact-email-context";
export { sendTransactionalEmail } from "./send-transactional";
export {
	renderTemplate,
	buildOrderRenderContext,
	sampleRenderContext,
	sampleRenderContextForTemplate,
	mergeSubject,
	type OrderRenderSource,
	type EmailRenderContext,
	type EmailRenderItem,
} from "./render-template";
export {
	buildDefaultTemplate,
	EMAIL_TEMPLATE_TYPES,
	EMAIL_TEMPLATE_CATEGORIES,
	getMergeVariablesForTemplate,
	MERGE_VARIABLES,
	type EmailTemplate,
	type EmailTemplateType,
	type ContactFormPreset,
} from "./template-types";
