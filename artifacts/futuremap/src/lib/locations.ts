import { useMemo } from "react";
import {
  useListCountries,
  useListPlanets,
} from "@workspace/api-client-react";

export interface LocationOption {
  code: string;
  flag: string;
  name: string;
  nameKo: string;
  planet: "earth" | "moon" | "mars";
  groupLabel: string;
  groupLabelKo: string;
}

export function useLocationOptions(): {
  earthCountries: LocationOption[];
  spaceLocations: LocationOption[];
  all: LocationOption[];
  byCode: Map<string, LocationOption>;
  isLoading: boolean;
} {
  const { data: countries, isLoading: countriesLoading } = useListCountries();
  const { data: planets, isLoading: planetsLoading } = useListPlanets();

  return useMemo(() => {
    const earthCountries: LocationOption[] = (countries ?? []).map((c) => ({
      code: c.code,
      flag: c.flag,
      name: c.name,
      nameKo: c.nameKo,
      planet: "earth",
      groupLabel: "Earth",
      groupLabelKo: "지구",
    }));

    const spaceLocations: LocationOption[] = [];
    for (const p of planets ?? []) {
      if (p.planet === "earth") continue;
      for (const loc of p.locations) {
        spaceLocations.push({
          code: loc.code,
          flag: loc.flag,
          name: loc.name,
          nameKo: loc.nameKo,
          planet: p.planet,
          groupLabel: p.label,
          groupLabelKo: p.labelKo,
        });
      }
    }

    const all = [...earthCountries, ...spaceLocations];
    const byCode = new Map<string, LocationOption>();
    for (const o of all) byCode.set(o.code.toUpperCase(), o);

    return {
      earthCountries,
      spaceLocations,
      all,
      byCode,
      isLoading: countriesLoading || planetsLoading,
    };
  }, [countries, planets, countriesLoading, planetsLoading]);
}
