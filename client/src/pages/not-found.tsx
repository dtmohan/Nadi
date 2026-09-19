import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="max-w-sm">
        <h1 className="text-lg font-semibold">Nothing here</h1>
        <p className="mt-2 text-sm text-muted-foreground">This page does not exist. Cast a chart or open a saved one from the sidebar.</p>
        <Button asChild className="mt-4" data-testid="button-go-home">
          <Link href="/">New chart</Link>
        </Button>
      </div>
    </div>
  );
}
