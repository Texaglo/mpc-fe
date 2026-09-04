import AdminHomePage from "./views/homePage/index";
import Games from "./views/Games/index";
import Leaderboards from "./views/Leaderboards/index";
import Achievement from "./views/Achievements";
import Tournament from "./views/Tournament";
import ConversionRate from "./views/ConversionRate";
import Swap from "./views/Swap";
import gameStore from "./views/Game Store";
import PendingWithdrawals from "./views/PendingWithdrawals";
import Users from "./views/Users";
import Settings from "./views/Settings";
import Marketplace from "./views/Marketplace";
import MpceLedger from "./views/MpceLedger";
import Progress from "./views/Progress";
import Cashier from "./views/Cashier";
import AuditLog from "./views/AuditLog";
import HandHistory from "./views/HandHistory";
import FreePlay from "./views/FreePlay";

var routes = [
  {
    layout: "/home",
    path: "/dashboard",
    name: "Dashboard",
    sidebarName: "Overview",
    component: AdminHomePage,
    icon: "tim-icons icon-chart-pie-36",
    permission: 'overview.view',
  },
  {
    layout: "/home",
    path: "/mpce-ledger",
    name: "House MPCE Ledger",
    component: MpceLedger,
    icon: "tim-icons icon-bank",
    hidden: true,
    permission: 'economy.view',
  },
  {
    layout: "/home",
    path: "/progress",
    name: "Launch Progress",
    component: Progress,
    icon: "tim-icons icon-check-2",
    hidden: true,
    permission: 'overview.view',
  },
  {
    layout: "/home",
    path: "/games",
    name: "Games",
    component: Games,
    icon: "tim-icons icon-controller",
    permission: ['games.view', 'bots.view', 'bots.manage'],
  },
  {
    layout: "/home",
    path: "/leaderboards",
    name: "Leaderboards",
    component: Leaderboards,
    icon: "tim-icons icon-planet",
    hidden: true,
    permission: 'players.view',
  },
  {
    layout: "/home",
    path: "/hand-history",
    name: "Hand History",
    component: HandHistory,
    icon: "tim-icons icon-notes",
    hidden: true,
    permission: 'hand_history.view',
  },
  // {
  //   layout: "/home",
  //   path: "/conversion-rate",
  //   name: "Conversion Rate",
  //   component: ConversionRate,
  //   icon: "tim-icons icon-money-coins",
  // },
  // {
  //   layout: "/home",
  //   path: "/swap",
  //   name: "Swap",
  //   component: Swap,
  //   icon: "tim-icons icon-wallet-43",
  // },
  {
    layout: "/home",
    path: "/game-store",
    name: "Game Store",
    sidebarName: "Commerce",
    component: gameStore,
    icon: "tim-icons icon-bag-16",
    permission: 'commerce.view',
  },
  {
    layout: "/home",
    path: "/marketplace",
    name: "Marketplace",
    component: Marketplace,
    icon: "tim-icons icon-cart",
    hidden: true,
    permission: 'commerce.view',
  },
  {
    layout: "/home",
    path: "/achievement",
    name: "Achievements",
    component: Achievement,
    icon: "tim-icons icon-book-bookmark",
    permission: 'achievements.view',
  },
  {
    layout: "/home",
    path: "/tournament",
    name: "Tournament",
    component: Tournament,
    icon: "tim-icons icon-trophy",
    permission: 'tournaments.view',
  },
  {
    layout: "/home",
    path: "/pending-withdrawals",
    name: "Withdrawals",
    sidebarName: "Operations",
    component: PendingWithdrawals,
    icon: "tim-icons icon-credit-card",
    permission: 'operations.view',
  },
  {
    layout: "/home",
    path: "/cashier",
    name: "Cashier",
    component: Cashier,
    icon: "tim-icons icon-money-coins",
    hidden: true,
    permission: 'cashier.view',
  },
  {
    layout: "/home",
    path: "/free-play",
    name: "Free Play",
    component: FreePlay,
    icon: "tim-icons icon-coins",
    hidden: true,
    permission: 'free_play.view',
  },
  {
    layout: "/home",
    path: "/users",
    name: "Users",
    sidebarName: "Players",
    component: Users,
    icon: "tim-icons icon-single-02",
    permission: 'players.view',
  },
  {
    layout: "/home",
    path: "/audit-log",
    name: "Admin Audit Log",
    component: AuditLog,
    icon: "tim-icons icon-notes",
    permission: 'audit.view',
  },
  {
    layout: "/home",
    path: "/settings",
    name: "Settings",
    component: Settings,
    icon: "tim-icons icon-settings-gear-63",
    hidden: true,
    permission: 'economy.view',
  },
];

export default routes;
