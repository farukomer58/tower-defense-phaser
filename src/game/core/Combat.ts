import { ARMORED_THRESHOLD, type DamageType } from '../config/towerConfig';
import type { Enemy } from './Enemy';

/**
 * Damage after armour, magic resist, shields and bonuses.
 * - physical: reduced by armour (armour pierce ignores part of it)
 * - magic: reduced by magic resist, with a bonus against armoured enemies
 * - fire: half of the armour applies; burn-immune enemies take only a little
 */
export function mitigatedDamage(enemy: Enemy, raw: number, type: DamageType, armorPierce = 0, armoredBonus = 1): number {
    let mult: number;
    switch (type) {
        case 'physical':
            mult = 1 - enemy.armor * (1 - armorPierce);
            break;
        case 'magic':
            mult = 1 - enemy.magicResist;
            if (enemy.armor >= ARMORED_THRESHOLD) mult *= armoredBonus;
            break;
        case 'fire':
            mult = enemy.def.burnImmune ? 0.25 : 1 - enemy.armor * 0.5;
            break;
    }
    if (enemy.isShielded && enemy.def.shield) mult *= 1 - enemy.def.shield.reduction;
    return Math.max(0, raw * mult);
}
