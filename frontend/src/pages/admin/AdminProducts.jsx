import React from 'react';
import Catalogue from '../../components/Catalogue.jsx';
import { useAdminAuth } from '../../contexts/AdminAuthContext.jsx';

export default function AdminProducts() {
  const { role, loading } = useAdminAuth();
  if (loading) return null;
  if (role !== 'superadmin') return <p role="alert" style={{ padding: 24 }}>Only the super admin can manage the product catalogue.</p>;
  return <Catalogue admin />;
}
