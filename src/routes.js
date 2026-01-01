import AdminHomePage from "./views/homePage/index";
import Leaderboard from "./views/Leaderboard";
import factionalLeaderboard from "./views/Factional Leaderboard";
import Ring from "./views/Ring/index";
import SitnGo from "./views/SitnGo/index";
import Tourney from "./views/Tourney";
import Template from "./views/Templates";
import Achievement from "./views/Achievements";
import Tournament from "./views/Tournament";
import ConversionRate from "./views/ConversionRate";
import Swap from "./views/Swap";
import gameStore from "./views/Game Store";
import PendingWithdrawals from "./views/PendingWithdrawals";
import Users from "./views/Users";

var routes = [
  {
    layout: "/home",
    path: "/",
    component: AdminHomePage,
    hidden: true,
  },
  {
    layout: "/home",
    path: "/ring",
    name: "Ring",
    component: Ring,
    icon: "tim-icons icon-coins",
  },
  {
    layout: "/home",
    path: "/sitNgo",
    name: "SIT'N'GO",
    component: SitnGo,
    icon: "tim-icons icon-puzzle-10",
  },
  {
    layout: "/home",
    path: "/tourney",
    name: "Tourney",
    component: Tourney,
    icon: "tim-icons icon-controller",
  },
  {
    layout: "/home",
    path: "/template",
    name: "Template",
    component: Template,
    icon: "tim-icons icon-badge",
  },
  {
    layout: "/home",
    path: "/leaderboard",
    name: "Leaderboard",
    component: Leaderboard,
    icon: "tim-icons icon-planet",
  },
  {
    layout: "/home",
    path: "/factional-leaderboard",
    name: "Factional Leaderboard",
    component: factionalLeaderboard,
    icon: "tim-icons icon-molecule-40",
  },
  {
    layout: "/home",
    path: "/conversion-rate",
    name: "Conversion Rate",
    component: ConversionRate,
    icon: "tim-icons icon-money-coins",
  },
  {
    layout: "/home",
    path: "/swap",
    name: "Swap",
    component: Swap,
    icon: "tim-icons icon-wallet-43",
  },
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
    name: "Pending Withdrawals",
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
];

export default routes;