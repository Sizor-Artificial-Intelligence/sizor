import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  useLoaderData,
  useSearchParams,
  useParams,
  useSubmit,
  useNavigation,
  useNavigate,
  useLocation,
} from "react-router";
import ChatNavigation from "./ChatNavigation";
import ConversationsSidebar from "./ConversationsSidebar";
import ChatSection from "./ChatSection";
import AISidebar from "./AISidebar";
import UserAssignmentModal from "./UserAssignmentModal";
import AgentSelectionModal from "./AgentSelectionModal";
import ConnectSocialNetwork from "./ConnectSocialNetwork";
import { useCompany } from "~/hooks/useCompany";
import { useWebSocket } from "~/hooks/useWebSocket";
import { useTokens } from "~/contexts/TokensContext";
import { useMessages } from "~/contexts/MessagesContext";
import usePath from "~/hooks/usePath";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import useToast from "~/hooks/useToast";
import { executeSQL } from "~/lib/utils.functions";
import type { Chat, ChatMessage } from "~/types/app";
import type { User, Agent } from "~/types/schema";
import { getTimeAgo } from "~/lib/utils.functions";
import type { ChatFilters } from "./ChatFiltersModal";

export default function ChatPage() {
  const loaderData = useLoaderData<any>();
  const [searchParams] = useSearchParams();
  const submit = useSubmit();
  const navigation = useNavigation();
  const params = useParams();
  const company = useCompany();
  const contactId = params.contactId; // Obtener contactId de la URL
  const PATH = usePath();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery("(max-width: 767px)");
  const chatListPath = location.pathname.replace(/\/[^/]+$/, "") || PATH + "/chat";

  const [chat, setChat] = useState(loaderData?.chat);
  const contacts: Chat[] = useMemo(
    () => loaderData?.contacts || [],
    [loaderData?.contacts]
  );
  const messages: ChatMessage[] = useMemo(
    () => loaderData?.messages || [],
    [loaderData?.messages]
  );

  const [realTimeContacts, setRealTimeContacts] = useState<Chat[]>(contacts);
  const [realTimeMessages, setRealTimeMessages] =
    useState<ChatMessage[]>(messages);
  const [selectedChat, setSelectedChat] = useState<string | null>(
    contactId || null
  );
  const { realTimeTokens, updateTokens } = useTokens();
  const { setUnreadMessages } = useMessages();
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || ""
  );
  const isSearching =
    navigation.state === "loading" && searchQuery.trim() !== "";
  const [isAISidebarOpen, setIsAISidebarOpen] = useState(false);
  const [redToConnect, setRedToConnect] = useState<string | null>(null);

  // Estados para envío de mensajes
  const [messageInput, setMessageInput] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados para asignación de usuario
  const [showModalUser, setShowModalUser] = useState(false);
  const [assignedUser, setAssignedUser] = useState<User | null>(
    chat?.assignedUser || null
  );

  // Estados para IA
  const [aiResponseEnabled, setAiResponseEnabled] = useState(
    chat?.respondWithIa || false
  );
  const [loadingStatusIA, setLoadingStatusIA] = useState(false);
  const [showModalAgent, setShowModalAgent] = useState(false);
  const [agent, setAgent] = useState<Agent | null>(chat?.agent || null);

  const [chatFilters, setChatFilters] = useState<ChatFilters>(() => {
    const channelsParam = searchParams.get("channels");
    const assignmentType = searchParams.get("assignmentType") as
      | "all"
      | "my"
      | "specific"
      | null;
    const specificUsersParam = searchParams.get("specificUsers");

    return {
      channels: channelsParam ? channelsParam.split(",") : [],
      assignmentType: assignmentType || "all",
      specificUsers: specificUsersParam ? specificUsersParam.split(",") : [],
    };
  });

  // Detectar modo oscuro
  useEffect(() => {
    const darkModeMediaQuery = window.matchMedia(
      "(prefers-color-scheme: dark)"
    );
    setIsDarkMode(
      darkModeMediaQuery.matches ||
      document.documentElement.classList.contains("dark")
    );

    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  // Actualizar contactos en tiempo real cuando cambien
  useEffect(() => {
    setRealTimeContacts(contacts);
  }, [contacts]);

  // Mantener el chat actual sincronizado con la lista en tiempo real.
  // Esto asegura que cambios como el nombre del contacto se reflejen en el header/detalle.
  useEffect(() => {
    if (!selectedChat) return;

    const selectedFromList = realTimeContacts.find(
      (contact) => contact.id === selectedChat
    );
    if (!selectedFromList) return;

    setChat((prevChat: any) => {
      if (!prevChat || prevChat.id !== selectedChat) return prevChat;

      let changed = false;
      const nextChat: any = { ...prevChat };

      if (selectedFromList.name !== prevChat.name) {
        nextChat.name = selectedFromList.name;
        changed = true;
      }

      if (selectedFromList.lastName !== prevChat.lastName) {
        nextChat.lastName = selectedFromList.lastName;
        changed = true;
      }

      if (selectedFromList.avatar !== prevChat.avatar) {
        nextChat.avatar = selectedFromList.avatar;
        changed = true;
      }

      if (selectedFromList.origin !== prevChat.origin) {
        nextChat.origin = selectedFromList.origin;
        changed = true;
      }

      return changed ? nextChat : prevChat;
    });
  }, [realTimeContacts, selectedChat]);

  // Sincronizar el estado del chat con el loaderData cuando cambie
  useEffect(() => {
    if (loaderData?.chat) {
      setChat(loaderData.chat);
      setAssignedUser(loaderData.chat?.assignedUser || null);
      setAiResponseEnabled(loaderData.chat?.respondWithIa || false);
      setAgent(loaderData.chat?.agent || null);
    }
  }, [loaderData?.chat]);

  // Sincronizar mensajes cuando cambie el loaderData
  useEffect(() => {
    if (loaderData?.messages && contactId && selectedChat === contactId) {
      setRealTimeMessages(loaderData.messages);
    }
  }, [loaderData?.messages, contactId, selectedChat]);

  // Actualizar selectedChat cuando cambie el contactId de la URL
  useEffect(() => {
    setSelectedChat(contactId || null);

    // Resetear mensajes cuando cambie de chat
    if (contactId && loaderData?.messages) {
      setRealTimeMessages(loaderData.messages);
    } else if (!contactId) {
      setRealTimeMessages([]);
    }
  }, [contactId, loaderData?.messages]);

  // Realizar búsqueda en el backend con debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const formData = new FormData();
      if (searchQuery.trim()) {
        formData.set("search", searchQuery.trim());
      }

      // Agregar filtros de canales
      if (chatFilters.channels.length > 0) {
        formData.set("channels", chatFilters.channels.join(","));
      }

      // Agregar filtros de asignación
      if (chatFilters.assignmentType !== "all") {
        formData.set("assignmentType", chatFilters.assignmentType);
      }

      // Agregar usuarios específicos
      if (chatFilters.specificUsers.length > 0) {
        formData.set("specificUsers", chatFilters.specificUsers.join(","));
      }

      submit(formData, { method: "get", action: window.location.pathname });
    }, 500); // Esperar 500ms después de que el usuario deje de escribir

    return () => clearTimeout(timeoutId);
  }, [searchQuery, chatFilters, submit]);

  // Sincronizar el contador de mensajes no leídos con el contexto
  useEffect(() => {
    const totalUnread = realTimeContacts.reduce(
      (total, contact) => total + (contact.unreadCount || 0),
      0
    );
    setUnreadMessages(totalUnread);
  }, [realTimeContacts, setUnreadMessages]);

  // Inicializar tokens desde el plan de la empresa
  useEffect(() => {
    if (company?.plan) {
      updateTokens({
        tokensUsed: company.plan.tokensUsed,
        maxTokens: company.plan.maxTokens,
        isFree: company.plan.isFree,
      });
    }
  }, [company?.plan, updateTokens]);

  // Actualizar tiempo relativo de los contactos cada minuto
  useEffect(() => {
    const interval = setInterval(() => {
      setRealTimeContacts((prev) =>
        prev.map((contact) => ({
          ...contact,
          lastMessage: contact.lastMessage
            ? {
              ...contact.lastMessage,
              timeAgo: getTimeAgo(new Date(contact.lastMessage.createdAt)),
            }
            : null,
        }))
      );
    }, 60000); // Actualizar cada minuto

    return () => clearInterval(interval);
  }, []);

  // Manejar asignación de usuario
  const handleSelectUser = async (user: User | null) => {
    if (!selectedChat) return;

    setAssignedUser(user);

    try {
      await executeSQL(
        PATH,
        `UPDATE Contact SET assignedUserId = ${user?.id ? "'" + user?.id + "'" : "NULL"} WHERE id = '${selectedChat}'`
      );
      setShowModalUser(false);
    } catch (error) {
      console.error("Error asignando usuario:", error);
      useToast({
        icon: "error",
        title: "Error al asignar usuario",
      });
      // Revertir el cambio si falla
      setAssignedUser(chat?.assignedUser || null);
    }
  };

  // Manejar toggle de IA
  const handleToggleAI = async () => {
    if (!selectedChat) return;

    setLoadingStatusIA(true);
    try {
      const response = await executeSQL(
        PATH,
        `UPDATE Contact SET respondWithIa = ${aiResponseEnabled ? "0" : "1"} WHERE id = '${selectedChat}'`
      );

      if (response?.runScript) {
        setAiResponseEnabled(!aiResponseEnabled);
      }
    } catch (error) {
      console.error("Error toggling IA:", error);
      useToast({
        icon: "error",
        title: "Error al cambiar estado de IA",
      });
    } finally {
      setLoadingStatusIA(false);
    }
  };

  // Manejar selección de agente
  const handleSelectAgent = async (selectedAgent: Agent | null) => {
    if (!selectedChat) return;

    setAgent(selectedAgent);

    try {
      await executeSQL(
        PATH,
        `UPDATE Contact SET agentId = ${selectedAgent?.id ? "'" + selectedAgent?.id + "'" : "NULL"} WHERE id = '${selectedChat}'`
      );
      setShowModalAgent(false);
      useToast({
        icon: "success",
        title: "Agente seleccionado correctamente",
      });
    } catch (error) {
      console.error("Error asignando agente:", error);
      useToast({
        icon: "error",
        title: "Error al asignar agente",
      });
      // Revertir el cambio si falla
      setAgent(chat?.agent || null);
    }
  };

  // Manejar vaciar chat
  const handleClearChat = async () => {
    if (!selectedChat) return;

    try {
      const response = await fetch(`${PATH}/contacts/clear-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contactId: selectedChat,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Limpiar mensajes del estado local
        setRealTimeMessages([]);

        // Actualizar último mensaje en contactos
        setRealTimeContacts((prev) =>
          prev.map((contact) =>
            contact.id === selectedChat
              ? { ...contact, lastMessage: null }
              : contact
          )
        );

        useToast({
          icon: "success",
          title: "Chat vaciado correctamente",
        });
      } else {
        throw new Error(result.error || "Error al vaciar chat");
      }
    } catch (error) {
      console.error("Error vaciando chat:", error);
      useToast({
        icon: "error",
        title: "Error al vaciar chat",
      });
    }
  };

  // Manejar conexión de canal
  const handleConnectChannel = (channel: string) => {
    // Capitalizar primera letra para coincidir con el formato esperado
    const formattedChannel = channel.charAt(0).toUpperCase() + channel.slice(1);
    setRedToConnect(formattedChannel);
  };

  // Funciones de callback para WebSocket
  const handleNewMessage = useCallback(
    (contactId: string, message: any) => {
      // Agregar mensaje a la lista si estamos viendo este chat
      if (contactId === selectedChat) {
        setRealTimeMessages((prev) => {
          // Verificar si el mensaje ya existe para evitar duplicados
          const messageExists = prev.some((msg) => {
            // Si ambos tienen messageId, comparar por messageId (más confiable)
            if (msg.messageId && message.messageId) {
              return msg.messageId === message.messageId;
            }
            // Si no, comparar por id
            return msg.id === message.id;
          });

          if (messageExists) {
            return prev;
          }

          // Verificar si hay un mensaje optimista que necesita ser reemplazado
          const optimisticMessageIndex = prev.findIndex((msg) => {
            // Buscar mensaje optimista por contenido y sender
            return (
              msg.content === message.content &&
              msg.sender === message.sender &&
              msg.id.startsWith("temp_")
            );
          });

          if (optimisticMessageIndex !== -1) {
            // Reemplazar mensaje optimista con el real
            const newMessages = [...prev];
            newMessages[optimisticMessageIndex] = {
              ...message,
              timeAgo: getTimeAgo(new Date(message.createdAt)),
            };
            return newMessages;
          }

          // Verificación adicional: si es un mensaje nuestro muy reciente (últimos 5 segundos)
          // y no hay mensaje optimista, probablemente es un duplicado del WebSocket
          if (message.sender === "ME") {
            const messageTime = new Date(message.createdAt).getTime();
            const now = Date.now();
            const timeDiff = now - messageTime;

            if (timeDiff < 5000) {
              // 5 segundos
              // Verificar si hay algún mensaje con el mismo contenido muy reciente
              const hasRecentSimilarMessage = prev.some(
                (msg) =>
                  msg.content === message.content &&
                  msg.sender === "ME" &&
                  !msg.id.startsWith("temp_") && // No es optimista
                  Math.abs(new Date(msg.createdAt).getTime() - messageTime) <
                  10000 // 10 segundos de diferencia
              );

              if (hasRecentSimilarMessage) {
                return prev; // Es un duplicado
              }
            }
          }

          // Agregar el mensaje con timeAgo actualizado
          return [
            ...prev,
            {
              ...message,
              timeAgo: getTimeAgo(new Date(message.createdAt)),
            },
          ];
        });
      }

      // Actualizar contador de mensajes sin leer y último mensaje en contactos
      setRealTimeContacts((prev) =>
        prev.map((contact) =>
          contact.id === contactId
            ? {
              ...contact,
              unreadCount:
                message.sender === "THEM" && contactId !== selectedChat
                  ? contact.unreadCount + 1
                  : contact.unreadCount,
              lastMessage: {
                ...message,
                timeAgo: getTimeAgo(new Date(message.createdAt)),
              },
            }
            : contact
        )
      );
    },
    [selectedChat]
  );

  const handleContactsUpdate = useCallback((updatedContacts: any[]) => {
    setRealTimeContacts((prevContacts) => {
      const updatedContactsMap = new Map();

      // Crear un mapa de los contactos actualizados
      updatedContacts.forEach((contact) => {
        const contactWithUpdatedTime = {
          ...contact,
          lastMessage: contact.lastMessage
            ? {
              ...contact.lastMessage,
              timeAgo: getTimeAgo(new Date(contact.lastMessage.createdAt)),
            }
            : null,
        };
        updatedContactsMap.set(contact.id, contactWithUpdatedTime);
      });

      // Actualizar solo los contactos que cambiaron
      const updatedList = prevContacts.map((existingContact) => {
        const updatedContact = updatedContactsMap.get(existingContact.id);
        if (updatedContact) {
          return updatedContact;
        }
        return existingContact;
      });

      // Reordenar la lista para que los contactos con mensajes más recientes aparezcan primero
      return updatedList.sort((a, b) => {
        if (!a.lastMessage && !b.lastMessage) return 0;
        if (!a.lastMessage) return 1;
        if (!b.lastMessage) return -1;
        return (
          new Date(b.lastMessage.createdAt).getTime() -
          new Date(a.lastMessage.createdAt).getTime()
        );
      });
    });
  }, []);

  const handleNewContact = useCallback((newContact: any) => {
    // Agregar el nuevo contacto a la lista
    setRealTimeContacts((prevContacts) => {
      // Verificar si el contacto ya existe para evitar duplicados
      const contactExists = prevContacts.some(
        (contact) => contact.id === newContact.id
      );

      if (contactExists) {
        return prevContacts;
      }

      // El newContact ya viene con la estructura completa del chat
      const contactWithUpdatedTime = {
        ...newContact,
        lastMessage: newContact.lastMessage
          ? {
            ...newContact.lastMessage,
            timeAgo: getTimeAgo(new Date(newContact.lastMessage.createdAt)),
          }
          : null,
      };

      // Agregar el nuevo contacto al principio de la lista
      return [contactWithUpdatedTime, ...prevContacts];
    });
  }, []);

  const handleTokensUpdate = useCallback(
    (tokensData: {
      tokensUsed: number;
      maxTokens: number;
      isFree: boolean;
    }) => {
      updateTokens(tokensData);
    },
    [updateTokens]
  );

  const handleMessageRead = useCallback(
    (contactId: string, messageIds: string[]) => {
      // Actualizar contador de mensajes sin leer
      setRealTimeContacts((prev) =>
        prev.map((contact) =>
          contact.id === contactId
            ? {
              ...contact,
              unreadCount: Math.max(
                0,
                contact.unreadCount - messageIds.length
              ),
            }
            : contact
        )
      );
    },
    []
  );

  const handleReactionUpdate = useCallback(
    (contactId: string, messageId: string, reaction: any) => {
      // Solo aplicar al chat actualmente abierto
      if (selectedChat && contactId !== selectedChat) return;

      setRealTimeMessages((prev) =>
        prev.map((msg) => {
          const matchesMessage =
            msg.id === messageId || msg.messageId === messageId;
          if (!matchesMessage) return msg;

          const currentReactions = Array.isArray(msg.reactions)
            ? msg.reactions
            : [];

          const reactionId =
            typeof reaction?.id === "string" ? reaction.id : undefined;
          const emoji =
            typeof reaction?.emoji === "string" ? reaction.emoji : undefined;
          const senderId =
            typeof reaction?.senderId === "string"
              ? reaction.senderId
              : undefined;
          const actionRaw =
            typeof reaction?.action === "string" ? reaction.action : "react";
          const action = actionRaw.toLowerCase();

          const idx = currentReactions.findIndex((r: any) => {
            if (reactionId && typeof r?.id === "string" && r.id === reactionId) {
              return true;
            }
            return r?.emoji === emoji && r?.senderId === senderId;
          });

          // Si es "unreact" y no existía en el estado, no hacemos nada.
          if (action === "unreact" && idx === -1) return msg;

          // Upsert de reacción en el arreglo.
          const nextReactions = [...currentReactions];
          if (idx === -1) {
            nextReactions.push(reaction);
          } else {
            nextReactions[idx] = { ...nextReactions[idx], ...reaction };
          }

          return { ...msg, reactions: nextReactions };
        })
      );
    },
    [selectedChat]
  );

  const handleChatAssignmentUpdate = useCallback(
    (
      contactId: string,
      assignedUserId: string | null,
      assignedUserName: string | null,
      assignedUser: User | null,
      reason: string
    ) => {
      // Actualizar la asignación en la lista de contactos
      setRealTimeContacts((prev) =>
        prev.map((contact) =>
          contact.id === contactId ? { ...contact, assignedUserId } : contact
        )
      );

      // Si es el chat abierto, sincronizar también el header/detalle
      if (contactId === selectedChat) {
        setAssignedUser(assignedUser || null);
      }
    },
    [selectedChat]
  );

  const handleSystemMessage = useCallback((contactId: string, message: any) => {
    // Actualizar último mensaje en contactos
    setRealTimeContacts((prev) =>
      prev.map((contact) =>
        contact.id === contactId
          ? {
            ...contact,
            lastMessage: {
              ...message,
              timeAgo: getTimeAgo(new Date(message.createdAt)),
            },
          }
          : contact
      )
    );
  }, []);

  // Reenviar mensaje fallido
  const handleRetryMessage = async (message: ChatMessage) => {
    if (!selectedChat || !company?.id) return;

    try {
      // Marcar mensaje como enviando
      setRealTimeMessages((prev) =>
        prev.map((msg) =>
          msg.id === message.id ? { ...msg, status: "SENDING" } : msg
        )
      );

      // Determinar si tiene imagen
      const hasImage = message.type === "IMAGE" && message.attachments;
      let imageUrl: string | undefined;

      if (hasImage) {
        try {
          const parsedAttachments = JSON.parse(message.attachments || "[]");
          if (
            parsedAttachments.length > 0 &&
            parsedAttachments[0].payload?.url
          ) {
            imageUrl = parsedAttachments[0].payload.url;
          }
        } catch (error) {
          console.error("Error parsing attachments:", error);
        }
      }

      // Enviar mensaje
      const response = await fetch(`${PATH}/contacts/send-message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyId: company?.id,
          contactId: selectedChat,
          message: message.content,
          messageType: message.type,
          imageUrl: imageUrl,
          isResend: true,
          messageId: message?.id,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Eliminar mensaje fallido del estado
        setRealTimeMessages((prev) =>
          prev.filter((msg) => msg.id !== message.id)
        );
      } else {
        // Marcar como fallido nuevamente
        setRealTimeMessages((prev) =>
          prev.map((msg) =>
            msg.id === message.id ? { ...msg, status: "FAILED" } : msg
          )
        );
      }
    } catch (error) {
      console.error("Error retrying message:", error);
      // Marcar como fallido
      setRealTimeMessages((prev) =>
        prev.map((msg) =>
          msg.id === message.id ? { ...msg, status: "FAILED" } : msg
        )
      );
    }
  };

  // Manejar selección de imagen
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    const validTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!validTypes.includes(file.type)) {
      useToast({
        icon: "error",
        title: "Por favor, selecciona una imagen válida (JPEG o PNG)",
      });
      return;
    }

    // Validar tamaño (máx 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      useToast({ icon: "error", title: "La imagen no puede superar los 5MB" });
      return;
    }

    setSelectedImage(file);

    // Crear URL de previsualización
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Limpiar el input file
    if (e.target) {
      e.target.value = "";
    }
  };

  // Cancelar imagen seleccionada
  const handleCancelImage = () => {
    setSelectedImage(null);
    setImagePreviewUrl(null);
  };

  // Abrir selector de archivos
  const handleAttachmentClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Enviar mensaje
  const handleSendMessage = async () => {
    if (
      (messageInput.trim() || selectedImage) &&
      selectedChat &&
      company?.id &&
      !isSendingMessage
    ) {
      const messageText = messageInput.trim();
      const imageToSend = selectedImage;

      setMessageInput(""); // Limpiar el input
      setSelectedImage(null);
      setImagePreviewUrl(null);
      setIsSendingMessage(true);

      try {
        let uploadedImageUrl: string | undefined;

        // Si hay imagen, subirla
        if (imageToSend) {
          setIsUploadingImage(true);
          const formData = new FormData();
          formData.append("image", imageToSend);

          const uploadResponse = await fetch("/api/upload-image", {
            method: "POST",
            body: formData,
          });

          const uploadResult = await uploadResponse.json();

          if (uploadResult.success) {
            uploadedImageUrl = uploadResult.url;
          } else {
            useToast({
              icon: "error",
              title: "Error al subir la imagen: " + uploadResult.error,
            });
            setIsSendingMessage(false);
            setIsUploadingImage(false);
            setSelectedImage(imageToSend);
            return;
          }
          setIsUploadingImage(false);
        }

        // Verificar si es una plataforma Meta (Facebook/Instagram) y hay tanto texto como imagen
        const isMetaPlatform =
          chat?.origin === "Facebook" || chat?.origin === "Instagram";
        const hasBothTextAndImage = messageText && uploadedImageUrl;

        if (isMetaPlatform && hasBothTextAndImage && uploadedImageUrl) {
          // Para Meta, enviar mensajes separados
          await sendSeparateMessages(messageText, uploadedImageUrl);
        } else {
          // Para otras plataformas o cuando solo hay texto o imagen, enviar normalmente
          await sendSingleMessage(messageText, uploadedImageUrl);
        }
      } catch (error) {
        useToast({ icon: "error", title: "Error al enviar mensaje" });
      } finally {
        setIsSendingMessage(false);
        setIsUploadingImage(false);
      }
    }
  };

  // Enviar mensajes separados para Meta
  const sendSeparateMessages = async (
    messageText: string,
    imageUrl: string
  ) => {
    try {
      // Crear mensajes optimistas
      const textMessageId = `temp_text_${Date.now()}`;
      const imageMessageId = `temp_image_${Date.now() + 1}`;

      const optimisticTextMessage: any = {
        id: textMessageId,
        content: messageText,
        sender: "ME",
        senderId: "temp",
        timestamp: Date.now().toString(),
        messageId: textMessageId,
        status: "SENDING",
        type: "TEXT",
        attachments: null,
        createdAt: new Date(),
        timeAgo: "Enviando...",
      };

      const optimisticImageMessage: any = {
        id: imageMessageId,
        content: "",
        sender: "ME",
        senderId: "temp",
        timestamp: (Date.now() + 1).toString(),
        messageId: imageMessageId,
        status: "SENDING",
        type: "IMAGE",
        attachments: JSON.stringify([
          {
            type: "image",
            payload: {
              url: imageUrl,
            },
          },
        ]),
        createdAt: new Date(Date.now() + 1),
        timeAgo: "Enviando...",
      };

      // Agregar mensajes optimistas
      setRealTimeMessages((prev) => [
        ...prev,
        optimisticTextMessage,
        optimisticImageMessage,
      ]);

      // Enviar mensaje de texto primero
      const textResponse = await fetch(`${PATH}/contacts/send-message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyId: company?.id,
          contactId: selectedChat,
          message: messageText,
          messageType: "TEXT",
          imageUrl: null,
        }),
      });

      const textResult = await textResponse.json();

      // Actualizar mensaje de texto
      if (textResult.success) {
        setRealTimeMessages((prev) =>
          prev.map((msg) =>
            msg.id === textMessageId
              ? {
                ...textResult.message,
                timeAgo: getTimeAgo(new Date(textResult.message.createdAt)),
              }
              : msg
          )
        );
      } else {
        // Marcar mensaje de texto como fallido
        setRealTimeMessages((prev) =>
          prev.map((msg) =>
            msg.id === textMessageId ? { ...msg, status: "FAILED" } : msg
          )
        );
      }

      // Enviar mensaje de imagen
      const imageResponse = await fetch(`${PATH}/contacts/send-message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyId: company?.id,
          contactId: selectedChat,
          message: "",
          messageType: "IMAGE",
          imageUrl: imageUrl,
        }),
      });

      const imageResult = await imageResponse.json();

      // Actualizar mensaje de imagen
      if (imageResult.success) {
        setRealTimeMessages((prev) =>
          prev.map((msg) =>
            msg.id === imageMessageId
              ? {
                ...imageResult.message,
                timeAgo: getTimeAgo(new Date(imageResult.message.createdAt)),
              }
              : msg
          )
        );
      } else {
        // Marcar mensaje de imagen como fallido
        setRealTimeMessages((prev) =>
          prev.map((msg) =>
            msg.id === imageMessageId ? { ...msg, status: "FAILED" } : msg
          )
        );
        useToast({
          icon: "error",
          title: "Error al enviar imagen: " + imageResult.error,
        });
      }
    } catch (error) {
      console.error("Error sending separate messages:", error);
      useToast({ icon: "error", title: "Error al enviar mensajes" });
    }
  };

  // Enviar mensaje único
  const sendSingleMessage = async (messageText: string, imageUrl?: string) => {
    try {
      // Crear mensaje optimista
      const optimisticMessage: any = {
        id: `temp_${Date.now()}`,
        content: messageText,
        sender: "ME",
        senderId: "temp",
        timestamp: Date.now().toString(),
        messageId: `temp_${Date.now()}`,
        status: "SENDING",
        type: imageUrl ? "IMAGE" : "TEXT",
        attachments: imageUrl
          ? JSON.stringify([
            {
              type: "image",
              payload: {
                url: imageUrl,
              },
            },
          ])
          : null,
        createdAt: new Date(),
        timeAgo: "Enviando...",
      };

      setRealTimeMessages((prev) => [...prev, optimisticMessage]);

      // Enviar mensaje
      const response = await fetch(`${PATH}/contacts/send-message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyId: company?.id,
          contactId: selectedChat,
          message: messageText,
          messageType: imageUrl ? "IMAGE" : "TEXT",
          imageUrl: imageUrl,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Reemplazar mensaje optimista con el mensaje real
        setRealTimeMessages((prev) =>
          prev.map((msg) =>
            msg.id === optimisticMessage.id
              ? {
                ...result.message,
                timeAgo: getTimeAgo(new Date(result.message.createdAt)),
              }
              : msg
          )
        );
      } else {
        // Marcar mensaje como fallido
        setRealTimeMessages((prev) =>
          prev.map((msg) =>
            msg.id === optimisticMessage.id ? { ...msg, status: "FAILED" } : msg
          )
        );
        useToast({
          icon: "error",
          title: "Error al enviar mensaje: " + result.error,
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      useToast({ icon: "error", title: "Error al enviar mensaje" });
    }
  };

  // Handler para actualización de análisis de sentimiento
  const handleSentimentAnalysisUpdate = useCallback(
    (data: {
      contactId: string;
      sentiment: string;
      leadTemperature: string;
      confidence: number;
    }) => {
      // Actualizar el chat actual si es el mismo contacto
      if (data.contactId === selectedChat) {
        setChat((prevChat: any) => {
          if (!prevChat) return prevChat;
          return {
            ...prevChat,
            sentiment: data.sentiment as
              | "neutral"
              | "happy"
              | "sad"
              | "frustrated"
              | "angry"
              | "calm"
              | null,
            leadTemperature: data.leadTemperature as
              | "cold"
              | "warm"
              | "hot"
              | null,
          };
        });
      }

      // Actualizar en la lista de contactos también
      setRealTimeContacts((prevContacts) =>
        prevContacts.map((contact) =>
          contact.id === data.contactId
            ? {
              ...contact,
              contact: contact.contact
                ? {
                  ...contact.contact,
                  sentiment: data.sentiment as
                    | "neutral"
                    | "happy"
                    | "sad"
                    | "frustrated"
                    | "angry"
                    | "calm"
                    | null,
                  leadTemperature: data.leadTemperature as
                    | "cold"
                    | "warm"
                    | "hot"
                    | null,
                }
                : contact.contact,
            }
            : contact
        )
      );
    },
    [selectedChat]
  );

  // WebSocket para tiempo real
  const { isConnected, connectionStatus } = useWebSocket({
    onNewMessage: handleNewMessage,
    onMessageRead: handleMessageRead,
    onContactsUpdate: handleContactsUpdate,
    onNewContact: handleNewContact,
    onReactionUpdate: handleReactionUpdate,
    onTokensUpdate: handleTokensUpdate,
    onChatAssignmentUpdate: handleChatAssignmentUpdate,
    onSystemMessage: handleSystemMessage,
    onSentimentAnalysisUpdate: handleSentimentAnalysisUpdate,
  });

  return (
    <div
      style={{ zIndex: 1000 }}
      className="fixed inset-0 bg-background-light dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex flex-col overflow-hidden font-display"
    >
      {/* <ChatNavigation /> */}

      {/* Modal de conexión de canales */}
      <ConnectSocialNetwork
        redToConnect={redToConnect}
        setRedToConnect={setRedToConnect}
      />

      {!redToConnect && (
        <main className="flex flex-1 min-h-0 overflow-hidden relative">
          <ConversationsSidebar
            className={
              selectedChat && isMobile
                ? "hidden md:flex w-full md:w-80"
                : "w-full md:w-80"
            }
            contacts={realTimeContacts}
            selectedChat={selectedChat}
            setSelectedChat={setSelectedChat}
            isConnected={isConnected}
            connectionStatus={connectionStatus}
            chatFilters={chatFilters}
            setChatFilters={setChatFilters}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            isSearching={isSearching}
            onConnectChannel={handleConnectChannel}
          />
          <div
            className={`flex-1 flex flex-col min-h-0 ${
              !selectedChat ? "hidden md:flex" : ""
            }`}
          >
            <ChatSection
            selectedChat={selectedChat}
            messages={realTimeMessages}
            chat={chat}
            onRetryMessage={handleRetryMessage}
            messageInput={messageInput}
            setMessageInput={setMessageInput}
            onSendMessage={handleSendMessage}
            isSendingMessage={isSendingMessage}
            aiResponseEnabled={aiResponseEnabled}
            imagePreviewUrl={imagePreviewUrl}
            onCancelImage={handleCancelImage}
            onAttachmentClick={handleAttachmentClick}
            isUploadingImage={isUploadingImage}
            isDarkMode={isDarkMode}
            fileInputRef={fileInputRef}
            handleImageSelect={handleImageSelect}
            assignedUser={assignedUser}
            onAssignClick={() => setShowModalUser(true)}
            onToggleAI={handleToggleAI}
            loadingStatusIA={loadingStatusIA}
            agent={agent}
            onAgentClick={() => setShowModalAgent(true)}
            isAISidebarOpen={isAISidebarOpen}
            onToggleAISidebar={() => setIsAISidebarOpen(!isAISidebarOpen)}
            onClearChat={handleClearChat}
            showBackButton={isMobile}
            onBackToList={() => navigate(chatListPath)}
          />
          </div>
          <AISidebar
            isOpen={isAISidebarOpen}
            onToggle={() => setIsAISidebarOpen(!isAISidebarOpen)}
            selectedChat={selectedChat}
            chat={chat}
          />
        </main>
      )}

      {/* Modal de asignación de usuario */}
      <UserAssignmentModal
        isOpen={showModalUser}
        onClose={() => setShowModalUser(false)}
        onSelectUser={handleSelectUser}
        selectedUser={assignedUser}
      />

      {/* Modal de selección de agente */}
      <AgentSelectionModal
        isOpen={showModalAgent}
        onClose={() => setShowModalAgent(false)}
        onSelectAgent={handleSelectAgent}
        selectedAgent={agent}
      />
    </div>
  );
}
