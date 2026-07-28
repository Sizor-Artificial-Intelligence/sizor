// Enviar mensaje a Instagram
export async function sendInstagramMessage(
  plan: any,
  recipientId: string,
  message: string,
  imageUrl?: string
) {
  try {
    const accessToken = plan.API_TOKEN_INSTAGRAM;
    if (!accessToken) {
      return { success: false, error: "Instagram access token not configured" };
    }

    // Construir el cuerpo del mensaje
    let messageBody: any = {
      recipient: { id: recipientId },
      messaging_type: "RESPONSE",
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
      `https://graph.instagram.com/v22.0/me/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messageBody),
      }
    );

    const data = await response.json();

    if (response.ok) {
      return { success: true, data };
    } else {
      console.error("Instagram API error:", data);
      return {
        success: false,
        error: data.error?.message || "Failed to send message",
      };
    }
  } catch (error) {
    console.error("Error sending Instagram message:", error);
    return { success: false, error: "Network error" };
  }
}
