import { supabase } from "@/lib/auth";

export type UIItem = {
  code: string;
  title: string;
  requiresEvidence?: boolean;
  evidenceFiles?: string[]; // URLs de archivos multimedia
  domainCode: string;
};
export type UISubsection = {
  code: string;
  title: string;
  items: UIItem[];
  domainCode: string;
};
export type UIDomain = {
  code: string;
  title: string;
  weight: number;
  subsections: UISubsection[];
};

// Cache para evitar múltiples consultas
let cachedDomains: UIDomain[] | null = null;

export async function loadDomains(): Promise<UIDomain[]> {
  if (cachedDomains) {
    console.log("📦 Using cached domains");
    return cachedDomains;
  }

  try {
    console.log("🔄 Loading domains from database...");

    // Cargar dominios
    const { data: domainsData, error: domainsError } = await supabase
      .from("domains")
      .select("id, code, title, weight")
      .order("code");

    if (domainsError) {
      console.error("❌ Error loading domains:", domainsError);
      throw domainsError;
    }

    if (!domainsData || domainsData.length === 0) {
      throw new Error("No domains found in database");
    }

    console.log("✅ Domains loaded:", domainsData.length);

    // Cargar subsecciones
    const { data: subsectionsData, error: subsectionsError } = await supabase
      .from("subsections")
      .select("id, domain_id, code, title")
      .order("code");

    if (subsectionsError) {
      console.error("❌ Error loading subsections:", subsectionsError);
      throw subsectionsError;
    }

    console.log("✅ Subsections loaded:", subsectionsData?.length || 0);

    // Cargar items
    const { data: itemsData, error: itemsError } = await supabase
      .from("items")
      .select("id, subsection_id, code, title, requires_evidence, evidence_files")
      .order("code");

    if (itemsError) {
      console.error("❌ Error loading items:", itemsError);
      throw itemsError;
    }

    console.log("✅ Items loaded:", itemsData?.length || 0);

    // Verificar que tenemos datos
    if (!domainsData || !subsectionsData || !itemsData) {
      throw new Error("Missing data from database");
    }

    // Transformar datos al formato UI
    const domains: UIDomain[] = domainsData.map((domain: any) => {
      const domainSubsections = subsectionsData
        .filter((s: any) => s.domain_id === domain.id)
        .map((subsection: any) => {
          const subsectionItems = itemsData
            .filter((i: any) => i.subsection_id === subsection.id)
            .map((item: any) => ({
              code: item.code,
              title: item.title,
              requiresEvidence: item.requires_evidence || false,
              evidenceFiles: item.evidence_files || [],
              domainCode: domain.code,
            }));

          return {
            code: subsection.code,
            title: subsection.title,
            items: subsectionItems,
            domainCode: domain.code,
          };
        });

      return {
        code: domain.code,
        title: domain.title,
        weight: parseFloat(domain.weight.toString()),
        subsections: domainSubsections,
      };
    });

    console.log("✅ Domains loaded successfully:", domains.length);
    cachedDomains = domains;
    return domains;
  } catch (error) {
    console.error("❌ Error loading domains:", error);
    // Fallback a datos estáticos si hay error
    return [
      {
        code: "1",
        title: "Aspectos Académicos",
        weight: 0.25,
        subsections: [
          {
            code: "1",
            title: "Cargando...",
            domainCode: "1",
            items: [
              {
                code: "1.1",
                title: "Error al cargar preguntas desde la base de datos",
                domainCode: "1",
              },
            ],
          },
        ],
      },
    ];
  }
}

// Función para invalidar el cache cuando se agregan nuevas preguntas
export function invalidateDomainsCache() {
  cachedDomains = null;
  console.log('🔄 Cache de dominios invalidado');
}
