import { Button } from "@/components/ui/button";

interface SidebarProps {
  user: any;
  balance: any;
  activeSection: string;
  onSectionChange: (section: string) => void;
  onRefresh: () => void;
}

export default function Sidebar({ user, balance, activeSection, onSectionChange, onRefresh }: SidebarProps) {
  const totalBalance = parseFloat(balance?.totalBalance || '0');
  const earnedBalance = parseFloat(balance?.earnedBalance || '0');
  const bonusBalance = parseFloat(balance?.bonusBalance || '0');
  
  const isEligible = totalBalance >= 10 && earnedBalance >= 10;

  return (
    <aside className="w-64 bg-card border-r border-border flex-shrink-0 hidden lg:block">
      <div className="p-6">
        {/* Logo and Branding */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <i className="fas fa-seedling text-white text-xl"></i>
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Grow Casino</h1>
            <p className="text-sm text-muted-foreground">Sheckless Games</p>
          </div>
        </div>
        
        {/* User Balance Card */}
        <div className="bg-secondary/50 backdrop-blur border border-border rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Total Balance</span>
            <span className={`text-xs px-2 py-1 rounded-full ${
              isEligible 
                ? 'bg-accent text-accent-foreground' 
                : 'bg-yellow-500/20 text-yellow-400'
            }`} data-testid="status-withdrawal-eligibility">
              {isEligible ? 'ELIGIBLE' : 'NOT ELIGIBLE'}
            </span>
          </div>
          <div className="text-2xl font-bold text-foreground mb-2" data-testid="text-total-balance">
            {totalBalance.toFixed(1)} SX
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground">Earned:</span>
              <span className="text-accent font-medium ml-1" data-testid="text-earned-balance">
                {earnedBalance.toFixed(1)} SX
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Bonus:</span>
              <span className="text-yellow-400 font-medium ml-1" data-testid="text-bonus-balance">
                {bonusBalance.toFixed(1)} SX
              </span>
            </div>
          </div>
        </div>
        
        {/* Navigation Menu */}
        <nav className="space-y-2">
          <button 
            onClick={() => onSectionChange('dashboard')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${
              activeSection === 'dashboard' 
                ? 'bg-primary text-primary-foreground' 
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
            }`} 
            data-testid="nav-dashboard"
          >
            <i className="fas fa-home"></i>
            Dashboard
          </button>
          <button 
            onClick={() => onSectionChange('games')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${
              activeSection === 'games' 
                ? 'bg-primary text-primary-foreground' 
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
            }`} 
            data-testid="nav-games"
          >
            <i className="fas fa-gamepad"></i>
            Games
          </button>
          <button 
            onClick={() => onSectionChange('history')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${
              activeSection === 'history' 
                ? 'bg-primary text-primary-foreground' 
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
            }`} 
            data-testid="nav-history"
          >
            <i className="fas fa-history"></i>
            History
          </button>
          <button 
            onClick={() => onSectionChange('withdraw')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${
              activeSection === 'withdraw' 
                ? 'bg-primary text-primary-foreground' 
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
            }`} 
            data-testid="nav-withdraw"
          >
            <i className="fas fa-money-bill-wave"></i>
            Withdraw
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors" data-testid="nav-discord">
            <i className="fab fa-discord"></i>
            Discord Bot
          </button>
        </nav>
        
        {/* User Profile */}
        <div className="mt-8 pt-4 border-t border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
              <span className="text-sm font-bold text-white">
                {(user.firstName?.[0] || user.email?.[0] || 'U').toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate" data-testid="text-username">
                {user.firstName || user.email || 'Player'}
              </p>
              <p className="text-xs text-muted-foreground">
                Member since {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => window.location.href = '/api/logout'}
              data-testid="button-logout"
            >
              <i className="fas fa-sign-out-alt"></i>
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}
