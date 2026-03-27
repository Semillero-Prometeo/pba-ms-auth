import { CreatePersonDto } from '../dto/create-person.dto';
import { person } from '@prisma/client';

export const hasPersonChanged = (newPerson: CreatePersonDto, existingPerson: person): boolean => {
  let personChanged = false;

  const personPropertiesToCompare: (keyof CreatePersonDto)[] = [
    'first_name',
    'last_name',
    'email',
    'phone',
    'country_id',
    'image_url',
  ];

  for (const prop of personPropertiesToCompare) {
    const newValue = newPerson[prop];
    const existingValue = existingPerson[prop];

    if (normalizeValue(newValue) !== normalizeValue(existingValue)) {
      personChanged = true;
    }
  }

  return personChanged;
};

export const normalizeValue = (value: any): string | null => {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  return String(value).trim();
};
