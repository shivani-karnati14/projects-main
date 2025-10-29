import {
  MessageSquare,
  Home,
  Camera,
  Upload,
  BarChart3,
  Menu,
  Settings,
  CreditCard,
} from 'lucide-react';

interface NavbarProps {
  activeView: 'home' | 'chat' | 'scan' | 'upload' | 'analysis' | 'cardscanner';
  onNavClick: (view: 'home' | 'chat' | 'scan' | 'upload' | 'analysis' | 'cardscanner') => void;
  isCollapsed: boolean;
  toggleCollapse: () => void;
}

interface NavButtonProps {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  collapsed: boolean;
  onClick: () => void;
}

function NavButton({ label, icon, active, collapsed, onClick }: NavButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`relative flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ease-in-out ${
        collapsed ? 'justify-center px-0' : ''
      } ${active ? 'bg-slate-700 text-cyan-400' : 'text-slate-300 hover:bg-slate-700/50'}`}
    >
      <div className={`w-1 h-full absolute left-0 ${active ? 'bg-cyan-400' : ''}`} />
      {icon}
      {!collapsed && (
        <span
          className={`text-sm font-medium transition-opacity duration-300 ${
            active ? 'text-cyan-400' : 'text-slate-300'
          }`}
        >
          {label}
        </span>
      )}
    </button>
  );
}

function Navbar({ activeView, onNavClick, isCollapsed, toggleCollapse }: NavbarProps) {
  const navItems: Array<{ label: string; icon: React.ReactNode; view: 'home' | 'chat' | 'scan' | 'upload' | 'analysis' | 'cardscanner' }> = [
    { label: 'Home', icon: <Home className="w-5 h-5" />, view: 'home' },
    { label: 'Chatterbox', icon: <MessageSquare className="w-5 h-5" />, view: 'chat' },
    { label: 'Scanner', icon: <Camera className="w-5 h-5" />, view: 'scan' },
    { label: 'Card Scanner', icon: <CreditCard className="w-5 h-5" />, view: 'cardscanner' },
    { label: 'Upload Files', icon: <Upload className="w-5 h-5" />, view: 'upload' },
    { label: 'Analysis', icon: <BarChart3 className="w-5 h-5" />, view: 'analysis' },
  ];

  return (
    <aside
      role="navigation"
      className={`flex flex-col bg-slate-800 border-r border-slate-700/50 transition-all duration-300 ease-in-out overflow-hidden ${
        isCollapsed ? 'w-16' : 'w-72'
      }`}
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center justify-center w-full">
          <div
            className={`flex items-center justify-center rounded-md text-white font-bold bg-gradient-to-r from-purple-400 to-cyan-400 ${
              isCollapsed ? 'w-10 h-10' : 'w-10 h-10'
            }`}
            aria-hidden
          >
            T
          </div>
          {!isCollapsed && (
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Tekisho
            </h1>
          )}
        </div>
        {!isCollapsed && (
          <button
            onClick={toggleCollapse}
            aria-label="Collapse sidebar"
            className="p-2 rounded-md text-slate-300 hover:bg-slate-700/40"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <NavButton
            key={item.view}
            label={item.label}
            icon={item.icon}
            active={activeView === item.view}
            collapsed={isCollapsed}
            onClick={() => onNavClick(item.view)}
          />
        ))}
      </div>

      {/* Settings */}
      <div className="p-4 border-t border-slate-700">
        <NavButton
          label="Settings"
          icon={<Settings className="w-5 h-5" />}
          active={false}
          collapsed={isCollapsed}
          onClick={() => console.log('Navigate to settings')}
        />
      </div>
    </aside>
  );
}

export default Navbar;