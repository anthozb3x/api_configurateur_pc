'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Search, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { User, Configuration } from '@/lib/types';

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userConfigurations, setUserConfigurations] = useState<Configuration[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (error: any) {
      toast.error('Erreur lors du chargement des utilisateurs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewUser = async (user: User) => {
    try {
      const userData = await api.getUser(user._id);
      // L'API retourne { user, configurations }
      setSelectedUser(userData.user);
      setUserConfigurations(userData.configurations || []);
      setIsDialogOpen(true);
    } catch (error: any) {
      toast.error('Erreur lors du chargement des détails');
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Utilisateurs</h1>
          <p className="text-muted-foreground">
            Consultez la liste des utilisateurs et leurs configurations
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Date d'inscription</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    Chargement...
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    Aucun utilisateur trouvé
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell className="font-medium">
                      {user.firstName} {user.lastName}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <span
                        className={`rounded-full px-2 py-1 text-xs ${
                          user.role === 'admin'
                            ? 'bg-primary/10 text-primary'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {user.role === 'admin' ? 'Administrateur' : 'Utilisateur'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push(`/users/${user._id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Détails de {selectedUser?.firstName} {selectedUser?.lastName}
              </DialogTitle>
              <DialogDescription>
                Informations de profil et configurations sauvegardées
              </DialogDescription>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="font-semibold">Informations de profil</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{selectedUser.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Rôle</p>
                      <p className="font-medium">
                        {selectedUser.role === 'admin'
                          ? 'Administrateur'
                          : 'Utilisateur'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Date d'inscription
                      </p>
                      <p className="font-medium">
                        {new Date(selectedUser.createdAt).toLocaleDateString(
                          'fr-FR'
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold">
                    Configurations ({userConfigurations.length})
                  </h3>
                  {userConfigurations.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Aucune configuration sauvegardée
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {userConfigurations.map((config) => (
                        <div
                          key={config._id}
                          className="rounded-lg border p-4"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{config.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {config.components.length} composant(s) •{' '}
                                {config.totalCost.toFixed(2)} {config.currency}
                              </p>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {new Date(config.createdAt).toLocaleDateString(
                                'fr-FR'
                              )}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}

