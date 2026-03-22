const MAILERLITE_API_KEY = process.env.MAILERLITE_API_KEY ?? "";
const MAILERLITE_GROUP_ID = process.env.MAILERLITE_GROUP_ID ?? "";

export async function subscribeToNewsletter(
  email: string,
  fields?: { name?: string; last_name?: string },
): Promise<{ success: boolean; message: string }> {
  if (!MAILERLITE_API_KEY) {
    return { success: false, message: "MailerLite nie jest skonfigurowany" };
  }

  try {
    const response = await fetch(
      "https://connect.mailerlite.com/api/subscribers",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${MAILERLITE_API_KEY}`,
        },
        body: JSON.stringify({
          email,
          fields: fields ?? {},
          groups: MAILERLITE_GROUP_ID ? [MAILERLITE_GROUP_ID] : [],
          status: "active",
        }),
      },
    );

    if (!response.ok) {
      const error = (await response.json()) as { message?: string };
      return {
        success: false,
        message: error.message ?? "Błąd zapisu do newslettera",
      };
    }

    return { success: true, message: "Zapisano do newslettera!" };
  } catch {
    return { success: false, message: "Wystąpił błąd. Spróbuj ponownie." };
  }
}
