import { useTranslation } from 'react-i18next';

/**
 * Hook to calculate section completion status and return formatted label.
 * @param sectionsObject - Logically grouped sections where each value has a 'completed' property.
 */
export function useSectionsStatus(sectionsObject: Record<string, { completed: boolean }>) {
  const { t } = useTranslation(['common']);

  const sections = Object.values(sectionsObject);
  const completedSectionsCount = sections.filter((section) => section.completed).length;
  const totalSectionsCount = sections.length;
  const allSectionsCompleted = completedSectionsCount === totalSectionsCount;

  const completedSectionsLabel = t('common:sections-completed', {
    number: completedSectionsCount,
    count: totalSectionsCount,
  });

  return {
    completedSectionsCount,
    totalSectionsCount,
    allSectionsCompleted,
    completedSectionsLabel,
  };
}
