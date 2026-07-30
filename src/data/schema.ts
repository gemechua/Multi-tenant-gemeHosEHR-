import React from 'react';
import { PATIENT_MODULE_ENTITIES } from './ehr_schema/module1';
import { LEGACY_ENTITIES } from './ehr_schema/legacy';
import { MODULES_ENTITIES } from './ehr_schema/modules_dynamic';
import { 
  Activity, Users, Pill, Calendar, FileText, Settings2, CreditCard, 
  Bell, TrendingUp, DollarSign, Heart, Package, Home, Shield, 
  Search, Plus, Trash2, Database, DatabaseZap, Info, X, ChevronRight, Check,
  Edit, SlidersHorizontal, MoreHorizontal, Upload, Download,
  QrCode, Printer, Bed, AlertTriangle, LogIn, Link2,
  Syringe, Scissors, List
} from 'lucide-react';

export interface EntityConfig {
  id: string;
  name: string;
  collectionName: string;
  icon: React.ComponentType<any>;
  subtitle: string;
  description: string;
  searchPlaceholder?: string;
  fields: {
    key: string;
    label: string;
    type: 'string' | 'number' | 'select' | 'date' | 'date-time' | 'items' | 'textarea' | 'checkbox' | 'array' | 'camera' | 'file';
    placeholder?: string;
    options?: string[];
    required?: boolean;
    defaultValue?: string;
  }[];
  defaultSeed: Record<string, any>[];
}

// ... (schema definitions)

export const ENTITIES_CONFIG: Record<string, EntityConfig> = {
  ...PATIENT_MODULE_ENTITIES,
  ...LEGACY_ENTITIES,
  ...MODULES_ENTITIES,
};

export const ENTITIES_ORDER = [
  // 1. PRIMARY CLINICAL FORMS (1.1.1 SERIES, 1.1.1 TO 1.1.1.Z)
  ...Object.keys(PATIENT_MODULE_ENTITIES).filter(k => k.startsWith('Form_1_1_1')).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
  
  // 4. LOGISTICS & INVENTORY
  'Bed',
  
  // 6. DYNAMIC MODULES (2 - 12)
  'DynamicModuleSubmissions',
  
  // 7. STAFF & ADMINISTRATION / FINANCIALS
  'Staff',
  'User',
  'InsuranceClaim'
];
