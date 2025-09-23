export type UIItem = {
  code: string;
  title: string;
  requiresEvidence?: boolean;
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

export const DOMAINS: UIDomain[] = [
  {
    code: "1",
    title: "Aspectos Académicos",
    weight: 0.25,
    subsections: [
      {
        code: "1",
        title: "Subsección de ejemplo",
        domainCode: "1",
        items: [
          {
            code: "1.1",
            title: "Ítem 1.1 de ejemplo",
            requiresEvidence: true,
            domainCode: "1",
          },
          { code: "1.2", title: "Ítem 1.2 de ejemplo", domainCode: "1" },
        ],
      },
    ],
  },
  // Agrega los demás dominios, subsecciones e ítems con sus codes
];
