export type BonTemplate = 'classique' | 'compact' | 'moderne';
export type OrdonnanceTemplate = 'classique' | 'compact' | 'detaille';

export const bonTemplates: {
  value: BonTemplate;
  label: string;
  description: string;
}[] = [
  {
    value: 'classique',
    label: 'Classique',
    description: 'Mise en page traditionnelle avec ordonnance et code-barres',
  },
  {
    value: 'compact',
    label: 'Compact',
    description: 'Format réduit, articles uniquement',
  },
  {
    value: 'moderne',
    label: 'Moderne',
    description: 'En-tête coloré, design épuré',
  },
];

export const ordonnanceTemplates: {
  value: OrdonnanceTemplate;
  label: string;
  description: string;
}[] = [
  {
    value: 'classique',
    label: 'Classique',
    description: 'Tableau OD/OG complet',
  },
  { value: 'compact', label: 'Compact', description: 'Format simplifié' },
  {
    value: 'detaille',
    label: 'Détaillé',
    description: 'Avec Loin / Intermédiaire / Près',
  },
];

const KEY_BON = 'optishop_template_bon';
const KEY_ORD = 'optishop_template_ordonnance';

export const getBonTemplate = (): BonTemplate =>
  (localStorage.getItem(KEY_BON) as BonTemplate) || 'classique';
export const setBonTemplate = (t: BonTemplate) =>
  localStorage.setItem(KEY_BON, t);

export const getOrdonnanceTemplate = (): OrdonnanceTemplate =>
  (localStorage.getItem(KEY_ORD) as OrdonnanceTemplate) || 'classique';
export const setOrdonnanceTemplate = (t: OrdonnanceTemplate) =>
  localStorage.setItem(KEY_ORD, t);
