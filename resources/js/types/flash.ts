export type SharedFlashToast = {
  type: "success" | "error" | "warning" | "info";
  message: string;
  title?: string | null;
  id: string;
};
