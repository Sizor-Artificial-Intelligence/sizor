import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useFetcher } from "react-router";
import usePath from "~/hooks/usePath";
import useToast from "~/hooks/useToast";
import { countries } from "~/lib/data";

export default function CountryRequired({
  selectedCountry,
  setSelectedCountry,
  selectedCountryCode,
  setSelectedCountryCode,
  show,
}: {
  selectedCountry: string;
  setSelectedCountry: (country: string) => void;
  selectedCountryCode: string;
  setSelectedCountryCode: (countryCode: string) => void;
  show: boolean;
}) {
  const [isSavingCountry, setIsSavingCountry] = useState(false);
  const [phone, setPhone] = useState<any>("");
  const fetcher = useFetcher<any>();
  const PATH = usePath();

  useEffect(() => {
    if (fetcher.data?.type === "updateUserCountry") {
      if (fetcher.data?.status === "success") {
        useToast({
          icon: "success",
          title: fetcher.data?.message || "País actualizado correctamente",
        });
      } else {
        useToast({
          icon: "error",
          title: fetcher.data?.message || "Error al actualizar el país",
        });
      }
    }
  }, [fetcher.data]);

  const handleCountrySave = () => {
    // Validar que el número de celular no tenga letras
    if (isNaN(phone)) {
      useToast({
        icon: "error",
        title: "Ingresar un número de celular válido",
      });
      return;
    }
    setIsSavingCountry(true);
    fetcher.submit(
      { phone, country: selectedCountry, countryCode: selectedCountryCode },
      { method: "PATCH", action: PATH }
    );
  };

  const handleCountryChange = (countryCode: string) => {
    const country = countries.find((c) => c.code === countryCode);
    setSelectedCountryCode(countryCode);
    setSelectedCountry(country?.name || "");
  };

  return (
    <>
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-0 z-999 flex items-center justify-center bg-black/60 px-6 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="w-full max-w-md rounded-2xl border border-gray-700/30 bg-white p-6 shadow-2xl"
            >
              <div className="flex flex-col gap-5">
                <header className="flex flex-col gap-2 text-center">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-black">
                    Personaliza tu experiencia
                  </span>
                  <h2 className="text-2xl font-semibold text-black">
                    Selecciona tu país
                  </h2>
                  <p className="text-sm text-black/70">
                    Esto nos ayuda a ofrecer configuraciones y reportes
                    enfocados en tu región.
                  </p>
                </header>
                <div className="flex flex-col gap-3">
                  <div className="flex gap-3">
                    <div className="relative">
                      <select
                        value={selectedCountryCode}
                        onChange={(e) => handleCountryChange(e.target.value)}
                        className="px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none cursor-pointer text-sm min-w-[100px]"
                      >
                        {countries.map((country, index) => (
                          <option
                            key={`${country.code}-${country.abbr}-${index}`}
                            value={country.code}
                            className="bg-white"
                          >
                            {country.flag} {country.code}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex-1">
                      <input
                        type="tel"
                        placeholder="Número de teléfono"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                      />
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCountrySave}
                  disabled={
                    !selectedCountry || phone?.length < 5 || isSavingCountry
                  }
                  className="cursor-pointer inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSavingCountry ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
