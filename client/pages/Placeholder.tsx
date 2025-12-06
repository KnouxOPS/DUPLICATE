import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface PlaceholderProps {
  title: string;
  description: string;
  icon: React.ReactNode;
}

export default function Placeholder({
  title,
  description,
  icon,
}: PlaceholderProps) {
  const { setCurrentPage } = useApp();

  return (
    <div className="h-screen w-full bg-background dark:bg-slate-900 flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="mb-6 flex justify-center text-6xl">{icon}</div>
        <h1 className="text-3xl font-bold text-foreground mb-3">{title}</h1>
        <p className="text-muted-foreground mb-8">{description}</p>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This page is ready to be implemented. Let me know what you'd like to
            add here!
          </p>

          <Button
            onClick={() => setCurrentPage("dashboard")}
            variant="outline"
            className="w-full flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
