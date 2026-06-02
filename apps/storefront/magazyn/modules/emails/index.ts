/** Publiczne API modułu maili. */
export { EmailEditor } from "./email-editor";
export { default as MailePage, dynamic as mailePageDynamic } from "./page";
export {
	getAllEmailTemplates,
	saveEmailTemplate,
	resetEmailTemplate,
	getEmailTemplateForSend,
} from "./store";
export { sendOrderStageEmail } from "./send-order-email";
export { sendTransactionalEmail } from "./send-transactional";
export {
	renderTemplate,
	buildOrderRenderContext,
	sampleRenderContext,
	mergeSubject,
	type OrderRenderSource,
	type EmailRenderContext,
	type EmailRenderItem,
} from "./render-template";
export {
	buildDefaultTemplate,
	EMAIL_TEMPLATE_TYPES,
	MERGE_VARIABLES,
	type EmailTemplate,
	type EmailTemplateType,
} from "./template-types";
