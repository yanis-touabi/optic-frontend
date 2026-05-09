import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye } from "lucide-react";

export default function ResetPassword() {
  const nav = useNavigate();

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-background to-muted/40 p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="h-12 w-12 rounded-lg bg-primary text-primary-foreground grid place-items-center">
            <Eye className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xl font-semibold">OptiShop</div>
            <div className="text-xs text-muted-foreground">Réinitialisation</div>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Non disponible</CardTitle>
            <CardDescription>
              La réinitialisation de mot de passe n'est pas encore disponible sur le nouveau backend.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button type="button" variant="outline" className="w-full" onClick={() => nav("/auth")}>Retour à la connexion</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
