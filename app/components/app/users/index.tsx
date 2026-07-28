import { Plus, SquarePen } from "lucide-react";
import { useNavigate } from "react-router";
import { Link, useLoaderData } from "react-router";
import { useCompany } from "~/hooks/useCompany";
import { useLicense } from "~/hooks/useLicense";
import usePath from "~/hooks/usePath";
import useToast from "~/hooks/useToast";

export default function UsersPage() {
  const data = useLoaderData<any[]>();
  const license = useLicense();
  const company = useCompany();
  const freeUsers = license?.maxUsers - license?.usersUsed;
  const PATH = usePath();
  const navigate = useNavigate();

  return (
    <div className="w-full bg-background dark:bg-transparent px-3 py-2 transition-colors duration-300">
      <div className="mb-6 flex justify-between items-center py-2 border-b border-border flex-shrink-0">
        <h1 className="text-3xl font-bold text-foreground mb-2">Usuarios</h1>
        <Link
          to={"add/"}
          onClick={(e) => {
            e.preventDefault();
            if (!license?.hasPremium) {
              useToast({
                icon: "error",
                title:
                  "Para crear usuarios, debes tener un plan premium o enterprise activo",
              });
              return;
            }
            if (
              license?.isSon &&
              !license?.usersUnlimited &&
              license?.usersUsed >= license?.maxUsers
            ) {
              useToast({
                icon: "error",
                title: `No tienes suficientes usuarios disponibles. Has alcanzado el límite de usuarios para tu plan`,
              });
              return;
            }

            navigate(`${PATH}/users/add/`);
          }}
          className="flex items-center space-x-2 px-3 py-2 text-sm text-primary-foreground bg-primary rounded-md hover:bg-primary/90 transition-all duration-200 hover:shadow-md hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          <span>Crear usuario</span>
        </Link>
      </div>
      <div className="mx-auto bg-card rounded-lg shadow-sm overflow-hidden border border-border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Apellido
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Correo electrónico
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {data.map((itm) => (
                <tr
                  key={itm.id}
                  className={"hover:bg-muted/50 transition-colors"}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                    {itm?.firstName || ""}
                  </td>
                  <td className="px-6 py-4 truncate whitespace-nowrap text-sm text-muted-foreground">
                    {itm?.lastName || ""}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {itm?.email || ""}
                  </td>
                  <td className="flex gap-3 px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    <Link
                      to={`${itm.id}/edit/`}
                      className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <SquarePen className="w-5 h-5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
