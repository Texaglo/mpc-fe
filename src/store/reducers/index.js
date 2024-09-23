import Auth from "./Auth";
import { combineReducers } from "redux";
import Ring from "./Ring"
import SitnGo from "./SitnGo"
import Tournament from "./Tournament";
import Leaderboard from "./Leaderboard";
import Achievement from "./Achievement";
import Template from "./Template";
export default combineReducers(
  {
    Auth: Auth,
    Ring: Ring,
    SitnGo: SitnGo,
    Template: Template,
    Tournament: Tournament,
    Leaderboard: Leaderboard,
    Achievement: Achievement,
  });
