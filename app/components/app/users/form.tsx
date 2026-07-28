import React, { useEffect, useState } from "react";
import {
  Eye,
  EyeOff,
  Loader2,
  User,
  Mail,
  Phone,
  Lock,
  Building2,
  FileText,
  Trash2,
  Plus,
  ArrowRight,
  ListTree,
  Check,
} from "lucide-react";
import { countries, ROUTES } from "~/lib/data";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Tabs } from "~/components/ui/tabs";
import { useFetcher, useNavigate, useSearchParams } from "react-router";
import usePath from "~/hooks/usePath";
import useFullPath from "~/hooks/useFullPath";
import useToast from "~/hooks/useToast";
import { useLicense } from "~/hooks/useLicense";
import { executeSQL, getDateTime } from "~/lib/utils.functions";
import ModalSmall from "~/components/ui/ModalSmall";
import { v4 as uuidv4 } from "uuid";

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  countryCode: string;
  country: string;
  password: string;
  isSuperAdmin?: boolean;
  id?: string;
  routesAllowed?: string;
}

interface FormErrors extends Partial<FormData> {
  server?: string;
}

interface UserCompany {
  id: string;
  company: {
    id: string;
    name: string;
    initialsName: string;
    plan?: {
      name: string;
      price: number;
    };
  };
}

interface FormUserProps {
  isLoading?: boolean;
  initialData?: Partial<FormData>;
  isEditing?: boolean;
  userCompanies?: UserCompany[];
}

export default function FormUser({
  initialData,
  isEditing = false,
  userCompanies = [],
}: FormUserProps) {
  const [formData, setFormData] = useState<FormData>({
    firstName: initialData?.firstName || "",
    lastName: initialData?.lastName || "",
    email: initialData?.email || "",
    phone: initialData?.phone || "",
    countryCode: initialData?.countryCode || "+57",
    country: initialData?.country || "Colombia",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const fetcher = useFetcher();
  const FULL_PATH = useFullPath();
  const PATH = usePath();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const license = useLicense();
  const [searchParams] = useSearchParams();
  const tabUrl = searchParams.get("tab") ?? "form";
  const [companies, setCompanies] = useState<any[]>([]);
  const [modalCompaniesOpen, setModalCompaniesOpen] = useState(false);
  const [loadingCompanies, setloadingCompanies] = useState(false);
  const [routesAllowed, setRoutesAllowed] = useState<string[]>(
    initialData?.routesAllowed?.split("|") || []
  );
  let GLOBAL_ROUTES = license?.isEnterprise
    ? ROUTES
    : ROUTES.filter((route) => !route.isEnterprise).sort(
        (a, b) => a.order - b.order
      );
  GLOBAL_ROUTES = GLOBAL_ROUTES.filter((route) => route.key !== "dashboard");

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
    if (errors.server) {
      setErrors((prev) => ({ ...prev, server: "" }));
    }
  };

  const handleCountryChange = (countryCode: string) => {
    const country = countries.find((c) => c.code === countryCode);
    setFormData((prev) => ({
      ...prev,
      countryCode,
      country: country?.name || "",
    }));
  };

  const validateForm = () => {
    const newErrors: FormErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "El nombre es requerido";
    }

    if (!formData.email.trim()) {
      newErrors.email = "El correo es requerido";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Correo electrónico inválido";
    }

    if (!isEditing && !formData.password) {
      newErrors.password = "La contraseña es requerida";
    } else if (!isEditing && formData.password.length < 8) {
      newErrors.password = "La contraseña debe tener al menos 8 caracteres";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setIsLoading(true);
      fetcher.submit(
        { ...formData, routesAllowed: routesAllowed.join("|") } as any,
        {
          method: "POST",
          action: FULL_PATH,
        }
      );
    }
  };

  useEffect(() => {
    if (fetcher.data) {
      if (fetcher.data.status === "success") {
        useToast({
          icon: "success",
          title: `Usuario ${isEditing ? "actualizado" : "creado"} correctamente`,
        });
        if (!isEditing) {
          navigate(`${PATH}/users/${fetcher.data?.user?.id}/edit/?tab=routes`);
        } else {
          navigate(`${PATH}/users/`);
        }
      } else {
        useToast({
          icon: "error",
          title: fetcher.data?.message || "Error al crear el usuario",
        });
      }
      setIsLoading(false);
    }
  }, [fetcher.data]);

  useEffect(() => {
    if (!license?.hasPremium) {
      useToast({
        icon: "error",
        title:
          "Para crear usuarios, debes tener un plan premium o enterprise activo",
      });
      navigate(`${PATH}/users/`);
    }
    if (
      !isEditing &&
      license?.isSon &&
      !license?.usersUnlimited &&
      license?.usersUsed >= license?.maxUsers
    ) {
      useToast({
        icon: "error",
        title: `No tienes suficientes usuarios disponibles. Has alcanzado el límite de usuarios para tu plan`,
      });
      navigate(`${PATH}/users/`);
    }
  }, [license, isEditing]);

  const openModalCompanies = async () => {
    setloadingCompanies(true);
    try {
      let sqlQuery = "SELECT * FROM Company";
      if (userCompanies.length > 0) {
        const companyIds = userCompanies
          .map((company) => `'${company.company.id}'`)
          .join(",");
        sqlQuery += ` WHERE id NOT IN (${companyIds})`;
      }

      const companies = await executeSQL(PATH, sqlQuery, true);

      if (!companies?.runScript) {
        useToast({ icon: "error", title: "Error al obtener las empresas" });
        setloadingCompanies(false);
        return;
      }

      setCompanies(companies?.response || []);
      if (companies?.response?.length > 0) {
        setModalCompaniesOpen(true);
      } else {
        useToast({
          icon: "error",
          title: "No hay empresas disponibles para asociar",
        });
        setloadingCompanies(false);
        return;
      }
    } catch (error) {
      useToast({ icon: "error", title: "Error al cargar las empresas" });
    } finally {
      setloadingCompanies(false);
    }
  };

  const deleteCompany = async (companyId: string) => {
    const response = await executeSQL(
      PATH,
      `DELETE FROM UserCompany WHERE userId = '${initialData?.id}' AND companyId = '${companyId}'`,
      true
    );
    if (!response?.runScript) {
      useToast({ icon: "error", title: "Error al eliminar la empresa" });
      return;
    }
    useToast({ icon: "success", title: "Empresa eliminada correctamente" });
    navigate(`${PATH}/users/${initialData?.id}/edit/?tab=companies`);
  };

  const selectCompany = async (company: any) => {
    setModalCompaniesOpen(false);
    setloadingCompanies(true);
    const uuid = uuidv4();
    const response = await executeSQL(
      PATH,
      `INSERT INTO UserCompany (id, createdAt, updatedAt, userId, companyId) VALUES ('${uuid}', '${getDateTime()}', '${getDateTime()}', '${initialData?.id}', '${company.id}')`,
      true
    );
    if (!response?.runScript) {
      useToast({ icon: "error", title: "Error al asociar la empresa" });
      setloadingCompanies(false);
      return;
    }
    setloadingCompanies(false);
    useToast({ icon: "success", title: "Empresa asociada correctamente" });
    navigate(`${PATH}/users/${initialData?.id}/edit/?tab=companies`);
  };

  const renderCompaniesTab = () => {
    return (
      <div className="space-y-4">
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-foreground mb-2">
              Empresas Asociadas
            </h3>
            <Button
              onClick={openModalCompanies}
              variant="outline"
              className="cursor-pointer"
              disabled={loadingCompanies}
            >
              {loadingCompanies ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {loadingCompanies ? "Cargando..." : "Agregar Empresa"}
            </Button>
          </div>
          <p className="text-muted-foreground text-sm">
            Lista de empresas a las que este usuario tiene acceso
          </p>
        </div>

        {userCompanies.length === 0 ? (
          <div className="text-center py-8">
            <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Este usuario no está asociado a ninguna empresa
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {userCompanies.map((userCompany) => (
              <div
                key={userCompany.id}
                className="border border-border rounded-lg p-4 bg-card"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 mb-2">
                        <Building2 className="w-5 h-5 text-primary" />
                        <h4 className="font-medium text-foreground">
                          {userCompany?.company?.name || ""}
                        </h4>
                        <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                          {userCompany?.company?.initialsName || ""}
                        </span>
                      </div>
                      <button
                        onClick={async () => {
                          await deleteCompany(userCompany.company.id);
                        }}
                        className="cursor-pointer hover:bg-red-500/10 rounded-full p-1 duration-300 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>Plan:</span>
                      <span className="font-medium text-foreground">
                        {userCompany?.company?.plan?.name || "Sin plan"}
                      </span>
                      <span className="text-xs">
                        (${userCompany?.company?.plan?.price || 0}/mes)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderRoutesTab = () => {
    return (
      <div className="space-y-4">
        <div className="mb-4">
          <h3 className="text-lg font-medium text-foreground mb-2">
            Rutas Permitidas
          </h3>
          <p className="text-muted-foreground text-sm">
            Administra las rutas permitidas para este usuario
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {GLOBAL_ROUTES.map((route) => {
            const isActive = routesAllowed.includes(route.key);
            const handleToggleRoute = () => {
              if (isActive) {
                setRoutesAllowed(routesAllowed.filter((r) => r !== route.key));
              } else {
                setRoutesAllowed([...routesAllowed, route.key]);
              }
            };
            return (
              <div
                key={route.key}
                className={`cursor-pointer border flex items-center justify-between rounded-lg p-4 py-2 bg-card ${isActive ? "border-blue-500" : ""}`}
                onClick={handleToggleRoute}
              >
                <h4 className="font-medium text-foreground">{route.label}</h4>
                {isActive && <Check className="w-4 h-4 text-blue-500" />}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderFormContent = () => (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Nombre y Apellido */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label
            htmlFor="firstName"
            className="text-sm font-medium text-foreground flex items-center gap-2"
          >
            <User className="w-4 h-4" />
            Nombre *
          </label>
          <Input
            id="firstName"
            type="text"
            placeholder="Ingresa el nombre"
            value={formData.firstName}
            onChange={(e) => handleInputChange("firstName", e.target.value)}
            className={errors.firstName ? "border-destructive" : ""}
            disabled={isLoading}
          />
          {errors.firstName && (
            <p className="text-destructive text-xs">{errors.firstName}</p>
          )}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="lastName"
            className="text-sm font-medium text-foreground flex items-center gap-2"
          >
            <User className="w-4 h-4" />
            Apellido
          </label>
          <Input
            id="lastName"
            type="text"
            placeholder="Ingresa el apellido"
            value={formData.lastName}
            onChange={(e) => handleInputChange("lastName", e.target.value)}
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Email */}
      <div className="space-y-2">
        <label
          htmlFor="email"
          className="text-sm font-medium text-foreground flex items-center gap-2"
        >
          <Mail className="w-4 h-4" />
          Correo electrónico *
        </label>
        <Input
          id="email"
          type="email"
          placeholder="usuario@ejemplo.com"
          value={formData.email}
          onChange={(e) => handleInputChange("email", e.target.value)}
          className={errors.email ? "border-destructive" : ""}
          disabled={isLoading}
        />
        {errors.email && (
          <p className="text-destructive text-xs">{errors.email}</p>
        )}
      </div>

      {/* Teléfono con código de país */}
      <div className="space-y-2">
        <label
          htmlFor="phone"
          className="text-sm font-medium text-foreground flex items-center gap-2"
        >
          <Phone className="w-4 h-4" />
          Teléfono
        </label>
        <div className="flex gap-3">
          <div className="relative">
            <select
              value={formData.countryCode}
              onChange={(e) => handleCountryChange(e.target.value)}
              className="h-9 px-3 py-1 bg-background border border-input rounded-md text-foreground text-sm appearance-none cursor-pointer min-w-[120px] focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {countries.map((country, index) => (
                <option
                  key={`${country.code}-${country.abbr}-${index}`}
                  value={country.code}
                >
                  {country.flag} {country.code}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <Input
              id="phone"
              type="tel"
              placeholder="Número de teléfono"
              value={formData.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>
      </div>

      {/* Contraseña */}
      {!isEditing && (
        <div className="space-y-2">
          <label
            htmlFor="password"
            className="text-sm font-medium text-foreground flex items-center gap-2"
          >
            <Lock className="w-4 h-4" />
            Contraseña *
          </label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Mínimo 8 caracteres"
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              className={`pr-10 ${errors.password ? "border-destructive" : ""}`}
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="cursor-pointer absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              disabled={isLoading}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-destructive text-xs">{errors.password}</p>
          )}
        </div>
      )}

      {/* Error del servidor */}
      {errors.server && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
          <p className="text-destructive text-sm">{errors.server}</p>
        </div>
      )}

      {/* Botones */}
      {!isEditing && (
        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            disabled={isLoading}
            className="flex-1 cursor-pointer"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{isEditing ? "Guardando..." : "Creando..."}</span>
              </div>
            ) : (
              <span>{isEditing ? "Guardar cambios" : "Crear usuario"}</span>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            className="cursor-pointer"
            onClick={() => {
              setFormData({
                firstName: "",
                lastName: "",
                email: "",
                phone: "",
                countryCode: "+57",
                country: "Colombia",
                password: "",
              });
              setErrors({});
            }}
            disabled={isLoading}
          >
            Limpiar
          </Button>
        </div>
      )}
    </form>
  );

  if (isEditing && !initialData?.isSuperAdmin) {
    const tabs = [
      {
        id: "form",
        label: "Información del Usuario",
        icon: <FileText className="w-4 h-4" />,
      },
      ...(!license?.isEnterprise && !license?.isSon
        ? [
            {
              id: "companies",
              label: "Empresas",
              icon: <Building2 className="w-4 h-4" />,
            },
          ]
        : []),
      {
        id: "routes",
        label: "Rutas Permitidas",
        icon: <ListTree className="w-4 h-4" />,
      },
    ];

    return (
      <>
        <ModalSmall
          title="Asociar empresa"
          isOpen={modalCompaniesOpen}
          disabledClose={loadingCompanies}
          onClose={() => setModalCompaniesOpen(false)}
        >
          <div className="flex flex-col gap-2">
            {companies?.map((itemCompany) => (
              <div
                onClick={async () => {
                  await selectCompany(itemCompany);
                }}
                key={itemCompany.id}
                className={
                  "border border-gray-200 dark:border-gray-600 relative flex items-center justify-between py-3 px-3 space-x-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 dark:bg-gray-800 transition-all duration-300 rounded-md"
                }
              >
                <h1 className="text-gray-900 truncate dark:text-gray-100 font-bold text-sm whitespace-nowrap">
                  {itemCompany.name || ""}
                </h1>
                <ArrowRight className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </div>
            ))}
          </div>
        </ModalSmall>

        <div className="max-w-4xl mx-auto p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-foreground mb-2">
                Editar Usuario
              </h2>
              <Button
                disabled={isLoading}
                className="cursor-pointer"
                onClick={handleSubmit}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Guardar"
                )}
              </Button>
            </div>
            <p className="text-muted-foreground text-sm">
              Modifica la información del usuario y gestiona sus empresas
              asociadas
            </p>
          </div>

          <Tabs tabs={tabs} defaultTab={tabUrl}>
            {(activeTab) => {
              if (activeTab === "form") {
                return renderFormContent();
              } else if (activeTab === "companies") {
                return renderCompaniesTab();
              } else if (activeTab === "routes") {
                return renderRoutesTab();
              }
              return null;
            }}
          </Tabs>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="max-w-2xl mx-auto p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            Crear Usuario
          </h2>
          <p className="text-muted-foreground text-sm">
            Completa los campos para crear un nuevo usuario
          </p>
        </div>

        {renderFormContent()}
      </div>
    </>
  );
}
