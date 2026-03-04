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
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { ArrowLeft, Download, Trash2 } from 'lucide-react';
import type { Configuration, Component, Merchant } from '@/lib/types';

export default function ConfigurationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [config, setConfig] = useState<Configuration | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const data = await api.getConfiguration(id);
        setConfig(data);
      } catch (error: any) {
        toast.error('Erreur lors du chargement de la configuration');
        router.push('/configurations');
      } finally {
        setIsLoading(false);
      }
    };
    fetchConfig();
  }, [id, router]);

  const handleExportPDF = async () => {
    try {
      const blob = await api.exportConfigurationPDF(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `configuration-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('PDF exporté avec succès');
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de l\'export PDF');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette configuration ?')) return;
    try {
      await api.deleteConfiguration(id);
      toast.success('Configuration supprimée');
      router.push('/configurations');
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la suppression');
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </MainLayout>
    );
  }

  if (!config) return null;

  const userName =
    typeof config.user === 'string'
      ? 'Utilisateur'
      : `${config.user.firstName} ${config.user.lastName}`;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/configurations')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{config.name}</h1>
              <p className="text-muted-foreground">Détails de la configuration</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportPDF}>
              <Download className="mr-2 h-4 w-4" />
              Exporter PDF
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer
            </Button>
          </div>
        </div>

        <div className="rounded-lg border p-6 space-y-4">
          <h2 className="text-lg font-semibold">Informations</h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Utilisateur</p>
              <p className="font-medium">{userName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Date de création</p>
              <p className="font-medium">
                {new Date(config.createdAt).toLocaleDateString('fr-FR')}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Coût total</p>
              <p className="text-2xl font-bold">
                {config.totalCost.toFixed(2)} {config.currency}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Nombre de composants</p>
              <p className="text-2xl font-bold">{config.components.length}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Composants</h2>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Composant</TableHead>
                  <TableHead>Marque</TableHead>
                  <TableHead>Modèle</TableHead>
                  <TableHead>Partenaire</TableHead>
                  <TableHead className="text-right">Qté</TableHead>
                  <TableHead className="text-right">Prix unitaire</TableHead>
                  <TableHead className="text-right">Total ligne</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {config.components.map((comp, index) => {
                  const component =
                    typeof comp.component === 'string' ? null : (comp.component as Component);
                  const merchant =
                    typeof comp.selectedMerchant === 'string'
                      ? null
                      : (comp.selectedMerchant as Merchant | undefined);
                  const unitPrice = comp.price ?? 0;
                  const lineTotal = unitPrice * comp.quantity;

                  return (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {component?.title || 'Composant'}
                      </TableCell>
                      <TableCell>{component?.brand || '-'}</TableCell>
                      <TableCell>{component?.model || '-'}</TableCell>
                      <TableCell>
                        {merchant ? (
                          <Badge variant="outline">{merchant.name}</Badge>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="text-right">{comp.quantity}</TableCell>
                      <TableCell className="text-right">
                        {unitPrice > 0 ? `${unitPrice.toFixed(2)} €` : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {lineTotal > 0 ? `${lineTotal.toFixed(2)} €` : '-'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
