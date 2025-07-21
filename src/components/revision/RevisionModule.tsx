import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import RevisionTable from "@/components/revision/RevisionTable";

const RevisionModule: React.FC = () => {
  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Revisión de Contadores y Clientes</CardTitle>
            <CardDescription>
              Gestiona y visualiza los contadores con clientes asignados y sus detalles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RevisionTable />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RevisionModule;
