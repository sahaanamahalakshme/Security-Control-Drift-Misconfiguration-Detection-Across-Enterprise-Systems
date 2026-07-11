import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, Calendar, BarChart2, Users, Settings, HelpCircle, LogOut, Search, Bell, User } from 'lucide-react';

const SidebarItem = ({ icon: Icon, label, to }: { icon: any, label: string, to: string }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
        isActive ? 'bg-primary/10 text-primary font-medium' : 'text-textSecondary hover:bg-black/5'
      }`
    }
  >
    <Icon size={20} />
    <span>{label}</span>
  </NavLink>
);

const Layout = () => {
  return (
    <div className="flex h-screen bg-background text-textPrimary">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-borderLight flex flex-col h-full hidden md:flex">
        <div className="p-6">
          <div className="text-xl font-bold flex items-center gap-2 text-primary">
            <div className="w-8 h-8 rounded bg-primary text-white flex items-center justify-center">SB</div>
            Secure Baseline
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-2 space-y-1">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" to="/" />
          <SidebarItem icon={CheckSquare} label="Tasks" to="/tasks" />
          <SidebarItem icon={Calendar} label="Calendar" to="/calendar" />
          <SidebarItem icon={BarChart2} label="Analytics" to="/analytics" />
          <SidebarItem icon={Users} label="Team" to="/team" />
        </nav>

        <div className="p-4 border-t border-borderLight space-y-1">
          <SidebarItem icon={Settings} label="Settings" to="/settings" />
          <SidebarItem icon={HelpCircle} label="Help" to="/help" />
          <SidebarItem icon={LogOut} label="Logout" to="/logout" />
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-card border-b border-borderLight flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center bg-background rounded-md px-3 py-1.5 border border-borderLight w-64">
            <Search size={16} className="text-textSecondary mr-2" />
            <input 
              type="text" 
              placeholder="Search anything..." 
              className="bg-transparent border-none outline-none text-sm w-full"
            />
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 text-textSecondary hover:text-primary transition-colors">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-critical rounded-full"></span>
            </button>
            <div className="flex items-center gap-2 border-l border-borderLight pl-4">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                <User size={16} />
              </div>
              <div className="hidden sm:block text-sm">
                <p className="font-medium text-textPrimary leading-none">Admin User</p>
                <p className="text-xs text-textSecondary">admin@securebaseline.com</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
