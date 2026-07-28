import { memo } from "react";
import type { Contact } from "~/types/schema";

const ContactAvatar = memo(function ContactAvatar({
  contact,
  size = "w-10 h-10 text-sm",
}: {
  contact: Contact;
  size?: string;
}) {
  const getAvatarColor = (contactId: string) => {
    const colors = [
      "bg-gradient-to-br from-blue-500 to-blue-600",
      "bg-gradient-to-br from-green-500 to-green-600",
      "bg-gradient-to-br from-purple-500 to-purple-600",
      "bg-gradient-to-br from-pink-500 to-pink-600",
      "bg-gradient-to-br from-orange-500 to-orange-600",
      "bg-gradient-to-br from-indigo-500 to-indigo-600",
      "bg-gradient-to-br from-teal-500 to-teal-600",
    ];
    let hash = 0;
    for (let i = 0; i < contactId.length; i++) {
      hash = ((hash << 5) - hash + contactId.charCodeAt(i)) & 0xffffffff;
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <>
      {contact?.avatar ? (
        <img src="" alt="" />
      ) : (
        <div
          className={`${size} rounded-full ${getAvatarColor(
            contact?.id || "default"
          )} flex items-center justify-center text-white font-medium mr-3 shadow-sm transition-all duration-200 group-hover:scale-105`}
        >
          {contact?.name
            ?.split(" ")
            ?.map((n: any) => n[0])
            ?.slice(0, 2)
            ?.join("")}
        </div>
      )}
    </>
  );
});

export default ContactAvatar;
