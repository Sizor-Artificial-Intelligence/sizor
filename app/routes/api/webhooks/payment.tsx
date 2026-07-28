import type { ActionFunctionArgs } from "react-router";
import { processPayment } from "~/data/payment.server";
import { getFormDataRequest } from "~/lib/utils.functions";

export async function action({ request }: ActionFunctionArgs) {
  const formData: any = await getFormDataRequest(request);
  try {
    return await processPayment(formData);
  } catch (error) {
    console.log(error);
    return Response.json(
      {
        success: false,
        error: "Error al procesar el pago",
        message:
          "Ocurrió un error al procesar tu pago. Por favor, intenta nuevamente.",
      },
      { status: 500 }
    );
  }
}
