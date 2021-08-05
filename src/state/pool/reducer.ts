import { createReducer } from '@reduxjs/toolkit'
import { setPool } from './actions'

export interface PoolInfo {
  address: string;
  blockCreated: string;
  feeSnapshots?: (null)[] | null;
  feeTier: string;
  id: string;
  lastTouchWithoutFees: string;
  liquidity: string;
  lowerTick: string;
  manager: string;
  managerFee: string;
  positionId: string;
  supplySnapshots?: (SupplySnapshotsEntity)[] | null;
  token0: string;
  token1: string;
  totalSupply: string;
  uniswapPool: string;
  upperTick: string;
}
export interface SupplySnapshotsEntity {
  block: string;
  id: string;
  reserves0: string;
  reserves1: string;
}

interface PoolState {
  pools: Array<PoolInfo>;
}

export const initialState: PoolState = {
  pools: []
}
export default createReducer(initialState, (builder) =>
  builder
    .addCase(setPool, (state, action) => {
      state.pools = action.payload.pools;
    })
)