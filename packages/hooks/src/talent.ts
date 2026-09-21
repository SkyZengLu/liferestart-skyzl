import { useState, useCallback } from 'react'
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai'
import { useConfig, useProfile, useSetStep, Step } from '.'
import { pull, exclude, pick, type PickResult } from '@remake/core'
import { talents as talentData, type Talent } from '@remake/data'
import type { RNG } from '@remake/vitex'

const ColorfulGrade = 4

export const pickedAtom = atom(new Set<Talent['id']>())
export const replacedAtom = atom<PickResult | null>(null)

export const useTalentReset = () => {
    const setPicked = useSetAtom(pickedAtom)
    const setReplaced = useSetAtom(replacedAtom)
    return useCallback(() => {
        setPicked(new Set())
        setReplaced(null)
    }, [setPicked, setReplaced])
}

export const usePicked = () => {
    const picked = useAtomValue(pickedAtom)
    if (!picked) throw new Error('No talents picked')
    return picked
}
export const useReplaced = () => {
    const replaced = useAtomValue(replacedAtom)
    if (!replaced) throw new Error('No talents replaced')
    return replaced
}

export const useTalentPuller = () => {
    const { pull: p } = useConfig()
    const [profile] = useProfile()
    const [pulled, setPulled] = useState<Talent['id'][] | null>(null)
    const puller = useCallback(
        (rng?: RNG) => setPulled(pull(p, profile, rng)),
        [p, profile, setPulled],
    )
    return [pulled, puller] as const
}

export type PickOk = { type: 'ok'; talent?: never }
export type PickNe = { type: 'ne'; talent?: never }
export type PickLimit = { type: 'limit'; talent?: never }
export type PickEx = { type: 'ex'; talent: Talent['id'] }
export type PickerResult = PickOk | PickNe | PickLimit | PickEx

export const useTalentClear = () => {
    const setPicked = useSetAtom(pickedAtom)
    return useCallback(() => setPicked(new Set()), [setPicked])
}

export const useColorfulLimit = () => {
    const [profile] = useProfile()
    const count = profile.achievements.size
    return 1 + Math.min(4, Math.floor(count / 40))
}

export const useTalentPicker = (maxOverride?: number) => {
    const { max: configMax } = useConfig()
    const max = maxOverride ?? configMax
    const colorfulLimit = useColorfulLimit()
    const [picked, setPicked] = useAtom(pickedAtom)
    const picker = useCallback(
        (talent: Talent['id']): PickerResult => {
            if (!picked) {
                setPicked(new Set([talent]))
                return { type: 'ok' }
            }
            if (picked.has(talent)) {
                const next = new Set(picked)
                next.delete(talent)
                setPicked(next)
                return { type: 'ok' }
            }
            if (picked.size >= max) return { type: 'ne' }
            const colorfulCount = Array.from(picked).filter(
                id => talentData.get(id)?.grade === ColorfulGrade,
            ).length
            if (
                talentData.get(talent)?.grade === ColorfulGrade &&
                colorfulCount >= colorfulLimit
            ) {
                return { type: 'limit' }
            }
            const e = exclude(talent, picked)
            if (e) return { type: 'ex', talent: e }
            const next = new Set([...picked, talent])
            setPicked(next)
            return { type: 'ok' }
        },
        [colorfulLimit, max, picked, setPicked],
    )
    return [picked, picker, colorfulLimit] as const
}

export const useSubmitIsEnable = (
    minOverride?: number,
    maxOverride?: number,
) => {
    const { max: configMax, min: configMin } = useConfig()
    const min = minOverride ?? configMin
    const max = maxOverride ?? configMax
    const picked = useAtomValue(pickedAtom)
    const enabled = picked.size >= min && picked.size <= max
    return { min, max, enabled } as const
}

export const useTalentSubmit = (enabledOverride?: boolean) => {
    const picked = useAtomValue(pickedAtom)
    const setReplaced = useSetAtom(replacedAtom)
    const { enabled: defaultEnabled } = useSubmitIsEnable()
    const enabled = enabledOverride ?? defaultEnabled
    const setStep = useSetStep()
    return useCallback(
        (rng?: RNG) => {
            if (!enabled) throw new Error('Not enough talents picked')
            setReplaced(pick(picked, rng))
            setStep(Step.Alloc)
        },
        [enabled, picked, setReplaced, setStep],
    )
}
