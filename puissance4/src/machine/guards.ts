import { GameContext, GameEvent, GameGuard } from "../types";

export const canJoinGuard: GameGuard<"join"> = (context : GameContext, event: GameEvent<"join">) => {
    return context.players.length <2 && context.players.find( p => p.id === event.playerId) === undefined
}