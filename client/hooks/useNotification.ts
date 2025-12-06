import { useCallback } from "react";
import { toast } from "sonner";

export type NotificationType = "success" | "error" | "info" | "warning";

interface NotificationOptions {
  duration?: number;
  description?: string;
}

export function useNotification() {
  const notify = useCallback(
    (
      message: string,
      type: NotificationType = "info",
      options: NotificationOptions = {},
    ) => {
      const { duration = 4000, description } = options;

      switch (type) {
        case "success":
          toast.success(message, {
            description,
            duration,
          });
          break;
        case "error":
          toast.error(message, {
            description,
            duration,
          });
          break;
        case "warning":
          toast.warning
            ? toast.warning(message, {
                description,
                duration,
              })
            : toast(message, {
                description,
                duration,
              });
          break;
        case "info":
        default:
          toast(message, {
            description,
            duration,
          });
          break;
      }
    },
    [],
  );

  const success = useCallback(
    (message: string, options?: NotificationOptions) => {
      notify(message, "success", options);
    },
    [notify],
  );

  const error = useCallback(
    (message: string, options?: NotificationOptions) => {
      notify(message, "error", options);
    },
    [notify],
  );

  const info = useCallback(
    (message: string, options?: NotificationOptions) => {
      notify(message, "info", options);
    },
    [notify],
  );

  const warning = useCallback(
    (message: string, options?: NotificationOptions) => {
      notify(message, "warning", options);
    },
    [notify],
  );

  return {
    notify,
    success,
    error,
    info,
    warning,
  };
}
