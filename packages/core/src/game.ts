import type { Achievement, Event, Talent } from '@remake/data'
import { ages, AchievementOpportunity as Ao } from '@remake/data'
import type { GameState, GhostRouteState, ProfileState } from './state'
import { createState, nextProfile, propsEffect, applyIntelligenceLock } from './state'
import { summary as stateSummary } from './state'
import type { ReplacementResult, AdditionalPoints } from './talent'
import { pull, exclude, replacement, additionalPoints } from './talent'
import { trigger as ttr } from './talent'
import { trigger as atr } from './achievement'
import { trigger as etr, check as ec } from './event'
import type { RNG } from '@remake/vitex'
import { pick as pickOne, pickWeight, random } from '@remake/vitex'
import { produce, enableMapSet } from 'immer'
import {
    BreakthroughEventIds,
    ColorfulTalent,
    DaoEventIds,
} from './talents'
import {
    GhostNames,
    GhostRouteEvent,
    GhostRouteItemNames,
    GhostRouteTalentId,
    isGodCondition,
} from './ghost-route'
enableMapSet()

export interface TriggerResult<T> {
    state: GameState
    triggers: T[]
}
export interface PickResult {
    talents: ReplacementResult
    additionalPoints: AdditionalPoints
}
export function pick(talents: Iterable<Talent['id']>, rng?: RNG): PickResult {
    const r = replacement(talents, rng)
    const ap = additionalPoints(r.talents)
    return { talents: r, additionalPoints: ap }
}

export interface StartResult {
    state: GameState
    achievements: Achievement['id'][]
}
export function start(
    profile: ProfileState,
    ...args: Parameters<typeof createState>
): StartResult {
    const state = createState(...args)
    const ar = atr(Ao.Start, state, profile)
    return { state: ar.state, achievements: ar.triggers }
}
export interface NextResult {
    state: GameState
    age: number
    achievements: Achievement['id'][]
    events: Event['id'][]
    talents: Talent['id'][]
    end: boolean
    params?: Record<string, string>
}

const EmptyGhostRoute: GhostRouteState = {
    active: false,
    ghosts: [],
    items: [],
    fiveGhostChecked: false,
    becameAlien: false,
}

function updateGhostRoute(
    state: GameState,
    patch: Partial<GhostRouteState>,
) {
    return produce(state, draft => {
        draft.ghostRoute = {
            ...EmptyGhostRoute,
            ...(draft.ghostRoute ?? {}),
            ...patch,
        }
    })
}

function setStrength(state: GameState, value: number) {
    return produce(state, draft => {
        draft.props.current.strength = value
        draft.props.highest.strength = Math.max(
            draft.props.highest.strength,
            value,
        )
        draft.props.lowest.strength = Math.min(
            draft.props.lowest.strength,
            value,
        )
    })
}

function finishRoute(
    state: GameState,
    profile: ProfileState,
    age: number,
    events: Event['id'][],
    talents: Talent['id'][],
    params?: Record<string, string>,
): NextResult {
    const ar = atr(Ao.Trajectory, state, profile)
    return {
        state: ar.state,
        age,
        achievements: ar.triggers,
        events,
        talents,
        end: ar.state.life < 1,
        params,
    }
}

function nextGhostRoute(
    state: GameState,
    profile: ProfileState,
    age: number,
    talents: Talent['id'][],
    rng?: RNG,
): NextResult | null {
    const route = state.ghostRoute ?? EmptyGhostRoute
    if (!route.active) {
        if (age < 18 || !state.talents.has(GhostRouteTalentId)) return null
        const started = updateGhostRoute(state, {
            active: true,
            ghosts: ['鬼眼'],
        })
        const er = etr(GhostRouteEvent.Start, started, profile)
        return finishRoute(er.state, profile, age, er.triggers, talents)
    }

    if (isGodCondition(route.ghosts, route.items)) {
        const er = etr(GhostRouteEvent.God, state, profile)
        return finishRoute(er.state, profile, age, er.triggers, talents)
    }

    if (age >= 100) {
        const er = etr(GhostRouteEvent.Dismember, state, profile)
        return finishRoute(er.state, profile, age, er.triggers, talents)
    }

    if (!route.fiveGhostChecked && route.ghosts.length >= 5) {
        const checked = updateGhostRoute(state, { fiveGhostChecked: true })
        if (random(1, 0, rng) === 0) {
            const alien = updateGhostRoute(setStrength(checked, 500), {
                becameAlien: true,
            })
            const er = etr(GhostRouteEvent.Alien, alien, profile)
            return finishRoute(er.state, profile, age, er.triggers, talents)
        }
        const er = etr(GhostRouteEvent.Death, checked, profile)
        return finishRoute(er.state, profile, age, er.triggers, talents)
    }

    const availableGhosts = GhostNames.filter(
        name => !route.ghosts.includes(name),
    )
    const availableItems = GhostRouteItemNames.filter(
        name => !route.items.includes(name),
    )
    const outcomes: [string, number][] = [
        [
            'deathRevival',
            state.talents.has(ColorfulTalent.FaZeZhiZi) ? 5 : 10,
        ],
        ['deathHandle', 10],
        ['handle', 50],
    ]
    if (availableGhosts.length) outcomes.push(['ghost', 15])
    if (availableItems.length) outcomes.push(['item', 15])

    const outcome = pickWeight(outcomes, rng)!
    if (outcome === 'deathRevival' || outcome === 'deathHandle') {
        const er = etr(GhostRouteEvent.Death, state, profile)
        return finishRoute(er.state, profile, age, er.triggers, talents)
    }
    if (outcome === 'handle') {
        const er = etr(GhostRouteEvent.Handle, state, profile)
        return finishRoute(er.state, profile, age, er.triggers, talents)
    }
    if (outcome === 'ghost') {
        const ghost = pickOne(availableGhosts, rng)!
        let next = updateGhostRoute(state, {
            ghosts: [...route.ghosts, ghost],
        })
        const events: Event['id'][] = []
        let er = etr(GhostRouteEvent.NewGhost, next, profile)
        next = er.state
        events.push(...er.triggers)

        const current = next.ghostRoute ?? EmptyGhostRoute
        if (!current.fiveGhostChecked && current.ghosts.length >= 5) {
            next = updateGhostRoute(next, { fiveGhostChecked: true })
            if (random(1, 0, rng) === 0) {
                next = updateGhostRoute(setStrength(next, 500), {
                    becameAlien: true,
                })
                er = etr(GhostRouteEvent.Alien, next, profile)
            } else {
                er = etr(GhostRouteEvent.Death, next, profile)
            }
            next = er.state
            events.push(...er.triggers)
        } else if (
            isGodCondition(
                current.ghosts,
                current.items,
            )
        ) {
            er = etr(GhostRouteEvent.God, next, profile)
            next = er.state
            events.push(...er.triggers)
        }
        return finishRoute(next, profile, age, events, talents, { ghost })
    }

    const item = pickOne(availableItems, rng)!
    let next = updateGhostRoute(state, {
        items: [...route.items, item],
    })
    const events: Event['id'][] = []
    let er = etr(GhostRouteEvent.NewItem, next, profile)
    next = er.state
    events.push(...er.triggers)
    const current = next.ghostRoute ?? EmptyGhostRoute
    if (isGodCondition(current.ghosts, current.items)) {
        er = etr(GhostRouteEvent.God, next, profile)
        next = er.state
        events.push(...er.triggers)
    }
    return finishRoute(next, profile, age, events, talents, { item })
}

export function next(
    state: GameState,
    profile: ProfileState,
    rng?: RNG,
): NextResult {
    let s = produce(state, draft => {
        // 每年开始时兜底压制【智力残缺】的智力（保证"恒定 -1"）
        draft.props = applyIntelligenceLock(
            propsEffect(state.props, { age: 1 }),
            state.talents,
        )
    })
    const age = s.props.current.age
    const tr = ttr(s, profile, rng)
    const routed = nextGhostRoute(tr.state, profile, age, tr.triggers, rng)
    if (routed) return routed
    const ageEvents = ages.get(age)
    if (!ageEvents) {
        const ended = produce(tr.state, draft => {
            draft.life = 0
        })
        return {
            state: ended,
            age,
            achievements: [],
            events: [],
            talents: tr.triggers,
            end: true,
        }
    }
    const daoBoost = tr.state.talents.has(ColorfulTalent.FaZeZhiZi) ? 10 : 1
    const breakthroughBoost =
        tr.state.talents.has(ColorfulTalent.XianTianDaoTi) ? 10 : 1
    /**
     * 悟出大道的概率随智力提升：
     * 每 100 点智力 +20% 权重（乘法系数 = 1 + 智力 / 500），上限 10 倍。
     * 例：智力 100 → 1.2 倍；500 → 2 倍；2000 → 5 倍；4500 及以上 → 10 倍。
     */
    const daoIntelligenceBoost = Math.min(
        10,
        1 + Math.max(0, tr.state.props.current.intelligence) / 500,
    )
    const events = ageEvents.event
        .filter(([e]) => ec(e, tr.state, profile))
        .map(([e, weight]) => [
            e,
            weight *
                (daoBoost > 1 && DaoEventIds.has(e) ? daoBoost : 1) *
                (DaoEventIds.has(e) ? daoIntelligenceBoost : 1) *
                (breakthroughBoost > 1 && BreakthroughEventIds.has(e)
                    ? breakthroughBoost
                    : 1),
        ] as [number, number])
    const event = pickWeight(events, rng)
    if (!event) {
        const er = etr(10069, tr.state, profile)
        const ar = atr(Ao.Trajectory, er.state, profile)
        return {
            state: ar.state,
            age,
            achievements: ar.triggers,
            events: er.triggers,
            talents: tr.triggers,
            end: ar.state.life < 1,
        }
    }
    const er = etr(event, tr.state, profile)
    const ar = atr(Ao.Trajectory, er.state, profile)
    // 兜底：【生生不息】复活后若仍处于必死状态（如事件池耗尽），直接结束，避免卡死
    let finalState = ar.state
    if (
        finalState.life < 1 &&
        finalState.talents.has(ColorfulTalent.ShengShengBuXi)
    ) {
        finalState = produce(finalState, draft => {
            draft.life = 0
        })
    }
    const end = finalState.life < 1
    return {
        state: finalState,
        age,
        achievements: ar.triggers,
        events: er.triggers,
        talents: tr.triggers,
        end,
    }
}

export interface SummaryResult {
    state: GameState
    summary: number
    achievements: Achievement['id'][]
}
export function summary(
    state: GameState,
    profile: ProfileState,
): SummaryResult {
    const ar = atr(Ao.Summary, state, profile)
    const s = stateSummary(ar.state)
    return { state: ar.state, summary: s, achievements: ar.triggers }
}

export interface EndResult {
    profile: ProfileState
    achievements: Achievement['id'][]
}

export function end(
    state: GameState,
    profile: ProfileState,
    locked?: Talent['id'][],
) {
    const ar = atr(Ao.End, state, profile)
    const p = nextProfile(profile, ar.state, locked)
    return { profile: p, achievements: ar.triggers }
}

export { pull, exclude }
