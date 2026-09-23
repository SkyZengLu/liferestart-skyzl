import { type Event, events } from '@remake/data'
import type { Properties, GameState, ProfileState } from './state'
import { propsEffectWithTalents, createFlatState } from './state'
import { check as checkCondition } from '@remake/condition'
import type { TriggerResult } from './game'
import { produce } from 'immer'
import { ColorfulTalent, EndlessReviveEventId } from './talents'

export function check(
    event: Event['id'],
    state: GameState,
    profile: ProfileState,
) {
    const { include, exclude, NoRandom } = events.get(event)!
    if (NoRandom) return false
    const flatState = createFlatState(state, profile)
    if (exclude && checkCondition(flatState, exclude)) return false
    if (include) return checkCondition(flatState, include)
    return true
}

/**
 * 【生生不息】是否应把本次死亡救回：
 * 需要拥有该彩色天赋，且当前智力为负数。
 */
export function shouldEndlessRevive(state: GameState, newState: GameState) {
    if (!state.talents.has(ColorfulTalent.ShengShengBuXi)) return false
    if (newState.props.current.intelligence >= 0) return false
    return newState.life < 1 || newState.props.current.age < 0
}

export function trigger(
    eventId: number,
    state: GameState,
    profile: ProfileState,
): TriggerResult<Event['id']> {
    const { effect, branch } = events.get(eventId)!
    let newState = produce(state, draft => {
        draft.events.add(eventId)
        if (!effect) return
        if (effect.LIF) draft.life += effect.LIF
        const pe: Partial<Properties> = {}
        const tenfold = state.talents.has(ColorfulTalent.XianTianDaoTi)
        const multiply = (value: number) =>
            tenfold && value > 0 ? value * 10 : value
        if (effect.CHR) pe.charm = effect.CHR
        if (effect.INT) pe.intelligence = multiply(effect.INT)
        if (effect.STR) pe.strength = multiply(effect.STR)
        if (effect.MNY) pe.money = effect.MNY
        if (effect.SPR) pe.spirit = effect.SPR
        if (effect.AGE) pe.age = effect.AGE
        draft.props = propsEffectWithTalents(draft.props, pe, state.talents)
    })

    // 【生生不息】：智力为负时死亡会被复活
    const revived = shouldEndlessRevive(state, newState)
    if (revived) {
        newState = produce(newState, draft => {
            draft.life = 1
            if (draft.props.current.age < 0) draft.props.current.age = 0
            draft.events.add(EndlessReviveEventId)
        })
    }

    const flatState = createFlatState(newState, profile)
    const revivedSuffix = revived ? [EndlessReviveEventId] : []
    if (branch) {
        for (const { condition, event } of branch) {
            if (checkCondition(flatState, condition)) {
                const result = trigger(event, newState, profile)
                return {
                    state: result.state,
                    triggers: [eventId, ...revivedSuffix, ...result.triggers],
                }
            }
        }
    }
    return { state: newState, triggers: [eventId, ...revivedSuffix] }
}
