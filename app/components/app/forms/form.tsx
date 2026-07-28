import React, { useEffect, useState } from "react";
import {
  Plus,
  Trash2,
  GripVertical,
  Save,
  Eye,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import type { FormField, Form } from "~/types/schema";
import { useFetcher, useNavigate } from "react-router";
import usePath from "~/hooks/usePath";
import useToast from "~/hooks/useToast";
import useFullPath from "~/hooks/useFullPath";

interface FormData {
  name: string;
  description: string;
  fields: Omit<
    FormField,
    "id" | "createdAt" | "updatedAt" | "formId" | "form"
  >[];
}

interface FormFormsProps {
  editForm?: Form;
  isEditing?: boolean;
}

const fieldTypes = [
  { value: "text", label: "Texto" },
  { value: "textarea", label: "Texto largo" },
  { value: "number", label: "Número" },
  { value: "date", label: "Fecha" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Teléfono" },
  { value: "select", label: "Lista desplegable" },
  { value: "checkbox", label: "Casilla de verificación" },
  { value: "radio", label: "Botón de opción" },
];

export default function FormForms({
  editForm,
  isEditing = false,
}: FormFormsProps) {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    fields: [],
  });

  const [previewMode, setPreviewMode] = useState(false);
  const [expandedFields, setExpandedFields] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const fetcher = useFetcher<any>();
  const FULL_PATH = useFullPath();
  const navigate = useNavigate();
  const PATH = usePath();

  const addField = () => {
    // Validar límite de campos
    if (formData.fields.length >= 20) {
      useToast({
        icon: "warning",
        title: "Máximo 20 campos permitidos por formulario",
      });
      return;
    }

    const newField: Omit<
      FormField,
      "id" | "createdAt" | "updatedAt" | "formId" | "form"
    > = {
      label: "",
      fieldType: "text",
      isRequired: false,
      placeholder: "",
      options: null,
      order: formData.fields.length,
      active: true,
    };
    setFormData((prev) => ({
      ...prev,
      fields: [...prev.fields, newField],
    }));

    // Expandir el nuevo campo y contraer los demás
    const newFieldIndex = formData.fields.length;
    setExpandedFields(new Set([newFieldIndex]));
  };

  const removeField = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== index),
    }));

    // Actualizar los índices de los campos expandidos
    setExpandedFields((prev) => {
      const newExpanded = new Set<number>();
      prev.forEach((expandedIndex) => {
        if (expandedIndex < index) {
          newExpanded.add(expandedIndex);
        } else if (expandedIndex > index) {
          newExpanded.add(expandedIndex - 1);
        }
      });
      return newExpanded;
    });
  };

  const updateField = (index: number, field: Partial<FormField>) => {
    setFormData((prev) => ({
      ...prev,
      fields: prev.fields.map((f, i) => {
        if (i === index) {
          const updatedField = { ...f, ...field };
          return updatedField;
        }
        return f;
      }),
    }));
  };

  const updateFieldOptions = (index: number, options: string[]) => {
    // Validar límite de opciones
    if (options.length > 10) {
      useToast({
        icon: "warning",
        title: "Máximo 10 opciones permitidas por campo",
      });
      return;
    }

    setFormData((prev) => ({
      ...prev,
      fields: prev.fields.map((f, i) =>
        i === index ? { ...f, options: JSON.stringify(options) } : f
      ),
    }));
  };

  const toggleFieldExpansion = (index: number) => {
    setExpandedFields((prev) => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(index)) {
        newExpanded.delete(index);
      } else {
        newExpanded.add(index);
      }
      return newExpanded;
    });
  };

  const validateForm = () => {
    // Validar nombre del formulario
    if (!formData.name.trim()) {
      useToast({
        icon: "error",
        title: "El nombre del formulario es obligatorio",
      });
      return false;
    }

    if (formData.name.trim().length < 3) {
      useToast({
        icon: "error",
        title: "El nombre del formulario debe tener al menos 3 caracteres",
      });
      return false;
    }

    if (formData.name.trim().length > 100) {
      useToast({
        icon: "error",
        title: "El nombre del formulario no puede exceder 100 caracteres",
      });
      return false;
    }

    // Validar que tenga al menos un campo
    if (formData.fields.length === 0) {
      useToast({
        icon: "error",
        title: "Debe agregar al menos un campo al formulario",
      });
      return false;
    }

    // Validar cada campo
    for (let i = 0; i < formData.fields.length; i++) {
      const field = formData.fields[i];

      if (!field.label.trim()) {
        useToast({
          icon: "error",
          title: `El campo ${i + 1} debe tener una etiqueta`,
        });
        return false;
      }

      if (field.label.trim().length < 2) {
        useToast({
          icon: "error",
          title: `La etiqueta del campo ${i + 1} debe tener al menos 2 caracteres`,
        });
        return false;
      }

      if (field.label.trim().length > 50) {
        useToast({
          icon: "error",
          title: `La etiqueta del campo ${i + 1} no puede exceder 50 caracteres`,
        });
        return false;
      }

      // Validar opciones para campos que las requieren
      if (["select", "radio", "checkbox"].includes(field.fieldType)) {
        if (!field.options) {
          useToast({
            icon: "error",
            title: `El campo "${field.label}" necesita al menos una opción`,
          });
          return false;
        }

        const options = JSON.parse(field.options);
        const validOptions = options.filter((opt: string) => opt.trim() !== "");

        if (validOptions.length === 0) {
          useToast({
            icon: "error",
            title: `El campo "${field.label}" necesita al menos una opción válida`,
          });
          return false;
        }

        if (validOptions.length < 2) {
          useToast({
            icon: "error",
            title: `El campo "${field.label}" necesita al menos 2 opciones`,
          });
          return false;
        }
      }
    }

    return true;
  };

  const handleSave = () => {
    if (!validateForm()) {
      return;
    }
    setLoading(true);

    const submitData: any = {
      name: formData.name,
      description: formData.description,
      fields: JSON.stringify(formData.fields),
    };

    // Si está editando, incluir el ID del formulario
    if (isEditing && editForm?.id) {
      submitData.formId = editForm.id;
    }

    fetcher.submit(submitData, {
      method: isEditing ? "PUT" : "POST",
      action: FULL_PATH,
    });
  };

  const renderFieldOptions = (field: any, index: number) => {
    if (!["select", "radio", "checkbox"].includes(field.fieldType)) return null;

    const options = field.options ? JSON.parse(field.options) : [""];

    return (
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Opciones:</label>
        {options.map((option: string, optionIndex: number) => (
          <div key={optionIndex} className="flex gap-2">
            <Input
              value={option}
              onChange={(e) => {
                const newOptions = [...options];
                newOptions[optionIndex] = e.target.value;
                updateFieldOptions(index, newOptions);
              }}
              placeholder={`Opción ${optionIndex + 1}`}
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => {
                const newOptions = options.filter(
                  (_: any, i: number) => i !== optionIndex
                );
                updateFieldOptions(index, newOptions);
              }}
              className="text-destructive hover:text-destructive cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            const newOptions = [...options, ""];
            updateFieldOptions(index, newOptions);
          }}
          className="w-full cursor-pointer"
        >
          <Plus className="w-4 h-4 mr-2" />
          Agregar opción
        </Button>
      </div>
    );
  };

  const renderPreviewField = (field: any) => {
    const commonProps = {
      placeholder: field.placeholder,
      required: field.isRequired,
      className: "w-full",
    };

    switch (field.fieldType) {
      case "textarea":
        return (
          <textarea
            {...commonProps}
            rows={3}
            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
          />
        );
      case "select":
        const selectOptions = field.options ? JSON.parse(field.options) : [];
        return (
          <select
            {...commonProps}
            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
          >
            <option value="">Seleccionar...</option>
            {selectOptions.map((option: string, index: number) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>
        );
      case "checkbox":
        return (
          <div className="flex items-center space-x-2">
            <input type="checkbox" className="rounded border-input" />
            <span className="text-sm text-muted-foreground">
              Marcar si aplica
            </span>
          </div>
        );
      case "radio":
        const radioOptions = field.options ? JSON.parse(field.options) : [];
        return (
          <div className="space-y-2">
            {radioOptions.map((option: string, index: number) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="radio"
                  name={field.name}
                  className="border-input"
                />
                <span className="text-sm">{option}</span>
              </div>
            ))}
          </div>
        );
      default:
        return <Input {...commonProps} type={field.fieldType} />;
    }
  };

  // Cargar datos del formulario para edición
  useEffect(() => {
    if (isEditing && editForm) {
      setFormData({
        name: editForm.name,
        description: editForm.description || "",
        fields:
          editForm.FormField?.map((field) => ({
            label: field.label,
            fieldType: field.fieldType,
            isRequired: field.isRequired,
            placeholder: field.placeholder,
            options: field.options,
            order: field.order,
            active: field.active,
          })) || [],
      });
    }
  }, [isEditing, editForm]);

  useEffect(() => {
    if (fetcher.data && fetcher.data.status === "success") {
      setLoading(false);
      useToast({
        icon: "success",
        title: isEditing
          ? "Formulario actualizado correctamente"
          : "Formulario creado correctamente",
        timer: 5000,
      });
      navigate(`${PATH}/forms/`);
    } else if (fetcher.data && fetcher.data.status === "error") {
      setLoading(false);
      useToast({
        icon: "error",
        title:
          fetcher.data.message ||
          (isEditing
            ? "Error al actualizar el formulario"
            : "Error al crear el formulario"),
      });
    }
  }, [fetcher.data, navigate, PATH, isEditing]);

  return (
    <div className="w-full bg-background dark:bg-transparent px-3 py-2 transition-colors duration-300">
      <div className="mb-6 flex justify-between items-center py-2 border-b border-border flex-shrink-0">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          {isEditing ? "Editar Formulario" : "Crear Formulario"}
        </h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setPreviewMode(!previewMode)}
            className="flex items-center space-x-2 cursor-pointer"
          >
            <Eye className="w-4 h-4" />
            <span>{previewMode ? "Editar" : "Vista previa"}</span>
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center space-x-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>
              {loading
                ? "Guardando..."
                : isEditing
                  ? "Actualizar formulario"
                  : "Guardar formulario"}
            </span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel de edición */}
        {!previewMode && (
          <div className="space-y-6">
            {/* Información del formulario */}
            <Card>
              <CardHeader>
                <CardTitle>Información del formulario</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Nombre del formulario *
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Ej: Formulario de contacto, Registro de usuarios..."
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Descripción
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Describe el propósito de este formulario..."
                    rows={3}
                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Campos del formulario */}
            <Card>
              <CardHeader>
                <CardTitle>Campos del formulario</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {formData.fields.map((field, index) => {
                    const isExpanded = expandedFields.has(index);
                    return (
                      <div
                        key={index}
                        className="border border-border rounded-lg overflow-hidden"
                      >
                        <div
                          className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => toggleFieldExpansion(index)}
                        >
                          <div className="flex items-center space-x-2">
                            <GripVertical className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-medium text-foreground">
                              Campo {index + 1}: {field.label || "Sin etiqueta"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              ({field.fieldType})
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeField(index);
                              }}
                              className="text-destructive hover:text-destructive cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="p-4 space-y-4 border-t border-border">
                            <div>
                              <label className="text-sm font-medium text-foreground mb-2 block">
                                Etiqueta del campo *
                              </label>
                              <Input
                                value={field.label}
                                onChange={(e) =>
                                  updateField(index, {
                                    label: e.target.value,
                                  })
                                }
                                placeholder="Ej: Nombre completo, Edad, Email..."
                                required
                              />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium text-foreground mb-2 block">
                                  Tipo de campo *
                                </label>
                                <select
                                  value={field.fieldType}
                                  onChange={(e) =>
                                    updateField(index, {
                                      fieldType: e.target.value as any,
                                    })
                                  }
                                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                                >
                                  {fieldTypes.map((type) => (
                                    <option key={type.value} value={type.value}>
                                      {type.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-foreground mb-2 block">
                                  Placeholder
                                </label>
                                <Input
                                  value={field.placeholder || ""}
                                  onChange={(e) =>
                                    updateField(index, {
                                      placeholder: e.target.value,
                                    })
                                  }
                                  placeholder="Texto de ayuda..."
                                />
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={`required-${index}`}
                                checked={field.isRequired}
                                onChange={(e) =>
                                  updateField(index, {
                                    isRequired: e.target.checked,
                                  })
                                }
                                className="rounded border-input"
                              />
                              <label
                                htmlFor={`required-${index}`}
                                className="text-sm text-foreground"
                              >
                                Campo obligatorio
                              </label>
                            </div>

                            {renderFieldOptions(field, index)}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={addField}
                    className="w-full cursor-pointer"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar campo
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Panel de vista previa */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Vista previa del formulario</CardTitle>
            </CardHeader>
            <CardContent>
              {formData.name && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      {formData.name}
                    </h3>
                    {formData.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {formData.description}
                      </p>
                    )}
                  </div>

                  <div className="space-y-4">
                    {formData.fields.map((field, index) => (
                      <div key={index}>
                        <label className="text-sm font-medium text-foreground mb-2 block">
                          {field.label}
                          {field.isRequired && (
                            <span className="text-destructive ml-1">*</span>
                          )}
                        </label>
                        {renderPreviewField(field)}
                      </div>
                    ))}
                  </div>

                  {formData.fields.length > 0 && (
                    <div className="pt-4 border-t border-border">
                      <Button className="w-full cursor-pointer">
                        Enviar formulario
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {!formData.name && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>
                    Completa la información del formulario para ver la vista
                    previa
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
