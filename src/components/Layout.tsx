import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { UserProfile } from '../App';

interface LayoutProps {
  profile: UserProfile | null;
}

export default function Layout({ profile }: LayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900 relative">
      {/* Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[10%] left-[10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[10%] right-[10%] w-[40%] h-[40%] bg-green-500/10 rounded-full blur-[120px]"></div>
      </div>

      {/* Sidebar - Left Menu */}
      <Sidebar profile={profile} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen relative z-10">
        {/* Navbar - Top Bar */}
        <Navbar profile={profile} />

        {/* Content */}
        <main className="p-6 sm:p-10 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
