import type { IStockMoveRepository } from "@/src/application/repositories/IStockMoveRepository";

export class GetOnHandUseCase {
  constructor(private readonly stockMoves: IStockMoveRepository) {}

  execute(shopId: string, productId: string): Promise<number> {
    return this.stockMoves.onHandByProduct(shopId, productId);
  }
}
