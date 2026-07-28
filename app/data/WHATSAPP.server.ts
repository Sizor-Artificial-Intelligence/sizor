// Enviar mensaje a WhatsApp
export async function sendWhatsappMessage(
  plan: any,
  recipientId: string,
  message: string,
  imageUrl?: string
) {
  try {
    const accessToken = plan.API_TOKEN_WHATSAPP;
    if (!accessToken) {
      return { success: false, error: "WhatsApp access token not configured" };
    }

    const phoneNumberId = plan.ACCOUNT_ID_WHATSAPP;
    if (!phoneNumberId) {
      return {
        success: false,
        error: "WhatsApp phone number ID not configured",
      };
    }

    // Construir el cuerpo del mensaje
    let messageBody: any = {
      messaging_product: "whatsapp",
      to: recipientId,
    };

    // Si hay una imagen, enviar como imagen
    if (imageUrl) {
      messageBody.type = "image";
      messageBody.image = {
        link: imageUrl,
      };
    } else {
      // Si no hay imagen, enviar como texto
      messageBody.type = "text";
      messageBody.text = {
        body: message,
      };
    }

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(messageBody),
      }
    );

    const data = await response.json();

    if (response.ok) {
      return { success: true, data };
    } else {
      console.error("WhatsApp API error:", data);
      return {
        success: false,
        error: data.error?.message || "Failed to send message",
      };
    }
  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
    return { success: false, error: "Network error" };
  }
}
