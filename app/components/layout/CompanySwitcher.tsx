import { ArrowRight, ChevronsUpDown, CircleUser } from "lucide-react";
import React, { useState } from "react";
import { useCompany } from "~/hooks/useCompany";
import useToast from "~/hooks/useToast";
import ModalSmall from "../ui/ModalSmall";
import {
  executeSQL,
  getDateForMySQL,
  getDateTime,
} from "~/lib/utils.functions";
import usePath from "~/hooks/usePath";
import type { Company } from "~/types/schema";
import { Button } from "../ui/button";
import { useNavigate } from "react-router";
import { useLicense } from "~/hooks/useLicense";
import { Input } from "../ui";
import { v4 as uuidv4 } from "uuid";
import { useUser } from "~/hooks/useUser";
import { useTokens } from "~/contexts/TokensContext";
import { useMessages } from "~/contexts/MessagesContext";
import { useNotifications } from "~/contexts/NotificationsContext";
import { useSmartInbox } from "~/contexts/SmartInboxContext";

export default function CompanySwitcher({
  isCollapsed,
}: {
  isCollapsed: boolean;
}) {
  const company = useCompany();
  const [isOpen, setIsOpen] = useState(false);
  const PATH = usePath();
  const [companies, setCompanies] = useState<Company[]>([]);
  const navigate = useNavigate();
  const license = useLicense();
  const [isCreating, setisCreating] = useState(false);
  const [companyName, setcompanyName] = useState("");
  const [loading, setloading] = useState(false);
  const user = useUser();

  async function handleCompanyChange() {
    if (!license?.hasPremium) {
      useToast({
        icon: "error",
        title: "Para cambiar de empresa, debes tener un plan premium activo",
      });
      return;
    }
    if (license?.isEnterprise) {
      useToast({
        icon: "warning",
        title:
          "Debido a que tienes un plan ENTERPRISE no puedes tener empresas asociadas a tu plan. Puedes ir a licencias y crear una nueva.",
      });
      return;
    }
    setIsOpen(true);
    const companies = await executeSQL(
      PATH,
      `SELECT T1.*, T2.tokensUsed FROM Company AS T1 LEFT JOIN Plan AS T2 ON T1.planId = T2.id JOIN UserCompany AS T3 ON T1.id = T3.companyId WHERE T3.userId = '${user?.id}'`,
      true
    );
    if (!companies?.runScript) {
      useToast({ icon: "error", title: "Error al obtener las empresas" });
      setCompanies([]);
      return;
    }
    setCompanies(companies?.response);
    setisCreating(false);
  }

  function changeCompany(itemCompany: any) {
    setIsOpen(false);
    window.location.href = `/app/${itemCompany.id}/`;
  }

  async function createCompany() {
    if (!companyName || companyName?.length < 3) {
      useToast({
        icon: "error",
        title: "Ingresa un nombre válido para la empresa",
      });
      return;
    }
    setloading(true);
    let initialsName = "";
    const partsName = companyName?.split(" ");
    if (partsName.length > 1) {
      initialsName = `${partsName[0]?.substring(0, 1)}${partsName[1]?.substring(0, 1)}`;
    } else {
      initialsName = partsName[0]?.substring(0, 2);
    }
    const companyId = uuidv4();
    const response = await executeSQL(
      PATH,
      `INSERT INTO Company (id, createdAt, updatedAt, name, initialsName) VALUES ('${companyId}', '${getDateForMySQL()}', '${getDateForMySQL()}', '${companyName}', '${initialsName}')`
    );
    if (!response?.runScript) {
      useToast({ icon: "error", title: "Error al crear la empresa" });
      setloading(false);
      return;
    }
    await executeSQL(
      PATH,
      `INSERT INTO UserCompany (id, createdAt, updatedAt, userId, companyId) VALUES ('${uuidv4()}', '${getDateForMySQL()}', '${getDateForMySQL()}', '${user?.id}', '${companyId}')`
    );
    if (!user?.isSuperAdmin) {
      let userAdmin = await executeSQL(
        PATH,
        "SELECT * FROM User WHERE isSuperAdmin = 1"
      );
      userAdmin = userAdmin?.response || null;
      if (userAdmin) {
        await executeSQL(
          PATH,
          `INSERT INTO UserCompany (id, createdAt, updatedAt, userId, companyId) VALUES ('${uuidv4()}', '${getDateForMySQL()}', '${getDateForMySQL()}', '${userAdmin?.id}', '${companyId}')`
        );
      }
    }
    setloading(false);
    setisCreating(false);
    setcompanyName("");
    setIsOpen(false);
    window.location.href = `/app/${companyId}/`;
  }

  return (
    <>
      {!license?.nameEnterprise && !license?.isSon ? (
        <button
          title="Cambiar empresa"
          onClick={handleCompanyChange}
          className="border-b transition-all duration-300 hover:bg-gray-300/50 w-full justify-between dark:hover:bg-gray-800 border-gray-200 dark:border-gray-700 flex items-center space-x-2 cursor-pointer px-6 py-3 "
        >
          <div className="flex items-center space-x-2">
            <CircleUser className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            {!isCollapsed && (
              <span className="text-gray-900 truncate dark:text-gray-100 font-bold text-sm whitespace-nowrap">
                {company?.name}
              </span>
            )}
          </div>
          <ChevronsUpDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        </button>
      ) : null}

      {/*  */}
      <ModalSmall
        title="Cambiar empresa"
        isOpen={isOpen}
        disabledClose={loading}
        onClose={() => setIsOpen(false)}
      >
        <div>
          {isCreating ? (
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Nombre de la empresa *
              </label>
              <Input
                value={companyName}
                onChange={(e) => setcompanyName(e.target.value || "")}
                placeholder="Escribe el nombre de la empresa"
                required
              />
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {companies?.map((itemCompany) => (
                <div
                  onClick={() => changeCompany(itemCompany)}
                  key={itemCompany.id}
                  className={`${itemCompany.id == company?.id ? "border border-dashed border-blue-500" : "border border-gray-200 dark:border-gray-600"} relative flex items-center justify-between py-3 px-3 space-x-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 dark:bg-gray-800 transition-all duration-300 rounded-md`}
                >
                  {itemCompany.id == company?.id && (
                    <div className="absolute -top-2 text-sm -left-2 bg-blue-500 px-2 text-white rounded-md">
                      Actual
                    </div>
                  )}

                  <h1 className="text-gray-900 truncate dark:text-gray-100 font-bold text-sm whitespace-nowrap">
                    {itemCompany.name}
                  </h1>
                  <ArrowRight className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </div>
              ))}
            </div>
          )}
          {isCreating ? (
            <div className="flex items-center justify-between gap-2 max-w-full">
              <Button
                onClick={() => setisCreating(false)}
                variant={"outline"}
                disabled={loading}
                className="w-1/2 mt-4 cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                onClick={createCompany}
                disabled={loading}
                className="w-1/2 mt-4 cursor-pointer"
              >
                {loading ? "Creando..." : "Crear"}
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => setisCreating(true)}
              className="w-full mt-4 cursor-pointer"
            >
              Crear nueva empresa
            </Button>
          )}
        </div>
      </ModalSmall>
    </>
  );
}
