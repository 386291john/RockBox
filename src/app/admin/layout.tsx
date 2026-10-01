import { getCurrentAdmin } from "@/lib/auth/current";
import { AdminNav } from "@/components/admin/AdminNav";

// Layout del panel de administración. El middleware ya garantiza la sesión;
// aquí obtenemos los datos para la barra de navegación.
export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentAdmin();

  // La página de login usa este layout pero no tiene sesión: la renderiza sola.
  if (!session) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen">
      <AdminNav email={session.email} barId={session.barId} />
      <div className="mx-auto max-w-5xl px-4 py-6">{children}</div>
    </div>
  );
}
