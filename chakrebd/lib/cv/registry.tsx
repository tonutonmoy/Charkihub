import type { ComponentType } from 'react';
import type { CVData } from './types';
import { GovtStandardTemplate } from './templates/GovtStandard';
import { ModernCorporateTemplate } from './templates/ModernCorporate';
import { AcademicTemplate } from './templates/Academic';
import { ProfessionalCompactTemplate } from './templates/ProfessionalCompact';

export type CvTemplateRender = ComponentType<{ data: CVData }>;

export const CV_TEMPLATE_COMPONENTS: Record<string, CvTemplateRender> = {
  '1': GovtStandardTemplate,
  '2': ModernCorporateTemplate,
  '3': AcademicTemplate,
  '4': ProfessionalCompactTemplate,
};

export function getTemplateComponent(templateId: string | undefined): CvTemplateRender {
  if (templateId && CV_TEMPLATE_COMPONENTS[templateId]) {
    return CV_TEMPLATE_COMPONENTS[templateId];
  }
  return GovtStandardTemplate;
}
