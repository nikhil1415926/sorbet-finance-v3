import { createAction } from "@reduxjs/toolkit";
import { PoolInfo } from './reducer';

export const setPool = createAction<{ pools: Array<PoolInfo> }>('pool/setPool')