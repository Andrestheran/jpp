import { supabase } from "@/lib/auth";

export type UIItem = {
  id: string; // ID único de la base de datos
  code: string;
  title: string;
  requiresEvidence?: boolean;
  evidenceFiles?: string[]; // URLs de archivos multimedia
  domainCode: string;
  displayNumber?: number; // Número de visualización secuencial
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

    // Transformar datos al formato UI con numeración secuencial
    let globalItemNumber = 1;
    const domains: UIDomain[] = domainsData.map((domain: any) => {
      const domainSubsections = subsectionsData
        .filter((s: any) => s.domain_id === domain.id)
        .map((subsection: any) => {
          const subsectionItems = itemsData
            .filter((i: any) => i.subsection_id === subsection.id)
            .map((item: any) => {
              const itemWithNumber = {
                id: item.id, // ID único de la base de datos
                code: item.code, // Mantenemos el código original para referencias
                title: item.title,
                requiresEvidence: item.requires_evidence || false,
                evidenceFiles: item.evidence_files || [],
                domainCode: domain.code,
                displayNumber: globalItemNumber++, // Numeración secuencial
              };
              return itemWithNumber;
            });

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

    // Contar total de items
    const totalItems = domains.reduce((total, domain) => {
      return total + domain.subsections.reduce((subTotal, subsection) => {
        return subTotal + subsection.items.length;
      }, 0);
    }, 0);

    console.log("✅ Domains loaded successfully:", domains.length);
    console.log(`📊 Total items across all domains: ${totalItems}`);
    
    // Log detallado por dominio
    domains.forEach((domain, idx) => {
      const domainItemCount = domain.subsections.reduce((sum, sub) => sum + sub.items.length, 0);
      console.log(`  Dominio ${idx + 1} (${domain.code}): ${domainItemCount} items`);
    });

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
                id: "error-1",
                code: "1.1",
                title: "Error al cargar preguntas desde la base de datos",
                domainCode: "1",
                displayNumber: 1,
              },
            ],
          },
        ],
      },
    ];
  }
}

// Función para contar total de items
export function countTotalItems(domains: UIDomain[]): number {
  return domains.reduce((total, domain) => {
    return total + domain.subsections.reduce((subTotal, subsection) => {
      return subTotal + subsection.items.length;
    }, 0);
  }, 0);
}

// Función para invalidar el cache cuando se agregan nuevas preguntas
export function invalidateDomainsCache() {
  cachedDomains = null;
  console.log('🔄 Cache de dominios invalidado');
}
