/** Tracks the player's coins. Coins can never go negative. */
export class Economy {
    private _coins: number;
    totalEarned = 0;
    totalSpent = 0;
    private readonly onChange?: (coins: number) => void;

    constructor(startCoins: number, onChange?: (coins: number) => void) {
        this._coins = Math.max(0, Math.floor(startCoins));
        this.onChange = onChange;
    }

    get coins(): number { return this._coins; }

    canAfford(amount: number): boolean {
        return amount >= 0 && this._coins >= amount;
    }

    /** Deducts coins if affordable. Returns false (and changes nothing) otherwise. */
    spend(amount: number): boolean {
        if (!Number.isFinite(amount) || amount < 0 || !this.canAfford(amount)) return false;
        this._coins -= amount;
        this.totalSpent += amount;
        this.onChange?.(this._coins);
        return true;
    }

    earn(amount: number): void {
        if (!Number.isFinite(amount) || amount <= 0) return;
        const a = Math.floor(amount);
        this._coins += a;
        this.totalEarned += a;
        this.onChange?.(this._coins);
    }

    /** Refunds are added to the balance but do not count as earnings. */
    refund(amount: number): void {
        if (!Number.isFinite(amount) || amount <= 0) return;
        this._coins += Math.floor(amount);
        this.onChange?.(this._coins);
    }
}
