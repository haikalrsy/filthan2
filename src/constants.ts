export const CLASSES = [
  // Grade 10
  '10 RPL', '10 MP', '10 AK 1', '10 AK 2', '10 BR 1', '10 BR 2', '10 DKV',
  // Grade 11
  '11 RPL 1', '11 RPL 2', '11 AK 1', '11 AK 2', '11 DKV', '11 MP', '11 BR 1', '11 BR 2',
  // Grade 12
  '12 RPL', '12 MP 1', '12 MP 2', '12 AK 1', '12 AK 2', '12 BR 1', '12 BR 2', '12 DKV'
];

export const getGrade = (className: string): number => {
  if (className.startsWith('10')) return 10;
  if (className.startsWith('11')) return 11;
  if (className.startsWith('12')) return 12;
  return 0;
};
