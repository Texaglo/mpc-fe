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

var routes = [
  {
    layout: "/home",
    path: "/dashboard",
    name: "Dashboard",
    component: AdminHomePage,
    icon: "tim-icons icon-chart-pie-36",
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
    component: gameStore,
    icon: "tim-icons icon-bag-16",
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
    component: PendingWithdrawals,
    icon: "tim-icons icon-credit-card",
  },
  {
    layout: "/home",
    path: "/users",
    name: "Users",
    component: Users,
    icon: "tim-icons icon-single-02",
  },
  {
    layout: "/home",
    path: "/settings",
    name: "Settings",
    component: Settings,
    icon: "tim-icons icon-settings-gear-63",
  },
];

export default routes;