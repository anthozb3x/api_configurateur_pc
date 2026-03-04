'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { AdminOnly } from '@/components/admin-only';
import { Button } from '@/components/ui/button';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Plus, Edit, Trash2 } from 'lucide-react';
import type { Merchant } from '@/lib/types';

export default function MerchantsPage() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMerchant, setEditingMerchant] = useState<Merchant | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    websiteUrl: '',
    logoUrl: '',
    commissionRate: '',
    affiliationConditions: '',
    isActive: true,
  });

  useEffect(() => {
    fetchMerchants();
  }, []);

  const fetchMerchants = async () => {
    try {
      const data = await api.getMerchants();
      setMerchants(data);
    } catch (error: any) {
      toast.error('Erreur lors du chargement des partenaires');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (merchant?: Merchant) => {
    if (merchant) {
      setEditingMerchant(merchant);
      setFormData({
        name: merchant.name,
        websiteUrl: merchant.websiteUrl,
        logoUrl: merchant.logoUrl || '',
        commissionRate: merchant.commissionRate?.toString() || '',
        affiliationConditions: merchant.affiliationConditions || '',
        isActive: merchant.isActive,
      });
    } else {
      setEditingMerchant(null);
      setFormData({
        name: '',
        websiteUrl: '',
        logoUrl: '',
        commissionRate: '',
        affiliationConditions: '',
        isActive: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        commissionRate: formData.commissionRate
          ? parseFloat(formData.commissionRate)
          : undefined,
        affiliationConditions: formData.affiliationConditions || undefined,
        logoUrl: formData.logoUrl || undefined,
      };

      if (editingMerchant) {
        await api.updateMerchant(editingMerchant._id, data);
        toast.success('Partenaire mis à jour');
      } else {
        await api.createMerchant(data);
        toast.success('Partenaire créé');
      }

      setIsDialogOpen(false);
      fetchMerchants();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la sauvegarde');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce partenaire ?')) return;

    try {
      await api.deleteMerchant(id);
      toast.success('Partenaire supprimé');
      fetchMerchants();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la suppression');
    }
  };

  return (
    <MainLayout>
      <AdminOnly>
        <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestion des Partenaires</h1>
            <p className="text-muted-foreground">
              Gérez les partenaires marchands et leurs prix
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Ajouter un partenaire
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingMerchant ? 'Modifier' : 'Ajouter'} un partenaire
                </DialogTitle>
                <DialogDescription>
                  Remplissez les informations du partenaire marchand
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="websiteUrl">URL du site *</Label>
                  <Input
                    id="websiteUrl"
                    type="url"
                    value={formData.websiteUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, websiteUrl: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="logoUrl">URL du logo</Label>
                  <Input
                    id="logoUrl"
                    type="url"
                    value={formData.logoUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, logoUrl: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="commissionRate">
                    Taux de commission (%)
                  </Label>
                  <Input
                    id="commissionRate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.commissionRate}
                    onChange={(e) =>
                      setFormData({ ...formData, commissionRate: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="affiliationConditions">
                    Conditions d'affiliation
                  </Label>
                  <Textarea
                    id="affiliationConditions"
                    value={formData.affiliationConditions}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        affiliationConditions: e.target.value,
                      })
                    }
                    rows={4}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="isActive" className="cursor-pointer">
                    Partenaire actif
                  </Label>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Annuler
                  </Button>
                  <Button type="submit">
                    {editingMerchant ? 'Modifier' : 'Créer'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Site web</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead>Prix</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    Chargement...
                  </TableCell>
                </TableRow>
              ) : merchants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    Aucun partenaire trouvé
                  </TableCell>
                </TableRow>
              ) : (
                merchants.map((merchant) => (
                  <TableRow key={merchant._id}>
                    <TableCell className="font-medium">{merchant.name}</TableCell>
                    <TableCell>
                      <a
                        href={merchant.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {merchant.websiteUrl}
                      </a>
                    </TableCell>
                    <TableCell>
                      {merchant.commissionRate
                        ? `${merchant.commissionRate}%`
                        : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {merchant.prices.length > 0 ? (
                        <span className="text-sm">
                          {merchant.prices.length} composant{merchant.prices.length > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          Aucun prix défini
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`rounded-full px-2 py-1 text-xs ${
                          merchant.isActive
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                        }`}
                      >
                        {merchant.isActive ? 'Actif' : 'Inactif'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(merchant)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(merchant._id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      </AdminOnly>
    </MainLayout>
  );
}

