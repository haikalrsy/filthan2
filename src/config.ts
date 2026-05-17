export const CONFIG = {
  ADMIN_EMAIL: 'demianfilan@gmail.com',
  // You can add more admin emails here
  SECONDARY_ADMIN_EMAILS: ['haikalrasyaputra@gmail.com'],
};

export const isAdmin = (email: string | undefined) => {
  if (!email) return false;
  return email === CONFIG.ADMIN_EMAIL || CONFIG.SECONDARY_ADMIN_EMAILS.includes(email);
};
