'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import type { User, Configuration } from '@/lib/types';

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [configurations, setConfigurations] = useState<Configuration[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await api.getUser(id);
        setUser(data.user);
        setConfigurations(data.configurations || []);
      } catch (error: any) {
        toast.error('Erreur lors du chargement de l\'utilisateur');
        router.push('/users');
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, [id, router]);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </MainLayout>
    );
  }

  if (!user) return null;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/users')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {user.firstName} {user.lastName}
            </h1>
            <p className="text-muted-foreground">Détails de l'utilisateur</p>
          </div>
        </div>

        <div className="rounded-lg border p-6 space-y-4">
          <h2 className="text-lg font-semibold">Informations de profil</h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Rôle</p>
              <span
                className={`inline-block rounded-full px-2 py-1 text-xs ${
                  user.role === 'admin'
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {user.role === 'admin' ? 'Administrateur' : 'Utilisateur'}
              </span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Date d'inscription</p>
              <p className="font-medium">
                {new Date(user.createdAt).toLocaleDateString('fr-FR')}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">
            Configurations ({configurations.length})
          </h2>
          {configurations.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucune configuration sauvegardée
            </p>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Composants</TableHead>
                    <TableHead>Coût total</TableHead>
                    <TableHead>Date de création</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {configurations.map((config) => (
                    <TableRow key={config._id}>
                      <TableCell className="font-medium">{config.name}</TableCell>
                      <TableCell>{config.components.length}</TableCell>
                      <TableCell>
                        {config.totalCost.toFixed(2)} {config.currency}
                      </TableCell>
                      <TableCell>
                        {new Date(config.createdAt).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() =>
                            router.push(`/configurations/${config._id}`)
                          }
                        >
                          Voir
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
