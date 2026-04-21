import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import type { INotificationModuleService } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";

/**
 * POST /store/custom/debug-email?to=someone@example.com
 *
 * Smoke test providera powiadomień — wysyła prostego maila przez
 * zarejestrowany moduł notification. Chronimy sekretem w nagłówku
 * `x-debug-token` równym `LUMINE_DEBUG_TOKEN` z env. W produkcji
 * rekomendowane: odpiąć po zakończonej weryfikacji.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const token = process.env.LUMINE_DEBUG_TOKEN;
  const provided = req.headers["x-debug-token"];
  if (!token || provided !== token) {
    return res.status(404).json({ message: "Not found" });
  }

  const to = (req.query.to as string) || "lumine.strona@gmail.com";

  let notificationService: INotificationModuleService;
  try {
    notificationService = req.scope.resolve(Modules.NOTIFICATION);
  } catch (e) {
    return res.status(500).json({
      ok: false,
      step: "resolve",
      error: e instanceof Error ? e.message : String(e),
    });
  }

  try {
    const result = await notificationService.createNotifications({
      to,
      channel: "email",
      template: "debug-smoke-test",
      content: {
        subject: "Lumine debug smoke test",
        html: `<p>Smoke test wysłany o ${new Date().toISOString()}</p>`,
        text: `Smoke test wysłany o ${new Date().toISOString()}`,
      },
    });
    return res.status(200).json({ ok: true, result });
  } catch (e) {
    return res.status(500).json({
      ok: false,
      step: "send",
      error: e instanceof Error ? e.message : String(e),
      stack: e instanceof Error ? e.stack : undefined,
    });
  }
}
