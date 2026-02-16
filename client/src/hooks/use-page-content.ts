import { useQuery } from "@tanstack/react-query";

export function usePageContent(page: string, defaults: Record<string, string>) {
  const { data } = useQuery<Record<string, string>>({
    queryKey: ["/api/content", page],
    queryFn: async () => {
      const res = await fetch(`/api/content/${page}`);
      if (!res.ok) return {};
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const content: Record<string, string> = { ...defaults };
  if (data) {
    for (const [key, value] of Object.entries(data)) {
      if (value) content[key] = value;
    }
  }
  return content;
}
