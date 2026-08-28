import { useNavigate } from "react-router";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <h1
        className="text-5xl font-bold tracking-tight text-foreground"
        style={{ fontFamily: "Lora, serif" }}
      >
        404
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        The page you're looking for doesn't exist.
      </p>
      <button
        onClick={() => navigate("/")}
        className="mt-6 rounded-full bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Go home
      </button>
    </div>
  );
}
