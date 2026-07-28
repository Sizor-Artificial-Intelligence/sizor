// Enviar mensaje a Facebook
export async function sendFacebookMessage(
  plan: any,
  recipientId: string,
  message: string,
  imageUrl?: string
) {
  try {
    const accessToken = plan.API_TOKEN_FACEBOOK;
    if (!accessToken) {
      return { success: false, error: "Facebook access token not configured" };
    }

    // Construir el cuerpo del mensaje
    let messageBody: any = {
      recipient: { id: recipientId },
      access_token: accessToken,
    };

    // Si hay una imagen, enviar como attachment
    if (imageUrl) {
      // La URL ya viene completa desde Firebase Storage
      messageBody.message = {
        attachment: {
          type: "image",
          payload: {
            url: imageUrl,
            is_reusable: true,
          },
        },
      };
    } else {
      // Si no hay imagen, enviar como texto
      messageBody.message = { text: message };
    }

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${plan.ACCOUNT_ID_FACEBOOK}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messageBody),
      }
    );

    const data = await response.json();

    if (response.ok) {
      return { success: true, data };
    } else {
      console.error("Facebook API error:", data);
      return {
        success: false,
        error: data.error?.message || "Failed to send message",
      };
    }
  } catch (error) {
    console.error("Error sending Facebook message:", error);
    return { success: false, error: "Network error" };
  }
}
