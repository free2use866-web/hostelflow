import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import { ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="max-w-md text-center"
      >
        <div className="mb-6 inline-flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <span className="text-3xl" aria-hidden>🏛️</span>
        </div>
        <h1
          className="text-5xl font-bold tracking-tight text-foreground"
          style={{ fontFamily: "Lora, serif" }}
        >
          404
        </h1>
        <p className="mt-3 text-lg font-medium text-foreground">
          Page not found
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button
            onClick={() => navigate("/")}
            className="gap-2"
          >
            <Home className="size-4" /> Go to home
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="gap-2"
          >
            <ArrowLeft className="size-4" /> Go back
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
