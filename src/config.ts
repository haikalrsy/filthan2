export const CONFIG = {
  ADMIN_EMAIL: 'demianfilan@gmail.com',
  // You can add more admin emails here
  SECONDARY_ADMIN_EMAILS: ['haikalrasyaputra@gmail.com', 'filandemian@gmail.com'],
};

export const isAdmin = (email: string | undefined) => {
  if (!email) return false;
  const normalized = email.toLowerCase().trim();
  return normalized === CONFIG.ADMIN_EMAIL.toLowerCase().trim() || 
         CONFIG.SECONDARY_ADMIN_EMAILS.map(e => e.toLowerCase().trim()).includes(normalized);
};
