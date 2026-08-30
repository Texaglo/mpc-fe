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
  },
  {
    layout: "/home",
    path: "/mpce-ledger",
    name: "House MPCE Ledger",
    component: MpceLedger,
    icon: "tim-icons icon-bank",
    hidden: true,
  },
  {
    layout: "/home",
    path: "/progress",
    name: "Launch Progress",
    component: Progress,
    icon: "tim-icons icon-check-2",
    hidden: true,
  },
  {
    layout: "/home",
    path: "/games",
    name: "Games",
    component: Games,
    icon: "tim-icons icon-controller",
  },
  {
    layout: "/home",
    path: "/leaderboards",
    name: "Leaderboards",
    component: Leaderboards,
    icon: "tim-icons icon-planet",
    hidden: true,
  },
  {
    layout: "/home",
    path: "/hand-history",
    name: "Hand History",
    component: HandHistory,
    icon: "tim-icons icon-notes",
    hidden: true,
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
  },
  {
    layout: "/home",
    path: "/marketplace",
    name: "Marketplace",
    component: Marketplace,
    icon: "tim-icons icon-cart",
    hidden: true,
  },
  {
    layout: "/home",
    path: "/achievement",
    name: "Achievements",
    component: Achievement,
    icon: "tim-icons icon-book-bookmark",
  },
  {
    layout: "/home",
    path: "/tournament",
    name: "Tournament",
    component: Tournament,
    icon: "tim-icons icon-trophy",
  },
  {
    layout: "/home",
    path: "/pending-withdrawals",
    name: "Withdrawals",
    sidebarName: "Operations",
    component: PendingWithdrawals,
    icon: "tim-icons icon-credit-card",
  },
  {
    layout: "/home",
    path: "/cashier",
    name: "Cashier",
    component: Cashier,
    icon: "tim-icons icon-money-coins",
    hidden: true,
  },
  {
    layout: "/home",
    path: "/free-play",
    name: "Free Play",
    component: FreePlay,
    icon: "tim-icons icon-coins",
    hidden: true,
  },
  {
    layout: "/home",
    path: "/users",
    name: "Users",
    sidebarName: "Players",
    component: Users,
    icon: "tim-icons icon-single-02",
  },
  {
    layout: "/home",
    path: "/audit-log",
    name: "Admin Audit Log",
    component: AuditLog,
    icon: "tim-icons icon-notes",
  },
  {
    layout: "/home",
    path: "/settings",
    name: "Settings",
    component: Settings,
    icon: "tim-icons icon-settings-gear-63",
    hidden: true,
  },
];

export default routes;
