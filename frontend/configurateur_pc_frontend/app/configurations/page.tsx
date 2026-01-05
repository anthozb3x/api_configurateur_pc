'use client';

import { useState, useEffect } from 'react';
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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Search, Eye, Trash2, Plus, X, Download } from 'lucide-react';
import type { Configuration, User, Component, Merchant, Category } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

interface ConfigurationComponent {
  component: string;
  quantity: number;
  selectedMerchant?: string;
}

export default function ConfigurationsPage() {
  const [configurations, setConfigurations] = useState<Configuration[]>([]);
  const [components, setComponents] = useState<Component[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConfig, setSelectedConfig] = useState<Configuration | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    currency: 'EUR',
    selectedComponents: [] as ConfigurationComponent[],
  });
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedComponent, setSelectedComponent] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [configs, comps, cats, mers] = await Promise.all([
        api.getConfigurations(),
        api.getComponents(),
        api.getCategories(),
        api.getMerchants(),
      ]);
      setConfigurations(configs);
      setComponents(comps);
      setCategories(cats);
      setMerchants(mers);
    } catch (error: any) {
      toast.error('Erreur lors du chargement des données');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewConfig = async (config: Configuration) => {
    try {
      const configData = await api.getConfiguration(config._id);
      setSelectedConfig(configData);
      setIsDialogOpen(true);
    } catch (error: any) {
      toast.error('Erreur lors du chargement des détails');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette configuration ?'))
      return;

    try {
      await api.deleteConfiguration(id);
      toast.success('Configuration supprimée');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la suppression');
    }
  };

  const handleExportPDF = async (id: string) => {
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

  const handleAddComponent = () => {
    if (!selectedComponent) {
      toast.error('Veuillez sélectionner un composant');
      return;
    }

    const component = components.find((c) => c._id === selectedComponent);
    if (!component) return;

    // Vérifier si le composant est déjà ajouté
    if (formData.selectedComponents.some((c) => c.component === selectedComponent)) {
      toast.error('Ce composant est déjà dans la configuration');
      return;
    }

    setFormData({
      ...formData,
      selectedComponents: [
        ...formData.selectedComponents,
        {
          component: selectedComponent,
          quantity: 1,
          selectedMerchant: undefined,
        },
      ],
    });
    setSelectedComponent('');
  };

  const handleRemoveComponent = (index: number) => {
    setFormData({
      ...formData,
      selectedComponents: formData.selectedComponents.filter((_, i) => i !== index),
    });
  };

  const handleCreateConfiguration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.selectedComponents.length === 0) {
      toast.error('Veuillez ajouter au moins un composant');
      return;
    }

    try {
      await api.createConfiguration({
        name: formData.name,
        components: formData.selectedComponents.map((comp) => ({
          component: comp.component,
          quantity: comp.quantity,
          selectedMerchant: comp.selectedMerchant || undefined,
        })),
      });
      toast.success('Configuration créée avec succès');
      setIsCreateDialogOpen(false);
      setFormData({
        name: '',
        currency: 'EUR',
        selectedComponents: [],
      });
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la création');
    }
  };

  const filteredConfigurations = configurations.filter((config) => {
    const user =
      typeof config.user === 'string'
        ? 'Utilisateur'
        : `${config.user.firstName} ${config.user.lastName}`;
    return (
      config.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const filteredComponents = components.filter((comp) => {
    if (selectedCategory && typeof comp.category === 'string') {
      return comp.category === selectedCategory;
    }
    if (selectedCategory && typeof comp.category === 'object') {
      return comp.category._id === selectedCategory;
    }
    return true;
  });

  const getComponentMerchants = (componentId: string) => {
    return merchants.filter((merchant) =>
      merchant.prices.some(
        (price) =>
          (typeof price.component === 'string'
            ? price.component
            : price.component._id) === componentId
      )
    );
  };

  const getComponentPrice = (
    componentId: string,
    selectedMerchantId?: string
  ): number => {
    const component = components.find((c) => c._id === componentId);
    if (!component) return 0;

    // Si un marchand est sélectionné, utiliser son prix
    if (selectedMerchantId) {
      const merchant = merchants.find((m) => m._id === selectedMerchantId);
      if (merchant) {
        const merchantPrice = merchant.prices.find(
          (p) =>
            (typeof p.component === 'string'
              ? p.component
              : p.component._id) === componentId
        );
        if (merchantPrice) {
          return merchantPrice.price;
        }
      }
    }

    // Sinon, utiliser le prix du composant
    return component.price || 0;
  };

  const calculateTotal = (): number => {
    return formData.selectedComponents.reduce((total, comp) => {
      const price = getComponentPrice(comp.component, comp.selectedMerchant);
      return total + price * comp.quantity;
    }, 0);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestion des Configurations</h1>
            <p className="text-muted-foreground">
              Consultez et gérez les configurations de PC sauvegardées
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Créer une configuration
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Créer une nouvelle configuration</DialogTitle>
                <DialogDescription>
                  Sélectionnez les composants pour créer votre configuration PC
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateConfiguration} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom de la configuration *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                    placeholder="Ex: PC Gaming, Workstation..."
                  />
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Ajouter un composant</Label>
                    <div className="flex gap-2 mt-2">
                      <Select
                        value={selectedCategory}
                        onValueChange={setSelectedCategory}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Filtrer par catégorie" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Toutes les catégories</SelectItem>
                          {categories.map((cat) => (
                            <SelectItem key={cat._id} value={cat._id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={selectedComponent}
                        onValueChange={setSelectedComponent}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Sélectionner un composant" />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredComponents.map((comp) => (
                            <SelectItem key={comp._id} value={comp._id}>
                              {comp.title} - {comp.brand} ({comp.model})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        onClick={handleAddComponent}
                        disabled={!selectedComponent}
                      >
                        Ajouter
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Composants sélectionnés ({formData.selectedComponents.length})</Label>
                    {formData.selectedComponents.length === 0 ? (
                      <p className="text-sm text-muted-foreground p-4 border rounded-lg">
                        Aucun composant sélectionné
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {formData.selectedComponents.map((selectedComp, index) => {
                          const component = components.find(
                            (c) => c._id === selectedComp.component
                          );
                          const componentMerchants = getComponentMerchants(
                            selectedComp.component
                          );
                          return (
                            <div
                              key={index}
                              className="rounded-lg border p-4 space-y-3"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="font-medium">
                                    {component?.title || 'Composant'}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {component?.brand} - {component?.model}
                                  </p>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRemoveComponent(index)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                              <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                  <Label>Quantité</Label>
                                  <Input
                                    type="number"
                                    min="1"
                                    value={selectedComp.quantity}
                                    onChange={(e) => {
                                      const newComponents = [...formData.selectedComponents];
                                      newComponents[index].quantity = parseInt(
                                        e.target.value
                                      ) || 1;
                                      setFormData({
                                        ...formData,
                                        selectedComponents: newComponents,
                                      });
                                    }}
                                  />
                                </div>
                                {componentMerchants.length > 0 && (
                                  <div className="space-y-2">
                                    <Label>Partenaire (optionnel)</Label>
                                    <Select
                                      value={selectedComp.selectedMerchant || ''}
                                      onValueChange={(value) => {
                                        const newComponents = [
                                          ...formData.selectedComponents,
                                        ];
                                        newComponents[index].selectedMerchant = value;
                                        setFormData({
                                          ...formData,
                                          selectedComponents: newComponents,
                                        });
                                      }}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Aucun partenaire" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="">Aucun partenaire</SelectItem>
                                        {componentMerchants.map((merchant) => {
                                          const price = merchant.prices.find(
                                            (p) =>
                                              (typeof p.component === 'string'
                                                ? p.component
                                                : p.component._id) ===
                                              selectedComp.component
                                          );
                                          return (
                                            <SelectItem
                                              key={merchant._id}
                                              value={merchant._id}
                                            >
                                              {merchant.name}
                                              {price && ` - ${price.price.toFixed(2)} €`}
                                            </SelectItem>
                                          );
                                        })}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                )}
                                <div className="space-y-2">
                                  <Label>Prix</Label>
                                  <div className="flex items-center h-10 px-3 py-2 text-sm border rounded-md bg-muted">
                                    {getComponentPrice(
                                      selectedComp.component,
                                      selectedComp.selectedMerchant
                                    ).toFixed(2)}{' '}
                                    {formData.currency} / unité
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    Total:{' '}
                                    {(
                                      getComponentPrice(
                                        selectedComp.component,
                                        selectedComp.selectedMerchant
                                      ) * selectedComp.quantity
                                    ).toFixed(2)}{' '}
                                    {formData.currency}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {formData.selectedComponents.length > 0 && (
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Nombre de composants: {formData.selectedComponents.length}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Total</p>
                        <p className="text-2xl font-bold">
                          {calculateTotal().toFixed(2)} {formData.currency}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsCreateDialogOpen(false);
                      setFormData({
                        name: '',
                        currency: 'EUR',
                        selectedComponents: [],
                      });
                    }}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" disabled={formData.selectedComponents.length === 0}>
                    Créer la configuration
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom ou utilisateur..."
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
                <TableHead>Utilisateur</TableHead>
                <TableHead>Composants</TableHead>
                <TableHead>Coût total</TableHead>
                <TableHead>Date de création</TableHead>
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
              ) : filteredConfigurations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    Aucune configuration trouvée
                  </TableCell>
                </TableRow>
              ) : (
                filteredConfigurations.map((config) => {
                  const user =
                    typeof config.user === 'string'
                      ? 'Utilisateur'
                      : `${config.user.firstName} ${config.user.lastName}`;
                  return (
                    <TableRow key={config._id}>
                      <TableCell className="font-medium">{config.name}</TableCell>
                      <TableCell>{user}</TableCell>
                      <TableCell>{config.components.length}</TableCell>
                      <TableCell>
                        {config.totalCost.toFixed(2)} {config.currency}
                      </TableCell>
                      <TableCell>
                        {new Date(config.createdAt).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewConfig(config)}
                            title="Voir les détails"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleExportPDF(config._id)}
                            title="Exporter en PDF"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(config._id)}
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle>{selectedConfig?.name}</DialogTitle>
                  <DialogDescription>
                    Détails de la configuration
                  </DialogDescription>
                </div>
                {selectedConfig && (
                  <Button
                    variant="outline"
                    onClick={() => handleExportPDF(selectedConfig._id)}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Exporter en PDF
                  </Button>
                )}
              </div>
            </DialogHeader>
            {selectedConfig && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Coût total</p>
                    <p className="text-2xl font-bold">
                      {selectedConfig.totalCost.toFixed(2)} {selectedConfig.currency}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Composants</p>
                    <p className="text-2xl font-bold">
                      {selectedConfig.components.length}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold">Composants</h3>
                  <div className="space-y-2">
                    {selectedConfig.components.map((comp, index) => {
                      const component =
                        typeof comp.component === 'string'
                          ? null
                          : comp.component;
                      const merchant =
                        typeof comp.selectedMerchant === 'string'
                          ? null
                          : comp.selectedMerchant;
                      return (
                        <div key={index} className="rounded-lg border p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">
                                {component?.title || 'Composant'}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Quantité: {comp.quantity}
                                {comp.price && ` • Prix unitaire: ${comp.price.toFixed(2)} €`}
                                {comp.price && comp.quantity > 1 && (
                                  <span>
                                    {' '}
                                    • Total: {(comp.price * comp.quantity).toFixed(2)} €
                                  </span>
                                )}
                              </p>
                              {merchant && (
                                <Badge variant="outline" className="mt-1">
                                  {merchant.name}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
