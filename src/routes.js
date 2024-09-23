import AdminHomePage from "./views/homePage/index";
import Leaderboard from "./views/Leaderboard";
import factionalLeaderboard from "./views/Factional Leaderboard";
import Ring from "./views/Ring/index";
import SitnGo from "./views/SitnGo/index";
import Tourney from "./views/Tourney";
import Template from "./views/Templates";
import Achievement from "./views/Achievements";

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
    path: "/Achievements",
    name: "Achievements",
    component: Achievement,
    icon: "tim-icons icon-gift-2",
  },
];

export default routes;