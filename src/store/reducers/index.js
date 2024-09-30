import Auth from "./Auth";
import { combineReducers } from "redux";
import Ring from "./Ring"
import SitnGo from "./SitnGo"
import Tournament from "./Tournament";
import Leaderboard from "./Leaderboard";
import Achievement from "./Achievement";
import Template from "./Template";
import WithdrawSwap from "./WithdrawSwap";
import GameStore from "./GameStore";

export default combineReducers(
  {
    Auth: Auth,
    Ring: Ring,
    SitnGo: SitnGo,
    Template: Template,
    Tournament: Tournament,
    Leaderboard: Leaderboard,
    Achievement: Achievement,
    WithdrawSwap: WithdrawSwap,
    GameStore: GameStore
  });
