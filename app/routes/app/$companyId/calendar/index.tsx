import CalendarPage from "~/components/app/calendar";
import { getCalendarEvents } from "~/data/calendar.server";

export async function loader({ params }: { params: any }) {
  try {
    const { companyId }: any = params;
    return await getCalendarEvents(companyId);
  } catch (error) {
    console.error("Error loading calendar events:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return {
      events: [],
      error: errorMessage,
    };
  }
}

export default function Route() {
  return <CalendarPage />;
}
