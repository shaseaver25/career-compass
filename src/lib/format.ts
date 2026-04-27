export const formatSalary = (n: number | null | undefined) => {
  if (!n) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
};

export const growthLabel: Record<string, string> = {
  declining: "Declining",
  stable: "Stable",
  growing: "Growing",
  high_growth: "High growth",
};

export const educationLabel: Record<string, string> = {
  high_school: "High school",
  certificate: "Certificate",
  associate: "Associate degree",
  bachelor: "Bachelor's degree",
  graduate: "Graduate degree",
};

export const stepTypeLabel: Record<string, string> = {
  course: "Course",
  certification: "Certification",
  degree: "Degree",
  experience: "Experience",
};

export const growthVariant = (g: string | null | undefined) => {
  switch (g) {
    case "high_growth": return "success" as const;
    case "growing": return "info" as const;
    case "declining": return "destructive" as const;
    default: return "secondary" as const;
  }
};

export const initials = (name: string) =>
  name.split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase();