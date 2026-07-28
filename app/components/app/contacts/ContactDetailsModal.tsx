import React, { useState, useEffect } from "react";
import {
  X,
  Phone,
  Mail,
  MapPin,
  User,
  Calendar,
  Hash,
  Edit3,
  CheckCircle,
  XCircle,
  Settings,
  Save,
} from "lucide-react";
import type { Contact, CustomField } from "~/types/schema";
import { Link, useFetcher } from "react-router";
import useFullPath from "~/hooks/useFullPath";
import useToast from "~/hooks/useToast";
import { countries } from "~/lib/data";
import { formatFullDate } from "~/lib/utils.functions";
import usePath from "~/hooks/usePath";
import ContactAvatar from "./avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui";

interface ContactDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact: Contact | null;
  companyId?: string;
  onContactUpdated?: (updatedContact: Contact) => void;
}

const ContactDetailsModal: React.FC<ContactDetailsModalProps> = ({
  isOpen,
  onClose,
  contact,
  onContactUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<"general" | "custom">("general");
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [customFieldsData, setCustomFieldsData] = useState<any[]>([]);
  const [availableCustomFields, setAvailableCustomFields] = useState<
    CustomField[]
  >([]);
  const [customFieldsLoaded, setCustomFieldsLoaded] = useState(false);
  const [lastActionData, setLastActionData] = useState<any>(null);
  const FULL_PATH = useFullPath();
  const PATH = usePath();
  const customFieldsFetcher = useFetcher();
  const updateContactFetcher = useFetcher();

  const getFieldTypeLabel = (type: string) => {
    const types: { [key: string]: string } = {
      text: "Texto",
      number: "Número",
      date: "Fecha",
      boolean: "Sí/No",
      select: "Lista desplegable",
      textarea: "Texto largo",
    };
    return types[type] || type;
  };

  useEffect(() => {
    if (isEditing && contact?.companyId && !customFieldsLoaded) {
      customFieldsFetcher.load(`${PATH}/contacts/custom-fields/`);
    }
  }, [isEditing, contact?.companyId, PATH, customFieldsLoaded]);

  useEffect(() => {
    if (
      customFieldsFetcher.data &&
      !customFieldsLoaded &&
      customFieldsFetcher.state === "idle"
    ) {
      let customFields = [];

      if (
        Array.isArray(customFieldsFetcher.data) &&
        customFieldsFetcher.data.length > 0
      ) {
        const firstItem = customFieldsFetcher.data[0];
        if (firstItem.customFields) {
          customFields = firstItem.customFields;
        } else {
          customFields = customFieldsFetcher.data;
        }
      } else if (customFieldsFetcher.data.customFields) {
        customFields = customFieldsFetcher.data.customFields;
      }

      const filteredFields = customFields.filter(
        (field: CustomField) => field.active
      );
      setAvailableCustomFields(filteredFields);
      setCustomFieldsLoaded(true);
    }
  }, [customFieldsFetcher.data, customFieldsLoaded, customFieldsFetcher.state]);

  useEffect(() => {
    if (contact && isEditing) {
      setFormData({
        name: contact.name || "",
        lastName: contact.lastName || "",
        email: contact.email || "",
        phone: contact.phone || "",
        countryCode: contact.countryCode || "",
        address: contact.address || "",
        gender: contact.gender || "",
      });

      const customFields = contact.ContactCustomFieldValue || [];
      const fieldsData = customFields.map((cfv) => ({
        customFieldId: cfv.customFieldId,
        value: cfv.value || "",
      }));
      setCustomFieldsData(fieldsData);
    }
  }, [contact, isEditing]);

  useEffect(() => {
    if (
      updateContactFetcher.data &&
      updateContactFetcher.data !== lastActionData &&
      updateContactFetcher.state === "idle"
    ) {
      setLastActionData(updateContactFetcher.data);

      if (updateContactFetcher.data.success) {
        useToast({ icon: "success", title: updateContactFetcher.data.message });
        setIsEditing(false);
        setAvailableCustomFields([]);
        setCustomFieldsLoaded(false);

        if (updateContactFetcher.data.data && onContactUpdated) {
          onContactUpdated(updateContactFetcher.data.data);
        }
      } else {
        useToast({ icon: "error", title: updateContactFetcher.data.message });
      }
    }
  }, [
    updateContactFetcher.data,
    updateContactFetcher.state,
    lastActionData,
    onContactUpdated,
  ]);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setFormData({});
    setCustomFieldsData([]);
    setAvailableCustomFields([]);
    setCustomFieldsLoaded(false);
    setLastActionData(null);
  };

  const handleSaveContact = () => {
    if (!contact) return;

    const formDataToSubmit = new FormData();
    formDataToSubmit.append("_action", "update");
    formDataToSubmit.append("contactId", contact.id);
    formDataToSubmit.append("name", formData.name);
    formDataToSubmit.append("lastName", formData.lastName || "");
    formDataToSubmit.append("email", formData.email || "");
    formDataToSubmit.append("phone", formData.phone || "");
    formDataToSubmit.append("countryCode", formData.countryCode || "");
    formDataToSubmit.append("address", formData.address || "");
    formDataToSubmit.append("gender", formData.gender || "");
    formDataToSubmit.append("customFields", JSON.stringify(customFieldsData));

    updateContactFetcher.submit(formDataToSubmit, {
      method: "post",
      action: `${PATH}/contacts/`,
    });
  };

  const handleCustomFieldChange = (customFieldId: string, value: string) => {
    setCustomFieldsData((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.customFieldId === customFieldId
      );
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex].value = value;
        return updated;
      } else {
        return [...prev, { customFieldId, value }];
      }
    });
  };

  const getCustomFieldValue = (customFieldId: string) => {
    const fieldData = customFieldsData.find(
      (item) => item.customFieldId === customFieldId
    );
    return fieldData ? fieldData.value : "";
  };

  const renderCustomFieldInput = (field: CustomField) => {
    const currentValue = getCustomFieldValue(field.id);

    switch (field.fieldType) {
      case "text":
        return (
          <input
            type="text"
            value={currentValue}
            onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder={field.name}
          />
        );

      case "number":
        return (
          <input
            type="number"
            value={currentValue}
            onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder={field.name}
          />
        );

      case "date":
        return (
          <input
            type="date"
            value={currentValue}
            onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        );

      case "boolean":
        return (
          <select
            value={currentValue}
            onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Seleccionar</option>
            <option value="true">Sí</option>
            <option value="false">No</option>
          </select>
        );

      case "select":
        const options = field.options
          ? field.options.split("\n").filter((opt) => opt.trim())
          : [];
        return (
          <Select
            value={currentValue}
            onValueChange={(value) => handleCustomFieldChange(field.id, value)}
          >
            <SelectTrigger className="w-full cursor-pointer">
              <SelectValue placeholder={`Seleccionar`} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option, index) => (
                <SelectItem key={index} value={option.trim()}>
                  {option.trim()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "textarea":
        return (
          <textarea
            value={currentValue}
            onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder={field.name}
            rows={4}
          />
        );

      default:
        return (
          <input
            type="text"
            value={currentValue}
            onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder={field.name}
          />
        );
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen || !contact) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-card rounded-lg shadow-xl border border-border w-full max-w-5xl max-h-[90vh] overflow-hidden">
        <div className="bg-black p-6 text-white">
          <button
            onClick={onClose}
            className="cursor-pointer absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-start space-x-6">
            <div className="relative">
              <ContactAvatar contact={contact} size="w-22 h-22 text-3xl" />
              <div
                className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center ${
                  contact.active ? "bg-green-500" : "bg-red-500"
                }`}
              >
                {contact.active ? (
                  <CheckCircle className="w-4 h-4 text-white" />
                ) : (
                  <XCircle className="w-4 h-4 text-white" />
                )}
              </div>
            </div>

            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold mb-2">
                    {contact.name || ""} {contact.lastName || ""}
                  </h1>
                  <div className="flex items-center space-x-4 text-white/80">
                    {contact.email && (
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4" />
                        <span className="text-sm">{contact.email}</span>
                      </div>
                    )}
                    {contact.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4" />
                        <span className="text-sm">{contact.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    contact.active
                      ? "bg-green-500/20 text-green-100 border border-green-400/30"
                      : "bg-red-500/20 text-red-100 border border-red-400/30"
                  }`}
                >
                  {contact.active ? "Activo" : "Inactivo"}
                </span>
                <span className="ml-3 text-white/60 text-sm">
                  Miembro desde {formatFullDate(contact?.createdAt)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-b border-border">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab("general")}
              className={`cursor-pointer py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "general"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground"
              }`}
            >
              Datos Generales
            </button>
            <button
              onClick={() => setActiveTab("custom")}
              className={`cursor-pointer py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "custom"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground"
              }`}
            >
              Campos Personalizados
            </button>
          </nav>
        </div>

        <div className="flex-1 overflow-y-auto max-h-[50vh]">
          <div className="p-6">
            {activeTab === "general" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-2">
                <div className="w-full">
                  <div className="flex items-center mb-2">
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">
                      Información Personal
                    </h3>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Nombre *
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.name || ""}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Nombre"
                          required
                        />
                      ) : (
                        <p className="text-foreground font-medium">
                          {contact?.name} {contact?.lastName || ""}
                        </p>
                      )}
                    </div>
                    {isEditing && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Apellido
                        </label>
                        <input
                          type="text"
                          value={formData.lastName || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              lastName: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Apellido"
                        />
                      </div>
                    )}
                    {!isEditing && contact?.gender && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Género
                        </label>
                        <p className="text-foreground">{contact?.gender}</p>
                      </div>
                    )}
                    {isEditing && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Género
                        </label>
                        <Select
                          value={formData.gender || ""}
                          onValueChange={(value) =>
                            setFormData({ ...formData, gender: value })
                          }
                          required
                        >
                          <SelectTrigger className="w-full cursor-pointer">
                            <SelectValue placeholder="Seleccionar género" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Masculino">Masculino</SelectItem>
                            <SelectItem value="Femenino">Femenino</SelectItem>
                            <SelectItem value="Otro">Otro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </div>

                <div className="w-full">
                  <div className="flex items-center mb-2">
                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center mr-3">
                      <Phone className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">
                      Información de Contacto
                    </h3>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Correo electrónico
                      </label>
                      {isEditing ? (
                        <input
                          type="email"
                          value={formData.email || ""}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="correo@ejemplo.com"
                        />
                      ) : (
                        contact?.email && (
                          <div className="flex items-center mt-1">
                            <Mail className="w-4 h-4 text-muted-foreground mr-2" />
                            <p className="text-foreground">{contact?.email}</p>
                          </div>
                        )
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Teléfono
                      </label>
                      {isEditing ? (
                        <div className="flex gap-2">
                          <Select
                            value={formData.countryCode || ""}
                            onValueChange={(value) =>
                              setFormData({
                                ...formData,
                                countryCode: value,
                              })
                            }
                            required
                          >
                            <SelectTrigger className="w-full cursor-pointer">
                              <SelectValue placeholder="Seleccionar país" />
                            </SelectTrigger>
                            <SelectContent>
                              {countries.map((country, index) => (
                                <SelectItem
                                  key={`${country.code}-${country.abbr}-${index}`}
                                  value={country.code}
                                >
                                  {country.flag} {country.code}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <input
                            type="tel"
                            value={formData.phone || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                phone: e.target.value,
                              })
                            }
                            className="flex-1 px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="1234567890"
                          />
                        </div>
                      ) : (
                        contact?.phone && (
                          <div className="flex items-center mt-1">
                            <Phone className="w-4 h-4 text-muted-foreground mr-2" />
                            <p className="text-foreground">
                              {contact?.countryCode &&
                                `${contact.countryCode} `}
                              {contact?.phone}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>

                <div className="">
                  <div className="flex items-center mb-2">
                    <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center mr-3">
                      <MapPin className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">
                      Ubicación
                    </h3>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Dirección
                    </label>
                    {isEditing ? (
                      <textarea
                        value={formData.address || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, address: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Dirección completa"
                        rows={3}
                      />
                    ) : (
                      contact?.address && (
                        <p className="text-foreground mt-1">
                          {contact?.address}
                        </p>
                      )
                    )}
                  </div>
                </div>

                <div className="">
                  <div className="flex items-center mb-2">
                    <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center mr-3">
                      <Hash className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">
                      Información del Sistema
                    </h3>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Origen
                      </label>
                      <p className="text-foreground">{contact?.origin}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Fecha de registro
                      </label>
                      <div className="flex items-center mt-1">
                        <Calendar className="w-4 h-4 text-muted-foreground mr-2" />
                        <p className="text-foreground">
                          {formatFullDate(contact?.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Última actualización
                      </label>
                      <div className="flex items-center mt-1">
                        <Calendar className="w-4 h-4 text-muted-foreground mr-2" />
                        <p className="text-foreground">
                          {formatFullDate(contact?.updatedAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "custom" && (
              <div className="space-y-6">
                {isEditing ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {availableCustomFields
                      .sort((a, b) => a.order - b.order)
                      .map((field) => {
                        return (
                          <div
                            key={field.id}
                            className="bg-card border border-border rounded-lg p-4"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <label className="text-sm font-medium text-foreground">
                                {field.name}
                                {field.isRequired && (
                                  <span className="text-red-500 ml-1">*</span>
                                )}
                              </label>
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                {getFieldTypeLabel(field.fieldType)}
                              </span>
                            </div>
                            <div className="text-foreground">
                              {renderCustomFieldInput(field)}
                            </div>
                          </div>
                        );
                      })}
                    {availableCustomFields.length === 0 &&
                      !customFieldsFetcher.state && (
                        <div className="col-span-full bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-950/30 dark:to-slate-950/30 rounded-xl p-8 border border-gray-200/50 dark:border-gray-800/50">
                          <div className="text-center">
                            <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center mx-auto mb-6">
                              <Hash className="w-10 h-10 text-white" />
                            </div>
                            <h3 className="text-xl font-semibold text-foreground mb-2">
                              No hay campos personalizados
                            </h3>
                            <p className="text-muted-foreground mb-6">
                              No hay campos personalizados configurados para
                              esta empresa.
                            </p>
                            <Link
                              to={`${FULL_PATH}/custom-fields/`}
                              className="cursor-pointer inline-flex items-center space-x-2 px-6 py-3 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors"
                            >
                              <Settings className="w-4 h-4" />
                              <span>Crear Campos Personalizados</span>
                            </Link>
                          </div>
                        </div>
                      )}
                    {customFieldsFetcher.state === "loading" && (
                      <div className="col-span-full bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-950/30 dark:to-slate-950/30 rounded-xl p-8 border border-gray-200/50 dark:border-gray-800/50">
                        <div className="text-center">
                          <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center mx-auto mb-6">
                            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          </div>
                          <h3 className="text-xl font-semibold text-foreground mb-2">
                            Cargando campos personalizados...
                          </h3>
                          <p className="text-muted-foreground">
                            Por favor espera mientras cargamos los campos
                            disponibles.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    {contact.ContactCustomFieldValue &&
                    contact.ContactCustomFieldValue.filter(
                      (cfv) => cfv.value && cfv.value.trim() !== ""
                    ).length > 0 ? (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {contact.ContactCustomFieldValue.filter(
                          (cfv) => cfv.value && cfv.value.trim() !== ""
                        )
                          .sort(
                            (a, b) =>
                              (a.customField?.order || 0) -
                              (b.customField?.order || 0)
                          )
                          .map((customFieldValue) => {
                            if (!customFieldValue.customField) return null;

                            const field = customFieldValue.customField;
                            const value = customFieldValue.value;

                            const formatValue = (
                              fieldType: string,
                              val: string
                            ) => {
                              switch (fieldType) {
                                case "boolean":
                                  return val === "true" ? "Sí" : "No";
                                case "date":
                                  return formatFullDate(val);
                                case "number":
                                  return val;
                                default:
                                  return val;
                              }
                            };

                            return (
                              <div
                                key={customFieldValue.id}
                                className="bg-card border border-border rounded-lg p-4"
                              >
                                <div className="flex items-start justify-between mb-3">
                                  <h4 className="text-sm font-medium text-foreground">
                                    {field.name}
                                  </h4>
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                    {getFieldTypeLabel(field.fieldType)}
                                  </span>
                                </div>
                                <div className="text-foreground">
                                  {field.fieldType === "textarea" ? (
                                    <p className="whitespace-pre-wrap">
                                      {formatValue(field.fieldType, value!)}
                                    </p>
                                  ) : (
                                    <p className="font-medium">
                                      {formatValue(field.fieldType, value!)}
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    ) : (
                      <div className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-950/30 dark:to-slate-950/30 rounded-xl p-8 border border-gray-200/50 dark:border-gray-800/50">
                        <div className="text-center">
                          <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center mx-auto mb-6">
                            <Hash className="w-10 h-10 text-white" />
                          </div>
                          <h3 className="text-xl font-semibold text-foreground mb-2">
                            Campos Personalizados
                          </h3>
                          <p className="text-muted-foreground mb-4">
                            Este contacto no tiene valores en campos
                            personalizados.
                          </p>
                          <p className="text-sm text-muted-foreground mb-6">
                            Los campos personalizados aparecerán aquí cuando
                            estén configurados y tengan valores.
                          </p>
                          <Link
                            to={`${PATH}/contacts/custom-fields/`}
                            className="cursor-pointer inline-flex items-center space-x-2 px-6 py-3 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors"
                          >
                            <Settings className="w-4 h-4" />
                            <span>Administrar Campos Personalizados</span>
                          </Link>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between p-6 border-t border-border bg-muted/30">
          <div className="flex items-center space-x-3">
            {!isEditing && (
              <button
                onClick={handleEditClick}
                className="cursor-pointer flex items-center space-x-2 px-4 py-2 text-sm font-medium text-foreground border border-border rounded-lg hover:bg-accent transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                <span>Editar Contacto</span>
              </button>
            )}
          </div>
          <div className="flex items-center space-x-3">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancelEdit}
                  className="cursor-pointer px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveContact}
                  disabled={updateContactFetcher.state === "submitting"}
                  className="cursor-pointer flex items-center space-x-2 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  <span>
                    {updateContactFetcher.state === "submitting"
                      ? "Guardando..."
                      : "Guardar Cambios"}
                  </span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onClose}
                  className="cursor-pointer px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cerrar
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactDetailsModal;
