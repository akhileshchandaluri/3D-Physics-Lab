import type { ExperimentRegistryEntry } from './types';

export const EXPERIMENT_REGISTRY: ExperimentRegistryEntry[] = [
  {
    id: 'ohms-law',
    code: 'Session 01',
    title: "Introductory Session — Ohm's Law",
    path: '/experiments/ohms-law',
    available: true,
    load: () => import('./adapters/OhmsLawAdapter'),
    wrapperStyle: { minHeight: '100vh', background: '#f4f4f4' },
  },
  {
    id: 'lattice-constant',
    code: 'Session 02',
    title: 'Determination of Lattice Constant',
    path: '/experiments/lattice-constant',
    available: true,
    load: () => import('./latticeConstant/LatticeConstant'),
    wrapperStyle: { minHeight: '100vh', background: 'var(--surface-primary)' },
  },
  {
    id: 'lycopodium-laser',
    code: 'Session 03',
    title: 'Determination of Particle Size of Lycopodium Powder Using Laser',
    path: '/experiments/lycopodium-laser',
    available: true,
    load: () => import('./lycopodiumLaser/LycopodiumLaser'),
    wrapperStyle: { minHeight: '100vh', background: 'var(--surface-primary)' },
  },
  {
    id: 'youngs-modulus',
    code: 'Session 04',
    title: "Determination of Young's Modulus — Uniform Bending Method",
    path: '/experiments/youngs-modulus',
    available: true,
    load: () => import('./youngsModulus/YoungsModulus'),
    wrapperStyle: { minHeight: '100vh', background: 'var(--surface-primary)' },
  },
  {
    id: 'creep-constant',
    code: 'Session 05',
    title: 'Determination of Creep Constant',
    path: '/experiments/creep-constant',
    available: true,
    load: () => import('./adapters/CreepConstantAdapter'),
    wrapperStyle: { minHeight: '100vh', background: 'var(--surface-primary)' },
  },
  {
    id: 'hall-effect',
    code: 'Session 06',
    title: 'Determination of Hall Coefficient Using Hall Effect',
    path: '/experiments/hall-effect',
    available: true,
    load: () => import('./hallEffect/HallEffect'),
    wrapperStyle: { minHeight: '100vh', background: 'var(--surface-primary)' },
  },
  {
    id: 'plancks-constant',
    code: 'Session 07',
    title: "Determination of Planck's Constant",
    path: '',
    available: false,
  },
  {
    id: 'solar-cell',
    code: 'Session 08',
    title: 'Solar Cell Characteristics',
    path: '',
    available: false,
  },
  {
    id: 'laser-grating',
    code: 'Session 09',
    title: 'Determination of Wavelength of Laser Using Diffraction Grating',
    path: '/experiments/laser-grating',
    available: true,
    load: () => import('./laserGrating/LaserGrating'),
    wrapperStyle: { minHeight: '100vh', background: 'var(--surface-primary)' },
  },
];

export function getExperimentRoutePath(id: string): string {
  return `/experiments/${id}`;
}

export function getExperimentRegistryEntry(id: string): ExperimentRegistryEntry | undefined {
  return EXPERIMENT_REGISTRY.find((entry) => entry.id === id);
}
