'use client';

import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  Package,
  Users,
  FileText,
  Store,
  FolderTree,
  TrendingUp,
  DollarSign,
  Activity,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import type { Component, Category, Configuration, Merchant, User } from '@/lib/types';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

interface DashboardStats {
  components: number;
  users: number;
  configurations: number;
  merchants: number;
  categories: number;
  totalCost: number;
  componentsByCategory: Record<string, number>;
  recentConfigurations: Configuration[];
  recentComponents: Component[];
  activeMerchants: number;
  usersByRole: { admin: number; user: number };
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    components: 0,
    users: 0,
    configurations: 0,
    merchants: 0,
    categories: 0,
    totalCost: 0,
    componentsByCategory: {},
    recentConfigurations: [],
    recentComponents: [],
    activeMerchants: 0,
    usersByRole: { admin: 0, user: 0 },
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [components, users, configurations, merchants, categories] =
          await Promise.all([
            api.getComponents(),
            api.getUsers(),
            api.getConfigurations(),
            api.getMerchants(),
            api.getCategories(),
          ]);

        // Calculer les statistiques
        const totalCost = configurations.reduce(
          (sum, config) => sum + config.totalCost,
          0
        );

        // Composants par catégorie
        const componentsByCategory: Record<string, number> = {};
        components.forEach((comp) => {
          const categoryName =
            typeof comp.category === 'string'
              ? categories.find((c) => c._id === comp.category)?.name || 'Autre'
              : comp.category.name;
          componentsByCategory[categoryName] =
            (componentsByCategory[categoryName] || 0) + 1;
        });

        // Configurations récentes (5 dernières)
        const recentConfigurations = [...configurations]
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
          .slice(0, 5);

        // Composants récents (5 derniers)
        const recentComponents = [...components]
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
          .slice(0, 5);

        // Partenaires actifs
        const activeMerchants = merchants.filter((m) => m.isActive).length;

        // Utilisateurs par rôle
        const usersByRole = {
          admin: users.filter((u) => u.role === 'admin').length,
          user: users.filter((u) => u.role === 'user').length,
        };

        setStats({
          components: components.length,
          users: users.length,
          configurations: configurations.length,
          merchants: merchants.length,
          categories: categories.length,
          totalCost,
          componentsByCategory,
          recentConfigurations,
          recentComponents,
          activeMerchants,
          usersByRole,
        });
      } catch (error) {
        console.error('Erreur lors du chargement des statistiques:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.role === 'admin') {
      fetchStats();
    }
  }, [user]);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex h-96 items-center justify-center">
          <div className="text-muted-foreground">Chargement des statistiques...</div>
        </div>
      </MainLayout>
    );
  }

  const topCategories = Object.entries(stats.componentsByCategory)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Tableau de bord</h1>
            <p className="text-muted-foreground">
              Bienvenue, {user?.firstName} {user?.lastName}
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('fr-FR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>
        </div>

        {/* Statistiques principales */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Composants</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.components}</div>
              <p className="text-xs text-muted-foreground">
                {stats.categories} catégories
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Utilisateurs</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.users}</div>
              <p className="text-xs text-muted-foreground">
                {stats.usersByRole.admin} admin, {stats.usersByRole.user} utilisateurs
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Configurations</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.configurations}</div>
              <p className="text-xs text-muted-foreground">
                Valeur totale: {stats.totalCost.toFixed(2)} €
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Partenaires</CardTitle>
              <Store className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.merchants}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeMerchants} actifs
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Top catégories */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderTree className="h-5 w-5" />
                Top Catégories
              </CardTitle>
              <CardDescription>
                Catégories avec le plus de composants
              </CardDescription>
            </CardHeader>
            <CardContent>
              {topCategories.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Aucune catégorie disponible
                </p>
              ) : (
                <div className="space-y-4">
                  {topCategories.map(([category, count], index) => {
                    const maxCount = topCategories[0][1];
                    const percentage = (count / maxCount) * 100;
                    return (
                      <div key={category} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{category}</span>
                          <span className="text-muted-foreground">{count}</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Configurations récentes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Configurations Récentes
              </CardTitle>
              <CardDescription>
                Les 5 dernières configurations créées
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats.recentConfigurations.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Aucune configuration récente
                </p>
              ) : (
                <div className="space-y-3">
                  {stats.recentConfigurations.map((config) => (
                    <Link
                      key={config._id}
                      href={`/configurations`}
                      className="block rounded-lg border p-3 transition-colors hover:bg-muted"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{config.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {config.components.length} composant(s)
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">
                            {config.totalCost.toFixed(2)} {config.currency}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(config.createdAt).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Composants récents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Composants Récents
              </CardTitle>
              <CardDescription>
                Les 5 derniers composants ajoutés
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats.recentComponents.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Aucun composant récent
                </p>
              ) : (
                <div className="space-y-3">
                  {stats.recentComponents.map((component) => {
                    const categoryName =
                      typeof component.category === 'string'
                        ? 'Catégorie'
                        : component.category.name;
                    return (
                      <Link
                        key={component._id}
                        href={`/components`}
                        className="block rounded-lg border p-3 transition-colors hover:bg-muted"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium">{component.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {component.brand}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {categoryName}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">
                              {new Date(component.createdAt).toLocaleDateString(
                                'fr-FR'
                              )}
                            </p>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Statistiques supplémentaires */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Vue d'ensemble
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Valeur totale des configurations
                  </span>
                  <span className="text-lg font-semibold">
                    {stats.totalCost.toFixed(2)} €
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Partenaires actifs
                  </span>
                  <span className="text-lg font-semibold">
                    {stats.activeMerchants} / {stats.merchants}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Catégories disponibles
                  </span>
                  <span className="text-lg font-semibold">
                    {stats.categories}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Composants par catégorie (moyenne)
                  </span>
                  <span className="text-lg font-semibold">
                    {stats.categories > 0
                      ? Math.round(stats.components / stats.categories)
                      : 0}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Répartition des utilisateurs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Administrateurs</span>
                    <span className="font-semibold">{stats.usersByRole.admin}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{
                        width: `${
                          stats.users > 0
                            ? (stats.usersByRole.admin / stats.users) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Utilisateurs</span>
                    <span className="font-semibold">{stats.usersByRole.user}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-secondary transition-all"
                      style={{
                        width: `${
                          stats.users > 0
                            ? (stats.usersByRole.user / stats.users) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions rapides */}
        <Card>
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
            <CardDescription>
              Accès rapide aux fonctionnalités principales
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <Link
                href="/categories"
                className="flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors hover:bg-muted"
              >
                <FolderTree className="h-8 w-8 text-primary" />
                <span className="text-sm font-medium">Catégories</span>
              </Link>
              <Link
                href="/components"
                className="flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors hover:bg-muted"
              >
                <Package className="h-8 w-8 text-primary" />
                <span className="text-sm font-medium">Composants</span>
              </Link>
              <Link
                href="/users"
                className="flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors hover:bg-muted"
              >
                <Users className="h-8 w-8 text-primary" />
                <span className="text-sm font-medium">Utilisateurs</span>
              </Link>
              <Link
                href="/merchants"
                className="flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors hover:bg-muted"
              >
                <Store className="h-8 w-8 text-primary" />
                <span className="text-sm font-medium">Partenaires</span>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
