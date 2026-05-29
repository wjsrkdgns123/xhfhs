// #25 (incremental step 13): lazy route registry + path maps extracted from App.tsx.
// Lazy-load heavy views — keeps initial bundle small for first paint.
import { lazy } from 'react';
import type { StaticPage } from './types';

export const LegalPages = {
  Privacy: lazy(() =>
    import('./components/LegalPages').then((m) => ({ default: m.PrivacyView })),
  ),
  Terms: lazy(() =>
    import('./components/LegalPages').then((m) => ({ default: m.TermsView })),
  ),
  About: lazy(() =>
    import('./components/LegalPages').then((m) => ({ default: m.AboutView })),
  ),
  Contact: lazy(() =>
    import('./components/LegalPages').then((m) => ({ default: m.ContactView })),
  ),
};

export const ContentPages = {
  Topics: lazy(() =>
    import('./components/content/TopicsView').then((m) => ({ default: m.TopicsView })),
  ),
  Fallacies: lazy(() =>
    import('./components/content/FallaciesView').then((m) => ({ default: m.FallaciesView })),
  ),
  Glossary: lazy(() =>
    import('./components/content/GlossaryView').then((m) => ({ default: m.GlossaryView })),
  ),
  Famous: lazy(() =>
    import('./components/content/FamousDebatesView').then((m) => ({ default: m.FamousDebatesView })),
  ),
  Samples: lazy(() =>
    import('./components/content/SamplesView').then((m) => ({ default: m.SamplesView })),
  ),
  Formats: lazy(() =>
    import('./components/content/FormatsView').then((m) => ({ default: m.FormatsView })),
  ),
  Resources: lazy(() =>
    import('./components/content/ResourcesView').then((m) => ({ default: m.ResourcesView })),
  ),
};

export const NotFoundView = lazy(() =>
  import('./components/NotFoundView').then((m) => ({ default: m.NotFoundView })),
);
export const LearnView = lazy(() =>
  import('./components/LearnView').then((m) => ({ default: m.LearnView })),
);
export const LandingView = lazy(() =>
  import('./components/LandingView').then((m) => ({ default: m.LandingView })),
);

export const STATIC_PATH_MAP: Record<string, StaticPage> = {
  '/privacy': 'privacy',
  '/terms': 'terms',
  '/about': 'about',
  '/contact': 'contact',
  '/topics': 'topics',
  '/fallacies': 'fallacies',
  '/glossary': 'glossary',
  '/famous': 'famous',
  '/samples': 'samples',
  '/formats': 'formats',
  '/resources': 'resources',
};

export const KNOWN_PATHS = new Set(['/', ...Object.keys(STATIC_PATH_MAP)]);
