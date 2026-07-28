import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Download,
  Plus,
  Phone,
  Mail,
  Upload,
  ChevronLeft,
  ChevronRight,
  Settings,
} from "lucide-react";
import ContactForm from "./ContactForm";
import FiltersModal from "./FiltersModal";
import ImportModal from "./ImportModal";
import ContactDetailsModal from "./ContactDetailsModal";
import { useFetcher, useLoaderData, Link } from "react-router";
import useFullPath from "~/hooks/useFullPath";
import useToast from "~/hooks/useToast";
import type { Contact } from "~/types/schema";
import ContactAvatar from "./avatar";
import * as XLSX from "xlsx";
import { getDateTime } from "~/lib/utils.functions";
import { useCompany } from "~/hooks/useCompany";
import { useSearchParams } from "react-router";
import { useLicense } from "~/hooks/useLicense";

const ContactsPage: React.FC = () => {
  const loaderData = useLoaderData();
  const [contacts, setContacts] = useState<Contact[]>(loaderData?.data || []);
  const [count, setCount] = useState<number>(loaderData?.count || 0);
  const [totalPages, setTotalPages] = useState<number>(
    loaderData?.totalPages || 1
  );
  const [currentPage, setCurrentPage] = useState<number>(
    loaderData?.currentPage || 1
  );
  const [hasNextPage, setHasNextPage] = useState<boolean>(
    loaderData?.hasNextPage || false
  );
  const [hasPrevPage, setHasPrevPage] = useState<boolean>(
    loaderData?.hasPrevPage || false
  );
  const fetcher = useFetcher();
  const FULL_PATH = useFullPath();
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [hoveredContact, setHoveredContact] = useState<string | null>(null);
  const [isContactFormOpen, setIsContactFormOpen] = useState(false);
  const [isFiltersModalOpen, setIsFiltersModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isContactDetailsModalOpen, setIsContactDetailsModalOpen] =
    useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [activeFilters, setActiveFilters] = useState<any>({});
  const company = useCompany();
  const [searchParams] = useSearchParams();
  const searchURL = searchParams.get("search") || null;
  const license = useLicense();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (searchURL && searchURL?.length > 2) {
      setSearchTerm(searchURL);
    }
  }, [searchParams]);

  useEffect(() => {
    const searchTimeout = setTimeout(() => {
      if (searchTerm !== undefined) {
        handleSearch(searchTerm);
      }
    }, 500);

    return () => clearTimeout(searchTimeout);
  }, [searchTerm, activeFilters]);

  const handleSearch = (term: string) => {
    setIsLoadingContacts(true);
    const params = new URLSearchParams();
    if (term.trim()) {
      params.set("search", term.trim());
    }

    if (activeFilters.origin) params.set("origin", activeFilters.origin);
    if (activeFilters.status) params.set("status", activeFilters.status);
    if (activeFilters.dateFrom) params.set("dateFrom", activeFilters.dateFrom);
    if (activeFilters.dateTo) params.set("dateTo", activeFilters.dateTo);
    if (activeFilters.hasEmail) params.set("hasEmail", "true");
    if (activeFilters.hasPhone) params.set("hasPhone", "true");
    if (activeFilters.sentiment) params.set("sentiment", activeFilters.sentiment);
    if (activeFilters.leadTemperature) params.set("leadTemperature", activeFilters.leadTemperature);

    params.set("page", "1");
    params.set("take", "10");

    fetcher.load(`${FULL_PATH}?${params.toString()}`);
  };

  const handlePageChange = (page: number) => {
    setIsLoadingContacts(true);
    const params = new URLSearchParams();
    if (searchTerm.trim()) {
      params.set("search", searchTerm.trim());
    }

    if (activeFilters.origin) params.set("origin", activeFilters.origin);
    if (activeFilters.status) params.set("status", activeFilters.status);
    if (activeFilters.dateFrom) params.set("dateFrom", activeFilters.dateFrom);
    if (activeFilters.dateTo) params.set("dateTo", activeFilters.dateTo);
    if (activeFilters.hasEmail) params.set("hasEmail", "true");
    if (activeFilters.hasPhone) params.set("hasPhone", "true");
    if (activeFilters.sentiment) params.set("sentiment", activeFilters.sentiment);
    if (activeFilters.leadTemperature) params.set("leadTemperature", activeFilters.leadTemperature);

    params.set("page", page.toString());
    params.set("take", "10");

    fetcher.load(`${FULL_PATH}?${params.toString()}`);
  };

  const handleApplyFilters = (filters: any) => {
    setActiveFilters(filters);
    setIsLoadingContacts(true);

    const params = new URLSearchParams();
    if (searchTerm.trim()) {
      params.set("search", searchTerm.trim());
    }

    if (filters.origin) params.set("origin", filters.origin);
    if (filters.status) params.set("status", filters.status);
    if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
    if (filters.dateTo) params.set("dateTo", filters.dateTo);
    if (filters.hasEmail) params.set("hasEmail", "true");
    if (filters.hasPhone) params.set("hasPhone", "true");
    if (filters.sentiment) params.set("sentiment", filters.sentiment);
    if (filters.leadTemperature) params.set("leadTemperature", filters.leadTemperature);

    params.set("page", "1");
    params.set("take", "10");

    fetcher.load(`${FULL_PATH}?${params.toString()}`);
  };

  const handleOpenFilters = () => {
    setIsFiltersModalOpen(true);
  };

  const handleCloseFilters = () => {
    setIsFiltersModalOpen(false);
  };

  const handleCreateContact = (contactData: any) => {
    setIsLoadingContacts(true);
    fetcher.submit(contactData, {
      method: "POST",
      action: `${FULL_PATH}?index`,
    });
  };

  const handleImportContacts = (validContacts: any[]) => {
    setIsLoadingContacts(true);
    fetcher.submit(
      { data: JSON.stringify(validContacts) },
      {
        method: "PATCH",
        action: `${FULL_PATH}?index`,
      }
    );
    setIsImportModalOpen(false);
  };

  const handleOpenImportModal = () => {
    if (company?.plan?.isFree)
      useToast({
        icon: "error",
        title: "Para importar contactos, debes tener un plan premium",
      });
    else {
      setIsImportModalOpen(true);
    }
  };

  const handleCloseImportModal = () => {
    setIsImportModalOpen(false);
  };

  const handleContactClick = (contact: Contact) => {
    setSelectedContact(contact);
    setIsContactDetailsModalOpen(true);
  };

  const handleCloseContactDetailsModal = () => {
    setIsContactDetailsModalOpen(false);
    setSelectedContact(null);
  };

  const handleContactUpdated = (updatedContact: Contact) => {
    setContacts((prevContacts) =>
      prevContacts.map((contact) =>
        contact.id === updatedContact.id ? updatedContact : contact
      )
    );
    setSelectedContact(updatedContact);
  };

  const handleExportContacts = () => {
    setIsLoadingContacts(true);
    fetcher.submit(
      { type: "export" },
      {
        method: "PATCH",
        action: `${FULL_PATH}?index`,
      }
    );
  };

  const generateExcel = (contacts: any[]) => {
    const worksheet = XLSX.utils.json_to_sheet(
      contacts.map((contact) => ({
        Nombre: contact?.name || "",
        Apellido: contact?.lastName || "",
        Email: contact?.email || "",
        Teléfono: contact?.phone || "",
        "Código País": contact?.countryCode || "",
        Género: contact?.gender || "",
        Dirección: contact?.address || "",
        Estado: contact?.active ? "Activo" : "Inactivo",
        Origen: contact?.origin || "",
        "Fecha Creación": getDateTime(contact?.createdAt),
      }))
    );

    const colWidths = [
      { wch: 15 }, // Nombre
      { wch: 15 }, // Apellido
      { wch: 25 }, // Email
      { wch: 15 }, // Teléfono
      { wch: 12 }, // Código País
      { wch: 12 }, // Género
      { wch: 30 }, // Dirección
      { wch: 10 }, // Estado
      { wch: 15 }, // Origen
      { wch: 15 }, // Fecha Creación
    ];
    worksheet["!cols"] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Contactos");
    XLSX.writeFile(
      workbook,
      `contactos_${new Date().toISOString().split("T")[0]}.xlsx`
    );
  };

  useEffect(() => {
    if (fetcher.data) {
      if (fetcher.data.success === false) {
        setIsContactFormOpen(false);
        setIsLoadingContacts(false);
        setIsLoading(false);
        useToast({ icon: "error", title: fetcher.data?.message });
      }
      if (fetcher.data.success === true) {
        if (
          fetcher.data.data &&
          fetcher.data.source !== "contacts" &&
          !fetcher.data.export
        ) {
          // Creación de contacto individual
          setContacts((prevContacts) => [fetcher.data.data, ...prevContacts]);
          setCount((prevCount) => prevCount + 1);
          setIsContactFormOpen(false);
          setIsLoadingContacts(false);
          setIsLoading(false);
          useToast({ icon: "success", title: fetcher.data?.message });
        } else if (fetcher.data.source === "contacts") {
          // Respuesta de búsqueda/filtrado/paginación
          setContacts(fetcher.data?.data || []);
          setCount(fetcher.data?.count || 0);
          setTotalPages(fetcher.data?.totalPages || 1);
          setCurrentPage(fetcher.data?.currentPage || 1);
          setHasNextPage(fetcher.data?.hasNextPage || false);
          setHasPrevPage(fetcher.data?.hasPrevPage || false);
          setIsLoadingContacts(false);
        } else if (fetcher.data?.export) {
          // Exportación exitosa
          setIsLoadingContacts(false);
          setIsLoading(false);
          generateExcel(fetcher.data?.data || []);
          useToast({
            icon: "success",
            title: `${fetcher.data.data.length} contactos exportados correctamente`,
          });
        } else {
          // Importación exitosa - recargar la consulta inicial
          setIsLoadingContacts(false);
          setIsLoading(false);
          useToast({ icon: "success", title: fetcher.data?.message });

          // Recargar la consulta inicial para mostrar todos los contactos
          setTimeout(() => {
            fetcher.load(FULL_PATH);
          }, 100);
        }
      }
      if (fetcher.data.source === "contacts" && fetcher.data.success !== true) {
        setContacts(fetcher.data?.data || []);
        setCount(fetcher.data?.count || 0);
        setTotalPages(fetcher.data?.totalPages || 1);
        setCurrentPage(fetcher.data?.currentPage || 1);
        setHasNextPage(fetcher.data?.hasNextPage || false);
        setHasPrevPage(fetcher.data?.hasPrevPage || false);
        setIsLoadingContacts(false);
      }
    }
  }, [fetcher.data, FULL_PATH]);

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col bg-background dark:bg-transparent px-3 py-2 transition-colors duration-300">
        <div className="mb-6 flex justify-between items-center py-2 border-b border-border flex-shrink-0">
          <div className="h-8 bg-muted rounded-lg w-48 animate-pulse"></div>
          <div className="flex items-center space-x-2">
            <div className="h-10 bg-muted rounded-lg w-24 animate-pulse"></div>
            <div className="h-10 bg-muted rounded-lg w-24 animate-pulse"></div>
            <div className="h-10 bg-muted rounded-lg w-32 animate-pulse"></div>
          </div>
        </div>
        <div className="flex-1 min-h-0 mx-auto w-full">
          <div className="h-full bg-card rounded-lg shadow-sm border border-border flex flex-col">
            <div className="p-4 border-b border-border flex-shrink-0">
              <div className="h-10 bg-muted rounded-lg animate-pulse"></div>
            </div>
            <div className="bg-muted/50 border-b border-border flex-shrink-0">
              <div className="h-12 bg-muted rounded animate-pulse mx-6"></div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-16 bg-muted rounded-lg animate-pulse"
                ></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-background dark:bg-transparent px-3 py-2 transition-colors duration-300">
      <div className="mb-6 flex justify-between items-center py-2 border-b border-border flex-shrink-0">
        <h1 className="text-3xl font-bold text-foreground mb-2">Contactos</h1>
        <div className="flex items-center space-x-2">
          <Link
            to="custom-fields"
            className="cursor-pointer flex items-center space-x-2 px-3 py-2 text-sm text-foreground border border-border rounded-md hover:bg-accent hover:text-accent-foreground transition-all duration-200 hover:shadow-sm"
          >
            <Settings className="w-4 h-4" />
            <span>Campos Personalizados</span>
          </Link>
          <button
            onClick={handleExportContacts}
            disabled={isLoadingContacts}
            className="cursor-pointer flex items-center space-x-2 px-3 py-2 text-sm text-foreground border border-border rounded-md hover:bg-accent hover:text-accent-foreground transition-all duration-200 hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoadingContacts ? (
              <>
                <div className="w-4 h-4 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
                <span>Exportando...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Exportar</span>
              </>
            )}
          </button>
          <button
            onClick={handleOpenImportModal}
            className="flex cursor-pointer items-center space-x-2 px-3 py-2 text-sm text-foreground border border-border rounded-md hover:bg-accent hover:text-accent-foreground transition-all duration-200 hover:shadow-sm"
          >
            <Upload className="w-4 h-4" />
            <span>Importar</span>
          </button>
          <button
            onClick={() => {
              if (
                company?.plan?.isFree &&
                company?.plan?.contactsUsed >= company?.plan?.maxContacts
              ) {
                useToast({
                  icon: "error",
                  title:
                    "Para crear más contactos, debes tener un plan premium",
                });
                return;
              }
              if (license?.isSon) {
                if (
                  company?.plan &&
                  !company?.plan?.contactsUnlimited &&
                  company?.plan?.contactsUsed >= company?.plan?.maxContacts
                ) {
                  useToast({
                    icon: "error",
                    title: "Has alcanzado el límite de contactos para tu plan",
                  });
                  return;
                }
              }
              setIsContactFormOpen(true);
            }}
            className="flex dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 cursor-pointer items-center space-x-2 px-3 py-2 text-sm text-primary-foreground bg-primary rounded-md hover:bg-primary/90 transition-all duration-200 hover:shadow-md hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>Crear contacto</span>
          </button>
        </div>
      </div>
      <div className="flex-1 min-h-0 mx-auto w-full">
        <div className="h-full bg-card rounded-lg shadow-sm border border-border flex flex-col relative">
          <div className="p-4 border-b border-border flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Buscar contactos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200 hover:border-input/80"
                  />
                </div>
                <button
                  onClick={handleOpenFilters}
                  className="h-full flex cursor-pointer items-center space-x-2 px-3 py-3 text-sm text-foreground border border-border rounded-md hover:bg-accent hover:text-accent-foreground transition-all duration-200 hover:shadow-sm"
                >
                  <Filter className="w-4 h-4" />
                  <span>Filtros</span>
                  {Object.values(activeFilters).some(
                    (value) => value !== "" && value !== false
                  ) && (
                    <span className="w-2 h-2 bg-primary rounded-full"></span>
                  )}
                </button>
              </div>
              <div className="text-sm text-muted-foreground">
                Mostrando{" "}
                <span className="font-medium text-foreground">
                  {contacts?.length}
                </span>{" "}
                de <span className="font-medium text-foreground">{count}</span>{" "}
                resultados
              </div>
            </div>
          </div>

          <div className="bg-muted/50 border-b border-border flex-shrink-0">
            <div className="grid grid-cols-9 gap-4 px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <div className="col-span-3">Nombre</div>
              <div className="col-span-2">Contacto</div>
              <div className="col-span-2">Origen</div>
              <div className="col-span-2">Estado</div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[60vh] custom-scroll">
            <div className="divide-y divide-border">
              {contacts.map((contact, index) => (
                <div
                  key={contact.id}
                  className={`grid grid-cols-9 cursor-pointer gap-4 px-6 py-4 hover:bg-accent/50 transition-all duration-200 group ${
                    hoveredContact === contact.id ? "bg-accent/30" : ""
                  }`}
                  onMouseEnter={() => setHoveredContact(contact.id)}
                  onMouseLeave={() => setHoveredContact(null)}
                  onClick={() => handleContactClick(contact)}
                >
                  <div className="col-span-3 flex items-center">
                    <div className="relative">
                      <ContactAvatar contact={contact} />
                    </div>
                    <div>
                      <div className="font-medium text-foreground group-hover:text-primary transition-colors duration-200">
                        {contact?.name} {contact?.lastName || ""}
                      </div>
                    </div>
                  </div>

                  <div className="col-span-2">
                    {contact?.email && (
                      <div className="flex items-center text-sm text-muted-foreground mb-1 hover:text-foreground transition-colors duration-200">
                        <Mail className="w-3 h-3 mr-2" />
                        <span className="truncate">{contact?.email}</span>
                      </div>
                    )}
                    {contact?.phone && (
                      <div className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">
                        <Phone className="w-3 h-3 mr-2" />
                        <span>{contact?.phone}</span>
                      </div>
                    )}
                  </div>

                  <div className="col-span-2 flex items-center">
                    <span className="text-sm font-medium text-foreground">
                      {contact.origin}
                    </span>
                  </div>

                  <div className="col-span-2 flex items-center">
                    <span>{contact.active ? "Activo" : "Inactivo"}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/30">
              <div className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={!hasPrevPage}
                  className="cursor-pointer flex items-center space-x-1 px-3 py-2 text-sm text-foreground border border-border rounded-md hover:bg-accent hover:text-accent-foreground transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Anterior</span>
                </button>

                {/* Page numbers */}
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`cursor-pointer px-3 py-2 text-sm border rounded-md transition-all duration-200 ${
                          currentPage === pageNum
                            ? "bg-primary text-primary-foreground border-primary"
                            : "text-foreground border-border hover:bg-accent hover:text-accent-foreground"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!hasNextPage}
                  className="cursor-pointer flex items-center space-x-1 px-3 py-2 text-sm text-foreground border border-border rounded-md hover:bg-accent hover:text-accent-foreground transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>Siguiente</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Loading Overlay */}
          {isLoadingContacts && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm text-muted-foreground">
                  Cargando contactos...
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <ContactForm
        loadingForm={isLoading}
        setloadingForm={setIsLoading}
        isOpen={isContactFormOpen}
        onClose={() => setIsContactFormOpen(false)}
        onSubmit={handleCreateContact}
      />

      <FiltersModal
        isOpen={isFiltersModalOpen}
        onClose={handleCloseFilters}
        onApplyFilters={handleApplyFilters}
      />

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={handleCloseImportModal}
        onSubmit={handleImportContacts}
      />

      <ContactDetailsModal
        isOpen={isContactDetailsModalOpen}
        onClose={handleCloseContactDetailsModal}
        contact={selectedContact}
        onContactUpdated={handleContactUpdated}
      />
    </div>
  );
};

export default ContactsPage;
