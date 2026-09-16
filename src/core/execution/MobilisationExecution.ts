import { Execution, Player } from "../game/Game";

export class MobilisationExecution implements Execution {
  constructor(
    private readonly player: Player,
    private readonly percentage: number,
  ) {}

  init(): void {
    if (this.player.isAlive() && this.player.hasSpawned()) {
      this.player.setMobilisationPercentage(this.percentage);
    }
  }

  tick(): void {}
  isActive(): boolean {
    return false;
  }
  activeDuringSpawnPhase(): boolean {
    return false;
  }
}
