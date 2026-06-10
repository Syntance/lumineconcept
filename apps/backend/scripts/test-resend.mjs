import { Resend } from "resend";

const key = process.env.RESEND_API_KEY?.trim();
const from =
  process.env.RESEND_FROM?.trim() ??
  "Lumine Concept <kontakt@lumineconcept.pl>";
const to = process.argv[2]?.trim() ?? "lumine.strona@gmail.com";

if (!key) {
  console.error("RESEND_API_KEY missing");
  process.exit(1);
}

const resend = new Resend(key);
const { data, error } = await resend.emails.send({
  from,
  to,
  replyTo: process.env.RESEND_REPLY_TO?.trim() ?? "kontakt@lumineconcept.pl",
  subject: `Test Resend Lumine ${new Date().toISOString()}`,
  text: "Diagnostyka wysyłki — jeśli widzisz ten mail, Resend działa.",
  html: "<p>Diagnostyka wysyłki — jeśli widzisz ten mail, Resend działa.</p>",
});

if (error) {
  console.error("RESEND_ERROR", JSON.stringify(error, null, 2));
  process.exit(2);
}

console.log("RESEND_OK", JSON.stringify(data, null, 2));
