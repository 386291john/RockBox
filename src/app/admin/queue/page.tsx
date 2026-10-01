import { AdminDashboard } from "@/components/admin/AdminDashboard";

// La gestión de la cola (ver actual, saltar, pausar/reanudar, eliminar) vive
// en el mismo panel que el dashboard, que ya es tiempo real.
export const dynamic = "force-dynamic";

export default function AdminQueuePage() {
  return <AdminDashboard />;
}
