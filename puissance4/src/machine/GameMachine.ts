import { InterpreterFrom, createMachine, interpret } from 'xstate'
import { createModel } from 'xstate/lib/model'
import { GameContext, GameStates, GridState, Player, PlayerColor, Position } from '../types'
import { canDropGuard, canJoinGuard, canLeaveGuard, isWiningMoveGuard } from './guards'
import { dropTokenAction, joinGameAction, leaveGameAction, saveWiningPositions, switchPlayerAction } from './actions'



export const GameModel = createModel({
    players: [] as Player[],
    currentPlayer: null as null | Player['id'],
    rowLength:4,
    winingPositions: [] as Position[],
    grid: [
        ["E","E","E","E","E","E","E"],
        ["E","E","E","E","E","E","E"],
        ["E","E","E","E","E","E","E"],
        ["E","E","E","E","E","E","E"],
        ["E","E","E","E","E","E","E"],
        ["E","E","E","E","E","E","E"]
    ] as GridState
}, {
    events: {
        join: (playerId: Player["id"], name: Player["name"]) => ({playerId, name}),
        // alter: (playerId: Player["id"], name: Player["name"]) => ({playerId, name})
        leave: (playerId: Player["id"]) => ({playerId}),
        chooseColor: (playerId: Player["id"], color: PlayerColor) => ({playerId, color}),
        start: (playerId: Player["id"]) => ({playerId}),
        dropToken: (playerId: Player["id"], x: number) => ({playerId, x}),
        restart: (playerId: Player["id"]) => ({playerId})
    }
})



export const GameMachine = GameModel.createMachine({
id: 'game',
context: GameModel.initialContext,
initial : GameStates.LOBBY,
states: {
    [GameStates.LOBBY]:{
        on: {
            join:{
                cond: canJoinGuard,
                actions: [GameModel.assign(joinGameAction)],
                target: GameStates.LOBBY
            },
            leave: {
                cond: canLeaveGuard,
                actions: [GameModel.assign(leaveGameAction)],
                target: GameStates.LOBBY
            },
            chooseColor: {
                target: GameStates.LOBBY
            },
            start:{
                target: GameStates.PLAY
            }
        }
    },
    [GameStates.PLAY]: {
        on: {
        dropToken: [
        {
            cond: isWiningMoveGuard,
            target: GameStates.VICTORY,
            actions: [GameModel.assign(saveWiningPositions), GameModel.assign(dropTokenAction)]
        }
        ,{
            cond: canDropGuard,
            target: GameStates.PLAY,
            actions: [GameModel.assign(dropTokenAction), GameModel.assign
            (switchPlayerAction)]
        }
    ]
      }
    },
    [GameStates.VICTORY]:{
        on: {
            restart:{
                target: GameStates.LOBBY
            }
        }
    },
    [GameStates.DRAW]:{
        on: {
            restart:{
                target: GameStates.LOBBY
            }
        }
    }
}

})

export function makeGame  (state: GameStates = GameStates.LOBBY, context: Partial<GameContext> = {} ): InterpreterFrom<typeof GameMachine> {
    const machine = interpret(
        GameMachine.withContext({
            ...GameModel.initialContext,
            ...context
        })
    ).start()
    machine.state.value = state
    return machine
}